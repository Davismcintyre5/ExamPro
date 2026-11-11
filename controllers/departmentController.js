const Department = require('../models/Department');
const Course = require('../models/Course');
const Class = require('../models/Class');

const getDepartments = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const departments = await Department.find({
      adminId: tenantId,
      isActive: true
    }).sort({ name: 1 });

    const withCounts = await Promise.all(
      departments.map(async (dept) => {
        const courseCount = await Course.countDocuments({
          departmentId: dept._id,
          adminId: tenantId,
          isActive: true
        });
        const classCount = await Class.countDocuments({
          departmentId: dept._id,
          adminId: tenantId,
          isActive: true
        });
        return { ...dept.toObject(), courseCount, classCount };
      })
    );

    res.json(withCounts);
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const department = await Department.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const courses = await Course.find({
      departmentId: department._id,
      adminId: tenantId,
      isActive: true
    }).sort({ name: 1 });

    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const classCount = await Class.countDocuments({
          courseId: course._id,
          adminId: tenantId,
          isActive: true
        });
        return { ...course.toObject(), classCount };
      })
    );

    res.json({ ...department.toObject(), courses: coursesWithCounts });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const existing = await Department.findOne({
      adminId: tenantId,
      name: name.trim()
    });

    if (existing) {
      return res.status(400).json({ message: 'Department name already exists' });
    }

    const department = new Department({
      adminId: tenantId,
      name: name.trim()
    });

    await department.save();
    res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name } = req.body;

    const department = await Department.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (name && name.trim() !== department.name) {
      const existing = await Department.findOne({
        adminId: tenantId,
        name: name.trim(),
        _id: { $ne: department._id }
      });
      if (existing) {
        return res.status(400).json({ message: 'Department name already exists' });
      }
      department.name = name.trim();
    }

    await department.save();
    res.json(department);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const department = await Department.findOne({
      _id: req.params.id,
      adminId: tenantId
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const courseCount = await Course.countDocuments({
      departmentId: department._id,
      adminId: tenantId,
      isActive: true
    });

    if (courseCount > 0) {
      return res.status(400).json({
        message: `Cannot delete department — ${courseCount} course(s) still linked`
      });
    }

    department.isActive = false;
    await department.save();

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};