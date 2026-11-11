const Student = require('../models/Student');
const Class = require('../models/Class');
const Score = require('../models/Score');
const Department = require('../models/Department');
const Settings = require('../models/Settings');
const { buildCSV } = require('../utils/genericCsv');
const { buildXLSX } = require('../utils/genericXlsx');
const { buildTablePDF } = require('../utils/genericPdf');
const { parseFileBuffer, normalizeStudentRows } = require('../utils/fileImporter');

const EXPORT_HEADERS = [
  { key: 'no', label: 'No.' },
  { key: 'admissionNumber', label: 'Admission No' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'className', label: 'Class' },
  { key: 'department', label: 'Department' },
  { key: 'level', label: 'Level' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status' }
];

const buildStudentRows = (students) =>
  students.map((s, i) => ({
    no: i + 1,
    admissionNumber: s.admissionNumber || '',
    fullName: s.fullName || '',
    className: s.classId?.className || '',
    department: s.classId?.departmentId?.name || '',
    level: s.classId?.level || '',
    phone: s.phone || '',
    status: s.isActive ? 'Active' : 'Inactive'
  }));

const applyEOFilter = async (req, query) => {
  if (req.departments && req.departments.length > 0) {
    const classIds = await Class.find({
      adminId: req.tenantId,
      departmentId: { $in: req.departments },
      isActive: true
    }).distinct('_id');
    query.classId = { $in: classIds };
  }
  return query;
};

const buildQuery = async (req) => {
  const tenantId = req.tenantId;
  const { classId, departmentId, search } = req.query;

  let query = { adminId: tenantId, isActive: true };

  if (classId) {
    query.classId = classId;
  } else if (departmentId) {
    const classIds = await Class.find({
      adminId: tenantId,
      departmentId,
      isActive: true
    }).distinct('_id');
    query.classId = { $in: classIds };
  }

  query = await applyEOFilter(req, query);

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { admissionNumber: { $regex: search, $options: 'i' } }
    ];
  }

  return query;
};

const getStudents = async (req, res) => {
  try {
    const query = await buildQuery(req);

    const students = await Student.find(query)
      .populate({
        path: 'classId',
        select: 'className departmentId level',
        populate: { path: 'departmentId', select: 'name' }
      })
      .sort({ fullName: 1 });

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportStudents = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { format = 'csv' } = req.query;
    const query = await buildQuery(req);

    const students = await Student.find(query)
      .populate({
        path: 'classId',
        select: 'className departmentId level',
        populate: { path: 'departmentId', select: 'name' }
      })
      .sort({ fullName: 1 });

    const rows = buildStudentRows(students);
    const dateStamp = new Date().toISOString().split('T')[0];
    const filename = `students-${dateStamp}`;

    if (format === 'xlsx') {
      const buffer = buildXLSX(EXPORT_HEADERS, rows, 'Students');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const settings = await Settings.findOne({ adminId: tenantId });
      const buffer = await buildTablePDF({
        settings,
        title: 'Student List',
        meta: [{ label: 'Date', value: new Date().toLocaleDateString() }, { label: 'Total', value: students.length }],
        headers: EXPORT_HEADERS,
        rows
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      return res.send(buffer);
    }

    const csv = buildCSV(EXPORT_HEADERS, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const importStudents = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId } = req.body;

    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No file' });
    if (!classId) return res.status(400).json({ message: 'Class ID required' });

    const cls = await Class.findOne({ _id: classId, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    let rawRows;
    try {
      rawRows = parseFileBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const rows = normalizeStudentRows(rawRows).filter((r) => r.fullName && r.admissionNumber);
    if (rows.length === 0) return res.status(400).json({ message: 'No valid rows' });

    const created = [];
    const skipped = [];
    const errors = [];
    const seen = new Set();

    for (const row of rows) {
      const { admissionNumber, fullName, phone } = row;

      if (!admissionNumber) {
        errors.push({ admissionNumber, fullName, message: 'Admission number required' });
        continue;
      }
      if (!fullName) {
        errors.push({ admissionNumber, fullName, message: 'Full name required' });
        continue;
      }

      const key = admissionNumber.toLowerCase();
      if (seen.has(key)) {
        skipped.push({ admissionNumber, fullName, reason: 'Duplicate in file' });
        continue;
      }
      seen.add(key);

      const existing = await Student.findOne({ admissionNumber, adminId: tenantId, isActive: true });
      if (existing) {
        skipped.push({ admissionNumber, fullName, reason: 'Already exists' });
        continue;
      }

      const student = new Student({ adminId: tenantId, admissionNumber, fullName, classId, phone: phone || '' });
      await student.save();
      created.push(student);
    }

    res.status(201).json({
      message: 'Import complete',
      total: rows.length,
      created: created.length,
      skipped: skipped.length,
      errors: errors.length,
      skippedRows: skipped,
      errorRows: errors
    });
  } catch (error) {
    console.error('Import students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addBulkStudents = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { classId, students } = req.body;

    if (!classId) return res.status(400).json({ message: 'Class ID required' });
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'No students provided' });
    }

    const cls = await Class.findOne({ _id: classId, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const created = [];
    const skipped = [];
    const seen = new Set();

    for (const row of students) {
      const admissionNumber = (row.admissionNumber || '').trim();
      const fullName = (row.fullName || '').trim();
      const phone = (row.phone || '').trim();

      if (!admissionNumber || !fullName) {
        skipped.push({ admissionNumber, fullName, reason: 'Admission and name required' });
        continue;
      }

      const key = admissionNumber.toLowerCase();
      if (seen.has(key)) {
        skipped.push({ admissionNumber, fullName, reason: 'Duplicate in list' });
        continue;
      }
      seen.add(key);

      const existing = await Student.findOne({ admissionNumber, adminId: tenantId, isActive: true });
      if (existing) {
        skipped.push({ admissionNumber, fullName, reason: 'Already exists' });
        continue;
      }

      const student = new Student({ adminId: tenantId, admissionNumber, fullName, classId, phone });
      await student.save();
      created.push(student);
    }

    res.status(201).json({
      message: 'Bulk add complete',
      total: students.length,
      created: created.length,
      skipped: skipped.length,
      skippedRows: skipped
    });
  } catch (error) {
    console.error('Bulk students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const student = await Student.findOne({ _id: req.params.id, adminId: tenantId }).populate({
      path: 'classId',
      select: 'className departmentId level',
      populate: { path: 'departmentId', select: 'name' }
    });

    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStudentsByClass = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const students = await Student.find({
      classId: req.params.classId,
      adminId: tenantId,
      isActive: true
    }).sort({ fullName: 1 });
    res.json(students);
  } catch (error) {
    console.error('Get students by class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createStudent = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { admissionNumber, fullName, classId, phone } = req.body;

    if (!admissionNumber || !admissionNumber.trim()) {
      return res.status(400).json({ message: 'Admission number required' });
    }
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name required' });
    }

    const cls = await Class.findOne({ _id: classId, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const existing = await Student.findOne({
      admissionNumber: admissionNumber.trim(),
      adminId: tenantId,
      isActive: true
    });
    if (existing) return res.status(400).json({ message: 'Admission number already exists' });

    const student = new Student({
      adminId: tenantId,
      admissionNumber: admissionNumber.trim(),
      fullName: fullName.trim(),
      classId,
      phone: phone || ''
    });

    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBulkStudents = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { students, classId } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'No students provided' });
    }

    const cls = await Class.findOne({ _id: classId, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const created = [];
    const errors = [];

    for (const s of students) {
      const admissionNumber = (s.admissionNumber || '').trim();
      const fullName = (s.fullName || '').trim();

      if (!admissionNumber || !fullName) {
        errors.push({ admissionNumber, message: 'Admission and name required' });
        continue;
      }

      const existing = await Student.findOne({ admissionNumber, adminId: tenantId, isActive: true });
      if (existing) {
        errors.push({ admissionNumber, message: 'Already exists' });
        continue;
      }

      const student = new Student({
        adminId: tenantId,
        admissionNumber,
        fullName,
        classId,
        phone: (s.phone || '').trim()
      });
      await student.save();
      created.push(student);
    }

    res.status(201).json({ created, errors, totalCreated: created.length, totalErrors: errors.length });
  } catch (error) {
    console.error('Bulk create students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { admissionNumber, fullName, classId, phone } = req.body;

    const student = await Student.findOne({ _id: req.params.id, adminId: tenantId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (admissionNumber && admissionNumber !== student.admissionNumber) {
      const existing = await Student.findOne({
        admissionNumber,
        adminId: tenantId,
        isActive: true,
        _id: { $ne: student._id }
      });
      if (existing) return res.status(400).json({ message: 'Admission number already exists' });
      student.admissionNumber = admissionNumber;
    }

    if (fullName !== undefined) student.fullName = fullName;
    if (classId !== undefined) student.classId = classId;
    if (phone !== undefined) student.phone = phone;

    await student.save();
    res.json(student);
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const student = await Student.findOne({ _id: req.params.id, adminId: tenantId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.isActive = false;
    await student.save();
    await Score.deleteMany({ studentId: student._id, adminId: tenantId });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  getStudentsByClass,
  createStudent,
  createBulkStudents,
  addBulkStudents,
  updateStudent,
  deleteStudent,
  exportStudents,
  importStudents
};