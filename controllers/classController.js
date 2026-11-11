const Class = require('../models/Class');
const Student = require('../models/Student');
const Score = require('../models/Score');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Settings = require('../models/Settings');
const { buildCSV } = require('../utils/genericCsv');
const { buildXLSX } = require('../utils/genericXlsx');
const { buildTablePDF } = require('../utils/genericPdf');
const { parseFileBuffer, normalizeClassRows, normalizeUnitRows } = require('../utils/fileImporter');

const getClasses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId, courseId } = req.query;

    const query = { adminId: tenantId, isActive: true };
    if (req.departments && req.departments.length > 0) {
      query.departmentId = { $in: req.departments };
    } else if (departmentId) {
      query.departmentId = departmentId;
    }
    if (courseId) query.courseId = courseId;

    const classes = await Class.find(query)
      .populate('departmentId', 'name')
      .populate('courseId', 'name code')
      .sort({ className: 1 });

    const withCounts = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({
          classId: cls._id,
          adminId: tenantId,
          isActive: true
        });
        return { ...cls.toObject(), studentCount, unitCount: cls.units.length };
      })
    );

    res.json(withCounts);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getClassById = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const cls = await Class.findOne({ _id: req.params.id, adminId: tenantId })
      .populate('departmentId', 'name')
      .populate('courseId', 'name code');

    if (!cls) return res.status(404).json({ message: 'Class not found' });

    if (req.departments && req.departments.length > 0 && !req.departments.includes(cls.departmentId._id.toString())) {
      return res.status(403).json({ message: 'Access denied to this department' });
    }

    const students = await Student.find({
      classId: cls._id,
      adminId: tenantId,
      isActive: true
    }).sort({ fullName: 1 });

    res.json({ ...cls.toObject(), students });
  } catch (error) {
    console.error('Get class by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createClass = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { className, departmentId, courseId, level, description, academicYear } = req.body;

    if (!className || !className.trim()) return res.status(400).json({ message: 'Class name required' });
    if (!departmentId) return res.status(400).json({ message: 'Department required' });
    if (!courseId) return res.status(400).json({ message: 'Course required' });
    if (!level) return res.status(400).json({ message: 'Level required' });

    if (req.departments && req.departments.length > 0 && !req.departments.includes(departmentId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const department = await Department.findOne({ _id: departmentId, adminId: tenantId });
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const course = await Course.findOne({ _id: courseId, adminId: tenantId, departmentId });
    if (!course) return res.status(404).json({ message: 'Course not found in department' });

    const existing = await Class.findOne({ className: className.trim(), adminId: tenantId });
    if (existing) return res.status(400).json({ message: 'Class already exists' });

    const cls = new Class({
      adminId: tenantId,
      className: className.trim(),
      departmentId,
      courseId,
      level: Number(level),
      description: description || '',
      academicYear: academicYear || undefined
    });

    await cls.save();
    res.status(201).json(cls);
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addBulkClasses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId, courseId, classes } = req.body;

    if (!departmentId || !courseId) {
      return res.status(400).json({ message: 'Department and course are required' });
    }
    if (!Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: 'No classes provided' });
    }

    const course = await Course.findOne({ _id: courseId, adminId: tenantId, departmentId });
    if (!course) return res.status(404).json({ message: 'Course not found in department' });

    const created = [];
    const skipped = [];

    for (const row of classes) {
      const className = (row.className || '').trim();
      const level = Number(row.level);

      if (!className) {
        skipped.push({ className, reason: 'Name required' });
        continue;
      }
      if (!level || ![4, 5, 6].includes(level)) {
        skipped.push({ className, reason: 'Level required (4, 5, or 6)' });
        continue;
      }

      const existing = await Class.findOne({ className, adminId: tenantId });
      if (existing) {
        skipped.push({ className, reason: 'Already exists' });
        continue;
      }

      const cls = new Class({
        adminId: tenantId,
        className,
        departmentId,
        courseId,
        level
      });
      await cls.save();
      created.push(cls);
    }

    res.status(201).json({
      message: 'Bulk add complete',
      total: classes.length,
      created: created.length,
      skipped: skipped.length,
      skippedRows: skipped
    });
  } catch (error) {
    console.error('Bulk classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const importClasses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId, courseId } = req.body;

    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No file' });
    if (!departmentId || !courseId) return res.status(400).json({ message: 'Dept and course required' });

    const course = await Course.findOne({ _id: courseId, adminId: tenantId, departmentId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    let rawRows;
    try {
      rawRows = parseFileBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const rows = normalizeClassRows(rawRows).filter((r) => r.className);
    if (rows.length === 0) return res.status(400).json({ message: 'No valid rows' });

    const created = [];
    const skipped = [];

    for (const row of rows) {
      const { className, level } = row;
      const numLevel = Number(level);

      if (!numLevel || ![4, 5, 6].includes(numLevel)) {
        skipped.push({ className, reason: 'Invalid level' });
        continue;
      }

      const existing = await Class.findOne({ className, adminId: tenantId });
      if (existing) {
        skipped.push({ className, reason: 'Already exists' });
        continue;
      }

      const cls = new Class({
        adminId: tenantId,
        className,
        departmentId,
        courseId,
        level: numLevel
      });
      await cls.save();
      created.push(cls);
    }

    res.status(201).json({
      message: 'Import complete',
      total: rows.length,
      created: created.length,
      skipped: skipped.length,
      skippedRows: skipped
    });
  } catch (error) {
    console.error('Import classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportClasses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId, courseId, format = 'csv' } = req.query;

    const query = { adminId: tenantId, isActive: true };
    if (departmentId) query.departmentId = departmentId;
    if (courseId) query.courseId = courseId;

    const classes = await Class.find(query)
      .populate('departmentId', 'name')
      .populate('courseId', 'name')
      .sort({ className: 1 });

    const headers = [
      { key: 'no', label: 'No.' },
      { key: 'className', label: 'Class Name' },
      { key: 'department', label: 'Department' },
      { key: 'course', label: 'Course' },
      { key: 'level', label: 'Level' },
      { key: 'students', label: 'Students' },
      { key: 'units', label: 'Units' }
    ];

    const rows = await Promise.all(
      classes.map(async (c, i) => {
        const studentCount = await Student.countDocuments({
          classId: c._id,
          adminId: tenantId,
          isActive: true
        });
        return {
          no: i + 1,
          className: c.className,
          department: c.departmentId?.name || '-',
          course: c.courseId?.name || '-',
          level: c.level ? `Level ${c.level}` : '-',
          students: studentCount,
          units: c.units.length
        };
      })
    );

    const dateStamp = new Date().toISOString().split('T')[0];
    const baseName = `classes-${dateStamp}`;

    if (format === 'xlsx') {
      const buffer = buildXLSX(headers, rows, 'Classes');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const settings = await Settings.findOne({ adminId: tenantId });
      const buffer = await buildTablePDF({
        settings,
        title: 'Classes List',
        meta: [{ label: 'Date', value: new Date().toLocaleDateString() }],
        headers,
        rows
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
      return res.send(buffer);
    }

    const csv = buildCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateClass = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { className, departmentId, courseId, level, description, academicYear } = req.body;

    const cls = await Class.findOne({ _id: req.params.id, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    if (req.departments && req.departments.length > 0 && !req.departments.includes(cls.departmentId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (className && className.trim() !== cls.className) {
      const existing = await Class.findOne({
        className: className.trim(),
        adminId: tenantId,
        _id: { $ne: cls._id }
      });
      if (existing) return res.status(400).json({ message: 'Class name already exists' });
      cls.className = className.trim();
    }

    if (departmentId && departmentId !== cls.departmentId.toString()) {
      const department = await Department.findOne({ _id: departmentId, adminId: tenantId });
      if (!department) return res.status(404).json({ message: 'Department not found' });
      cls.departmentId = departmentId;
    }

    if (courseId !== undefined) {
      if (courseId) {
        const course = await Course.findOne({
          _id: courseId,
          adminId: tenantId,
          departmentId: cls.departmentId
        });
        if (!course) return res.status(404).json({ message: 'Course not found in department' });
        cls.courseId = courseId;
      } else {
        cls.courseId = null;
      }
    }

    if (level !== undefined) cls.level = level;
    if (description !== undefined) cls.description = description;
    if (academicYear !== undefined) cls.academicYear = academicYear;

    await cls.save();
    res.json(cls);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteClass = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const cls = await Class.findOne({ _id: req.params.id, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    if (req.departments && req.departments.length > 0 && !req.departments.includes(cls.departmentId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    cls.isActive = false;
    await cls.save();
    await Score.deleteMany({ classId: cls._id, adminId: tenantId });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addUnit = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, code, formativeCount } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ message: 'Unit name required' });
    if (!code || !code.trim()) return res.status(400).json({ message: 'Unit code required' });

    const cls = await Class.findOne({ _id: req.params.id, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const existing = cls.units.find((u) => u.code.toLowerCase() === code.trim().toLowerCase());
    if (existing) return res.status(400).json({ message: 'Unit code already exists in this class' });

    cls.units.push({
      name: name.trim(),
      code: code.trim(),
      formativeCount: formativeCount === 4 ? 4 : 3
    });

    await cls.save();
    res.status(201).json(cls);
  } catch (error) {
    console.error('Add unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addBulkUnits = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { units } = req.body;

    if (!Array.isArray(units) || units.length === 0) {
      return res.status(400).json({ message: 'No units provided' });
    }

    const cls = await Class.findOne({ _id: req.params.id, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const created = [];
    const skipped = [];
    const seen = new Set();

    for (const row of units) {
      const name = (row.name || '').trim();
      const code = (row.code || '').trim();
      const formativeCount = Number(row.formativeCount) === 4 ? 4 : 3;

      if (!name || !code) {
        skipped.push({ name, code, reason: 'Name and code required' });
        continue;
      }

      const key = code.toLowerCase();
      if (seen.has(key)) {
        skipped.push({ name, code, reason: 'Duplicate in list' });
        continue;
      }
      seen.add(key);

      const existing = cls.units.find((u) => u.code.toLowerCase() === key);
      if (existing) {
        skipped.push({ name, code, reason: 'Already exists' });
        continue;
      }

      cls.units.push({ name, code, formativeCount });
      created.push({ name, code });
    }

    await cls.save();

    res.status(201).json({
      message: 'Bulk add complete',
      total: units.length,
      created: created.length,
      skipped: skipped.length,
      skippedRows: skipped,
      class: cls
    });
  } catch (error) {
    console.error('Bulk units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const importUnits = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const cls = await Class.findOne({ _id: req.params.id, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let rawRows;
    try {
      rawRows = parseFileBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const rows = normalizeUnitRows(rawRows).filter((r) => r.name && r.code);
    if (rows.length === 0) return res.status(400).json({ message: 'No valid rows' });

    const created = [];
    const skipped = [];
    const seen = new Set();

    for (const row of rows) {
      const { name, code, formativeCount } = row;
      const key = code.toLowerCase();

      if (seen.has(key)) {
        skipped.push({ name, code, reason: 'Duplicate in file' });
        continue;
      }
      seen.add(key);

      const existing = cls.units.find((u) => u.code.toLowerCase() === key);
      if (existing) {
        skipped.push({ name, code, reason: 'Already exists' });
        continue;
      }

      cls.units.push({
        name,
        code,
        formativeCount: formativeCount === 4 ? 4 : 3
      });
      created.push({ name, code });
    }

    await cls.save();

    res.status(201).json({
      message: 'Import complete',
      total: rows.length,
      created: created.length,
      skipped: skipped.length,
      skippedRows: skipped
    });
  } catch (error) {
    console.error('Import units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportUnits = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { format = 'csv' } = req.query;

    const cls = await Class.findOne({ _id: req.params.id, adminId: tenantId })
      .populate('departmentId', 'name')
      .populate('courseId', 'name');
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const headers = [
      { key: 'no', label: 'No.' },
      { key: 'name', label: 'Unit Name' },
      { key: 'code', label: 'Code' },
      { key: 'formativeCount', label: 'Formatives' }
    ];

    const rows = cls.units.map((u, i) => ({
      no: i + 1,
      name: u.name,
      code: u.code,
      formativeCount: u.formativeCount
    }));

    const dateStamp = new Date().toISOString().split('T')[0];
    const baseName = `units-${cls.className}-${dateStamp}`.replace(/\s+/g, '-');

    if (format === 'xlsx') {
      const buffer = buildXLSX(headers, rows, 'Units');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const settings = await Settings.findOne({ adminId: tenantId });
      const meta = [
        { label: 'Class', value: cls.className },
        { label: 'Department', value: cls.departmentId?.name || '' },
        { label: 'Course', value: cls.courseId?.name || '' },
        { label: 'Date', value: new Date().toLocaleDateString() }
      ];
      const buffer = await buildTablePDF({
        settings,
        title: 'Units List',
        meta,
        headers,
        rows
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
      return res.send(buffer);
    }

    const csv = buildCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export units error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUnit = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, code, formativeCount } = req.body;

    const cls = await Class.findOne({ _id: req.params.id, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const unit = cls.units.id(req.params.unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    if (code && code.trim().toLowerCase() !== unit.code.toLowerCase()) {
      const existing = cls.units.find(
        (u) => u._id.toString() !== req.params.unitId && u.code.toLowerCase() === code.trim().toLowerCase()
      );
      if (existing) return res.status(400).json({ message: 'Unit code already exists' });
      unit.code = code.trim();
    }

    if (name && name.trim()) unit.name = name.trim();
    if (formativeCount !== undefined) unit.formativeCount = formativeCount === 4 ? 4 : 3;

    await cls.save();
    res.json(cls);
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const cls = await Class.findOne({ _id: req.params.id, adminId: tenantId });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const unit = cls.units.id(req.params.unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    cls.units.pull(req.params.unitId);
    await cls.save();
    await Score.deleteMany({ classId: cls._id, unitId: req.params.unitId, adminId: tenantId });

    res.json(cls);
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  addBulkClasses,
  importClasses,
  exportClasses,
  updateClass,
  deleteClass,
  addUnit,
  addBulkUnits,
  importUnits,
  exportUnits,
  updateUnit,
  deleteUnit
};