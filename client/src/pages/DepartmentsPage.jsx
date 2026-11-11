import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as departmentApi from '../api/departmentApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const DepartmentsPage = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await departmentApi.getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '' });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({ name: dept.name });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await departmentApi.updateDepartment(editing._id, form);
        toast.success('Department updated');
      } else {
        await departmentApi.createDepartment(form);
        toast.success('Department created');
      }
      setShowModal(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await departmentApi.deleteDepartment(deleteTarget._id);
      toast.success('Department deleted');
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;

  const headers = ['Name', 'Courses', 'Classes', 'Status', 'Actions'];

  const renderRow = (dept) => (
    <tr key={dept._id}>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => navigate(`/departments/${dept._id}`)}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {dept.name}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="primary">{dept.courseCount || 0}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant="info">{dept.classCount || 0}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={dept.isActive ? 'success' : 'danger'}>
          {dept.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap space-x-2">
        <Button variant="primary" size="sm" onClick={() => navigate(`/departments/${dept._id}`)}>Open</Button>
        <Button variant="secondary" size="sm" onClick={() => openEdit(dept)}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(dept)}>Delete</Button>
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage departments and their courses</p>
        </div>
        <Button onClick={openCreate}>
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Department
        </Button>
      </div>

      <Card>
        <Table headers={headers} data={departments} renderRow={renderRow} emptyMessage="No departments yet" />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g., ICT"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default DepartmentsPage;