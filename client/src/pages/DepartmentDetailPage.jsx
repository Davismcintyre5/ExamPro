import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as departmentApi from '../api/departmentApi';
import * as courseApi from '../api/courseApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import ExportMenu from '../components/ui/ExportMenu';
import BulkAddModal from '../components/common/BulkAddModal';
import ImportModal from '../components/common/ImportModal';
import toast from 'react-hot-toast';

const DepartmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await departmentApi.getDepartmentById(id);
      setDepartment(data);
      setCourses(data.courses || []);
    } catch (error) {
      toast.error('Failed to load');
      navigate('/departments');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '' });
    setShowModal(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setForm({ name: course.name, code: course.code || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: form.name, code: form.code, departmentId: id };
      if (editing) {
        await courseApi.updateCourse(editing._id, payload);
        toast.success('Course updated');
      } else {
        await courseApi.createCourse(payload);
        toast.success('Course created');
      }
      setShowModal(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async (lines) => {
    const courses = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return { name: parts[0] || '', code: parts[1] || '' };
    });

    const result = await courseApi.addBulkCourses(id, courses);
    toast.success(`${result.created} created, ${result.skipped} skipped`);
    setShowBulk(false);
    load();
  };

  const handleImport = async (file) => {
    return await courseApi.importCourses(id, file);
  };

  const handleExport = async (format) => {
    try {
      await courseApi.exportCourses({ departmentId: id, format });
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await courseApi.deleteCourse(deleteTarget._id);
      toast.success('Course deleted');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;
  if (!department) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/departments')}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Departments
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{department.name}</h1>
          <p className="text-gray-600 mt-1">Manage courses in this department</p>
        </div>
        <div className="flex items-center space-x-2">
          <ExportMenu onExport={handleExport} disabled={courses.length === 0} />
          <Button variant="secondary" onClick={() => setShowImport(true)}>Import</Button>
          <Button variant="secondary" onClick={() => setShowBulk(true)}>Bulk Add</Button>
          <Button onClick={openCreate}>
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Course
          </Button>
        </div>
      </div>

      {courses.length === 0 && (
        <Alert type="info" title="No courses yet" message="Add your first course to this department." />
      )}

      {courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course._id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-900">{course.name}</p>
                  {course.code && (
                    <code className="text-xs text-gray-500 bg-gray-50 px-1 py-0.5 rounded">{course.code}</code>
                  )}
                </div>
                <Badge variant="primary">{course.classCount || 0} Classes</Badge>
              </div>
              <div className="flex space-x-2 pt-3 border-t">
                <Button variant="secondary" size="sm" onClick={() => navigate(`/classes?courseId=${course._id}`)}>
                  View Classes
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(course)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(course)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Course Name"
            placeholder="e.g., Web Development"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input label="Code (optional)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <BulkAddModal
        isOpen={showBulk}
        onClose={() => setShowBulk(false)}
        onSubmit={handleBulkAdd}
        title="Bulk Add Courses"
        formatHint="Format: name, code (code optional) - one per line"
        placeholder={`Web Development, WD101\nNetworking, NET201\nDatabase Admin`}
        submitLabel="Add Courses"
      />

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSubmit={handleImport}
        title="Import Courses"
        formatHint="Columns: name, code (code optional)"
        submitLabel="Import Courses"
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default DepartmentDetailPage;