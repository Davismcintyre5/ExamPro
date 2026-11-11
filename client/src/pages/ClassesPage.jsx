import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as classApi from '../api/classApi';
import * as departmentApi from '../api/departmentApi';
import * as courseApi from '../api/courseApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import ExportMenu from '../components/ui/ExportMenu';
import BulkAddModal from '../components/common/BulkAddModal';
import ImportModal from '../components/common/ImportModal';
import toast from 'react-hot-toast';

const ClassesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get('courseId') || '';

  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [form, setForm] = useState({
    className: '',
    departmentId: '',
    courseId: '',
    level: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDepartments();
    loadClasses();
  }, []);

  useEffect(() => {
    loadClasses();
  }, [selectedDepartment]);

  useEffect(() => {
    if (form.departmentId) {
      loadCourses(form.departmentId);
    } else {
      setCourses([]);
    }
  }, [form.departmentId]);

  const loadDepartments = async () => {
    try {
      const data = await departmentApi.getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error('Failed to load departments');
    }
  };

  const loadCourses = async (departmentId) => {
    try {
      const data = await courseApi.getCourses({ departmentId });
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
    }
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDepartment) params.departmentId = selectedDepartment;
      if (courseIdParam) params.courseId = courseIdParam;
      const data = await classApi.getClasses(params);
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const departmentOptions = departments.map((d) => ({ value: d._id, label: d.name }));
  const courseOptions = courses.map((c) => ({ value: c._id, label: c.name }));
  const levelOptions = [
    { value: '4', label: 'Level 4' },
    { value: '5', label: 'Level 5' },
    { value: '6', label: 'Level 6' }
  ];

  const openCreate = () => {
    setEditing(null);
    setForm({ className: '', departmentId: '', courseId: '', level: '' });
    setShowModal(true);
  };

  const openEdit = (cls) => {
    setEditing(cls);
    setForm({
      className: cls.className,
      departmentId: cls.departmentId?._id || cls.departmentId || '',
      courseId: cls.courseId?._id || cls.courseId || '',
      level: cls.level ? String(cls.level) : ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.level || !form.courseId) {
      toast.error('Course and level required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        className: form.className,
        departmentId: form.departmentId,
        courseId: form.courseId,
        level: Number(form.level)
      };
      if (editing) {
        await classApi.updateClass(editing._id, payload);
        toast.success('Class updated');
      } else {
        await classApi.createClass(payload);
        toast.success('Class created');
      }
      setShowModal(false);
      loadClasses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async (lines) => {
    if (!form.departmentId || !form.courseId) {
      toast.error('Select a department and course first');
      throw new Error('Missing dept/course');
    }

    const classes = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return { className: parts[0] || '', level: Number(parts[1]) || 0 };
    });

    const result = await classApi.addBulkClasses(form.departmentId, form.courseId, classes);
    toast.success(`${result.created} created, ${result.skipped} skipped`);
    setShowBulk(false);
    loadClasses();
  };

  const handleImport = async (file) => {
    if (!form.departmentId || !form.courseId) {
      throw new Error('Pick dept and course first');
    }
    return await classApi.importClasses(form.departmentId, form.courseId, file);
  };

  const handleExport = async (format) => {
    try {
      const params = { format };
      if (selectedDepartment) params.departmentId = selectedDepartment;
      await classApi.exportClasses(params);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await classApi.deleteClass(deleteTarget._id);
      toast.success('Class deleted');
      setDeleteTarget(null);
      loadClasses();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const headers = ['Class Name', 'Department', 'Course', 'Level', 'Students', 'Units', 'Status', 'Actions'];

  const renderRow = (cls) => (
    <tr key={cls._id}>
      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{cls.className}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="primary">{cls.departmentId?.name || '-'}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {cls.courseId?.name ? (
          <Badge variant="info">{cls.courseId.name}</Badge>
        ) : (
          <span className="text-xs text-gray-400 italic">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
        {cls.level ? `Level ${cls.level}` : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{cls.studentCount || 0}</td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{cls.unitCount || 0}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={cls.isActive ? 'success' : 'danger'}>
          {cls.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap space-x-2">
        <Button variant="primary" size="sm" onClick={() => navigate(`/classes/${cls._id}`)}>Open</Button>
        <Button variant="secondary" size="sm" onClick={() => openEdit(cls)}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(cls)}>Delete</Button>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">Manage classes</p>
        </div>
        <div className="flex items-center space-x-2">
          <ExportMenu onExport={handleExport} disabled={classes.length === 0} />
          <Button variant="secondary" onClick={() => {
            if (!form.departmentId || !form.courseId) {
              toast.error('Open Add Class, pick dept & course, then Bulk Add');
              return;
            }
            setShowBulk(true);
          }}>Bulk Add</Button>
          <Button variant="secondary" onClick={() => setShowImport(true)}>Import</Button>
          <Button onClick={openCreate}>
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Class
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <Select
          label="Filter by Department"
          placeholder="All Departments"
          options={departmentOptions}
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        />
      </Card>

      <Card>
        <Table
          headers={headers}
          data={classes}
          renderRow={renderRow}
          loading={loading}
          emptyMessage="No classes found"
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Class' : 'Add Class'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Department"
            placeholder="Select department"
            options={departmentOptions}
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value, courseId: '' })}
            required
          />
          <Select
            label="Course"
            placeholder={form.departmentId ? 'Select course' : 'Select department first'}
            options={courseOptions}
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            disabled={!form.departmentId}
            required
          />
          <Input
            label="Class Name"
            placeholder="e.g., ICTL5 25M"
            value={form.className}
            onChange={(e) => setForm({ ...form, className: e.target.value })}
            required
          />
          <Select
            label="Level"
            placeholder="Select level"
            options={levelOptions}
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <BulkAddModal
        isOpen={showBulk}
        onClose={() => setShowBulk(false)}
        onSubmit={handleBulkAdd}
        title="Bulk Add Classes"
        formatHint="Format: className, level (4, 5, or 6) - one per line. Course/Department come from the Add Class modal."
        placeholder={`ICTL5 25M, 5\nICTL4 24M, 4\nICTL6 26M, 6`}
        submitLabel="Add Classes"
      />

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSubmit={handleImport}
        title="Import Classes"
        formatHint="Columns: class_name, level"
        submitLabel="Import"
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        message={`Delete "${deleteTarget?.className}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default ClassesPage;