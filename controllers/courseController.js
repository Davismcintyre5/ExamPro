const Course = require('../models/Course');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Settings = require('../models/Settings');
const { buildCSV } = require('../utils/genericCsv');
const { buildXLSX } = require('../utils/genericXlsx');
const { buildTablePDF } = require('../utils/genericPdf');
const { parseFileBuffer, normalizeCourseRows } = require('../utils/fileImporter');

const getCourses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId } = req.query;

    const query = { adminId: tenantId, isActive: true };
    if (departmentId) query.departmentId = departmentId;

    const courses = await Course.find(query)
      .populate('departmentId', 'name')
      .sort({ name: 1 });

    const withCounts = await Promise.all(
      courses.map(async (course) => {
        const classCount = await Class.countDocuments({
          courseId: course._id,
          adminId: tenantId,
          isActive: true
        });
        return { ...course.toObject(), classCount };
      })
    );

    res.json(withCounts);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const course = await Course.findOne({
      _id: req.params.id,
      adminId: tenantId
    }).populate('departmentId', 'name');

    if (!course) return res.status(404).json({ message: 'Course not found' });

    const classes = await Class.find({
      courseId: course._id,
      adminId: tenantId,
      isActive: true
    }).sort({ className: 1 });

    res.json({ ...course.toObject(), classes });
  } catch (error) {
    console.error('Get course by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, code, departmentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Course name is required' });
    }
    if (!departmentId) {
      return res.status(400).json({ message: 'Department is required' });
    }

    const department = await Department.findOne({ _id: departmentId, adminId: tenantId });
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const existing = await Course.findOne({
      name: name.trim(),
      departmentId,
      adminId: tenantId
    });
    if (existing) {
      return res.status(400).json({ message: 'Course name already exists in this department' });
    }

    const course = new Course({
      adminId: tenantId,
      departmentId,
      name: name.trim(),
      code: code ? code.trim() : ''
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addBulkCourses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId, courses } = req.body;

    if (!departmentId) {
      return res.status(400).json({ message: 'Department ID is required' });
    }
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ message: 'No courses provided' });
    }

    const department = await Department.findOne({ _id: departmentId, adminId: tenantId });
    if (!department) return res.status(404).json({ message: 'Department not found' });

    const created = [];
    const skipped = [];
    const seen = new Set();

    for (const row of courses) {
      const name = (row.name || '').trim();
      const code = (row.code || '').trim();

      if (!name) {
        skipped.push({ name: row.name, reason: 'Name required' });
        continue;
      }

      const key = name.toLowerCase();
      if (seen.has(key)) {
        skipped.push({ name, reason: 'Duplicate in list' });
        continue;
      }
      seen.add(key);

      const existing = await Course.findOne({ name, departmentId, adminId: tenantId });
      if (existing) {
        skipped.push({ name, reason: 'Already exists' });
        continue;
      }

      const course = new Course({ adminId: tenantId, departmentId, name, code });
      await course.save();
      created.push(course);
    }

    res.status(201).json({
      message: 'Bulk add complete',
      total: courses.length,
      created: created.length,
      skipped: skipped.length,
      skippedRows: skipped
    });
  } catch (error) {
    console.error('Bulk courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const importCourses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId } = req.body;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!departmentId) {
      return res.status(400).json({ message: 'Department ID is required' });
    }

    const department = await Department.findOne({ _id: departmentId, adminId: tenantId });
    if (!department) return res.status(404).json({ message: 'Department not found' });

    let rawRows;
    try {
      rawRows = parseFileBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const rows = normalizeCourseRows(rawRows).filter((r) => r.name);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No valid rows found in file' });
    }

    const created = [];
    const skipped = [];
    const seen = new Set();

    for (const row of rows) {
      const { name, code } = row;
      const key = name.toLowerCase();

      if (seen.has(key)) {
        skipped.push({ name, reason: 'Duplicate in file' });
        continue;
      }
      seen.add(key);

      const existing = await Course.findOne({ name, departmentId, adminId: tenantId });
      if (existing) {
        skipped.push({ name, reason: 'Already exists' });
        continue;
      }

      const course = new Course({ adminId: tenantId, departmentId, name, code });
      await course.save();
      created.push(course);
    }

    res.status(201).json({
      message: 'Import complete',
      total: rows.length,
      created: created.length,
      skipped: skipped.length,
      skippedRows: skipped
    });
  } catch (error) {
    console.error('Import courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportCourses = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { departmentId, format = 'csv' } = req.query;

    const query = { adminId: tenantId, isActive: true };
    if (departmentId) query.departmentId = departmentId;

    const courses = await Course.find(query)
      .populate('departmentId', 'name')
      .sort({ name: 1 });

    const headers = [
      { key: 'no', label: 'No.' },
      { key: 'name', label: 'Course Name' },
      { key: 'code', label: 'Code' },
      { key: 'department', label: 'Department' }
    ];

    const rows = courses.map((c, i) => ({
      no: i + 1,
      name: c.name,
      code: c.code || '-',
      department: c.departmentId?.name || '-'
    }));

    const dateStamp = new Date().toISOString().split('T')[0];
    const baseName = `courses-${dateStamp}`;

    if (format === 'xlsx') {
      const buffer = buildXLSX(headers, rows, 'Courses');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const settings = await Settings.findOne({ adminId: tenantId });
      const meta = [{ label: 'Date', value: new Date().toLocaleDateString() }];
      const buffer = await buildTablePDF({
        settings,
        title: 'Courses List',
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
    console.error('Export courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, code, departmentId } = req.body;

    const course = await Course.findOne({ _id: req.params.id, adminId: tenantId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (name && name.trim() !== course.name) {
      const existing = await Course.findOne({
        name: name.trim(),
        departmentId: course.departmentId,
        adminId: tenantId,
        _id: { $ne: course._id }
      });
      if (existing) {
        return res.status(400).json({ message: 'Course name already exists in this department' });
      }
      course.name = name.trim();
    }

    if (code !== undefined) course.code = code ? code.trim() : '';
    if (departmentId) course.departmentId = departmentId;

    await course.save();
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const course = await Course.findOne({ _id: req.params.id, adminId: tenantId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const classCount = await Class.countDocuments({
      courseId: course._id,
      adminId: tenantId,
      isActive: true
    });
    if (classCount > 0) {
      return res.status(400).json({
        message: `Cannot delete — ${classCount} class(es) still linked`
      });
    }

    course.isActive = false;
    await course.save();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  addBulkCourses,
  importCourses,
  exportCourses,
  updateCourse,
  deleteCourse
};