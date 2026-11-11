const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const adminAuth = require('../middleware/adminAuth');

router.get('/', adminAuth, departmentController.getDepartments);
router.get('/:id', adminAuth, departmentController.getDepartmentById);
router.post('/', adminAuth, departmentController.createDepartment);
router.put('/:id', adminAuth, departmentController.updateDepartment);
router.delete('/:id', adminAuth, departmentController.deleteDepartment);

module.exports = router;