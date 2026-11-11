import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as staffApi from '../api/staffApi';
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

const StaffPage = () => {
  const { isOwner } = useAuth();
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastTempPassword, setLastTempPassword] = useState(null);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    departments: [],
  });
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    departments: [],
  });

  useEffect(() => {
    if (!isOwner) {
      window.location.href = '/';
      return;
    }
    loadAll();
  }, [isOwner]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [staffData, deptData] = await Promise.all([
        staffApi.getStaff(),
        departmentApi.getDepartments(),
      ]);
      setStaff(staffData);
      setDepartments(deptData);
    } catch (error) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (list, deptId) => {
    return list.includes(deptId)
      ? list.filter((id) => id !== deptId)
      : [...list, deptId];
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await staffApi.createStaff(createForm);

      if (result.emailSent) {
        toast.success('Staff created and credentials emailed');
      } else {
        toast.success('Staff created');
        if (result.tempPassword) {
          setLastTempPassword({ email: createForm.email, password: result.tempPassword });
        }
      }

      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', phone: '', departments: [] });
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create staff');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await staffApi.updateStaff(editingStaff._id, editForm);
      toast.success('Staff updated');
      setShowEditModal(false);
      setEditingStaff(null);
      loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update staff');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (member) => {
    try {
      await staffApi.toggleStaffStatus(member._id);
      toast.success(`Staff ${member.isActive ? 'suspended' : 'activated'}`);
      loadAll();
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const handleResetPassword = async () => {
    if (!editingStaff) return;
    setSaving(true);

    try {
      const result = await staffApi.resetStaffPassword(editingStaff._id);

      if (result.emailSent) {
        toast.success('Password reset and emailed');
      } else {
        toast.success('Password reset');
        if (result.tempPassword) {
          setLastTempPassword({
            email: editingStaff.email,
            password: result.tempPassword,
          });
        }
      }

      setShowResetPasswordModal(false);
      setEditingStaff(null);
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await staffApi.deleteStaff(deleteTarget._id);
      toast.success('Staff removed');
      setDeleteTarget(null);
      loadAll();
    } catch (error) {
      toast.error('Failed to remove staff');
    }
  };

  if (!isOwner) return null;
  if (loading) return <Spinner size="lg" className="py-20" />;

  const headers = ['Name', 'Email', 'Phone', 'Departments', 'Status', 'Last Login', 'Actions'];

  const renderRow = (member) => (
    <tr key={member._id}>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-medium text-gray-900">{member.fullName}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.email || '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.phone || '-'}</td>
      <td className="px-6 py-4">
        {member.departments?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {member.departments.map((d) => (
              <Badge key={d._id} variant="info">
                {d.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">All departments</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={member.isActive && member.status === 'active' ? 'success' : 'warning'}>
          {member.status || (member.isActive ? 'active' : 'inactive')}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
        {member.lastLogin ? new Date(member.lastLogin).toLocaleString() : 'Never'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditingStaff(member);
            setEditForm({
              fullName: member.fullName,
              email: member.email || '',
              phone: member.phone || '',
              departments: member.departments?.map((d) => d._id) || [],
            });
            setShowEditModal(true);
          }}
        >
          Edit
        </Button>
        <Button
          variant="warning"
          size="sm"
          onClick={() => {
            setEditingStaff(member);
            setShowResetPasswordModal(true);
          }}
        >
          Reset PW
        </Button>
        <Button
          variant={member.isActive ? 'warning' : 'success'}
          size="sm"
          onClick={() => handleToggle(member)}
        >
          {member.isActive ? 'Suspend' : 'Activate'}
        </Button>
        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(member)}>
          Delete
        </Button>
      </td>
    </tr>
  );

  const renderDepartmentPicker = (form, setForm) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Departments (assign one or more)
      </label>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-200 rounded-lg">
        {departments.map((dept) => (
          <label
            key={dept._id}
            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
          >
            <input
              type="checkbox"
              checked={form.departments.includes(dept._id)}
              onChange={() =>
                setForm({
                  ...form,
                  departments: toggleDepartment(form.departments, dept._id),
                })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">{dept.name}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        If none selected, staff can access all departments.
      </p>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="text-gray-600 mt-1">Manage staff accounts and their department access</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Staff
        </Button>
      </div>

      {lastTempPassword && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            Email failed to send. Share these credentials manually:
          </p>
          <div className="text-sm">
            <p><strong>Email:</strong> {lastTempPassword.email}</p>
            <p>
              <strong>Temporary Password:</strong>{' '}
              <code className="bg-yellow-100 px-2 py-1 rounded">{lastTempPassword.password}</code>
            </p>
          </div>
          <button
            onClick={() => setLastTempPassword(null)}
            className="mt-2 text-xs text-yellow-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <Card>
        <Table
          headers={headers}
          data={staff}
          renderRow={renderRow}
          emptyMessage="No staff members yet"
        />
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Staff"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Name"
            value={createForm.fullName}
            onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            required
          />
          <Input
            label="Phone (optional)"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
          />
          {renderDepartmentPicker(createForm, setCreateForm)}
          <p className="text-xs text-gray-500">
            A temporary password will be generated and emailed to the staff member.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Create Staff
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Staff"
        size="lg"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Full Name"
            value={editForm.fullName}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />
          <Input
            label="Phone (optional)"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          {renderDepartmentPicker(editForm, setEditForm)}
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Update
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
        title="Reset Password"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate a new temporary password for <strong>{editingStaff?.fullName}</strong>?
            It will be emailed to them.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="warning" onClick={handleResetPassword} isLoading={saving}>
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Staff"
        message={`Remove "${deleteTarget?.fullName}" from your school?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export default StaffPage;