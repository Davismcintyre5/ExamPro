import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/authApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const SuperAdminPage = () => {
  const { isHiddenAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastTempPassword, setLastTempPassword] = useState(null);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    isHiddenAdmin: false,
    accessHash: '',
  });
  const [editForm, setEditForm] = useState({
    email: '',
    fullName: '',
  });

  useEffect(() => {
    if (!isHiddenAdmin) {
      window.location.href = '/';
      return;
    }
    fetchAdmins();
  }, [isHiddenAdmin]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await authApi.getAdmins();
      setAdmins(data);
    } catch (error) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await authApi.createAdmin(createForm);

      if (result.emailSent) {
        toast.success('Admin created and credentials emailed');
      } else {
        toast.success('Admin created');
        if (result.tempPassword) {
          setLastTempPassword({
            email: createForm.email,
            password: result.tempPassword,
          });
        }
      }

      setShowCreateModal(false);
      setCreateForm({ fullName: '', email: '', isHiddenAdmin: false, accessHash: '' });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await authApi.updateAdmin(editingAdmin._id, editForm);
      toast.success('Admin updated');
      setShowEditModal(false);
      setEditingAdmin(null);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (admin) => {
    try {
      await authApi.toggleAdminStatus(admin._id);
      toast.success(`Admin ${admin.isActive ? 'suspended' : 'activated'}`);
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const handleResetAttempts = async (admin) => {
    try {
      await authApi.resetAdminAttempts(admin._id);
      toast.success('Attempts reset');
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to reset attempts');
    }
  };

  const handleResetPassword = async () => {
    if (!editingAdmin) return;
    setSaving(true);

    try {
      const result = await authApi.resetAdminPassword(editingAdmin._id);

      if (result.emailSent) {
        toast.success('Password reset and emailed');
      } else {
        toast.success('Password reset');
        if (result.tempPassword) {
          setLastTempPassword({
            email: editingAdmin.email || editingAdmin.username,
            password: result.tempPassword,
          });
        }
      }

      setShowResetPasswordModal(false);
      setEditingAdmin(null);
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await authApi.deleteAdmin(deleteTarget._id);
      toast.success('Admin deleted');
      setDeleteTarget(null);
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;

  const headers = ['Identifier', 'Full Name', 'Type', 'Status', 'Last Login', 'Failed Attempts', 'Actions'];

  const renderRow = (admin) => (
    <tr key={admin._id}>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-medium text-gray-900">{admin.email || admin.username}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{admin.fullName}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={admin.isHiddenAdmin ? 'danger' : 'primary'}>
          {admin.isHiddenAdmin ? 'Super Admin' : 'Admin'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={admin.isActive && admin.status === 'active' ? 'success' : 'warning'}>
          {admin.status || (admin.isActive ? 'active' : 'inactive')}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={admin.failedAttempts > 0 ? 'warning' : 'success'}>
          {admin.failedAttempts || 0}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap space-x-2">
        {!admin.isHiddenAdmin ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingAdmin(admin);
                setEditForm({
                  email: admin.email || admin.username,
                  fullName: admin.fullName,
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
                setEditingAdmin(admin);
                setShowResetPasswordModal(true);
              }}
            >
              Reset PW
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleResetAttempts(admin)}
            >
              Reset Att
            </Button>
            <Button
              variant={admin.isActive ? 'warning' : 'success'}
              size="sm"
              onClick={() => handleToggle(admin)}
            >
              {admin.isActive ? 'Suspend' : 'Activate'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteTarget(admin)}
            >
              Delete
            </Button>
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">Protected</span>
        )}
      </td>
    </tr>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage platform admins</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Admin
        </Button>
      </div>

      {lastTempPassword && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            Email failed to send. Share these credentials manually:
          </p>
          <div className="text-sm">
            <p>
              <strong>Email:</strong> {lastTempPassword.email}
            </p>
            <p>
              <strong>Temporary Password:</strong>{' '}
              <code className="bg-yellow-100 px-2 py-1 rounded">
                {lastTempPassword.password}
              </code>
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
          data={admins}
          renderRow={renderRow}
          emptyMessage="No admins"
        />
      </Card>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Admin"
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
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isHiddenAdmin"
              checked={createForm.isHiddenAdmin}
              onChange={(e) =>
                setCreateForm({ ...createForm, isHiddenAdmin: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="isHiddenAdmin" className="text-sm text-gray-700">
              Super Admin (Hidden)
            </label>
          </div>
          {createForm.isHiddenAdmin && (
            <Input
              label="Access Hash"
              type="password"
              value={createForm.accessHash}
              onChange={(e) =>
                setCreateForm({ ...createForm, accessHash: e.target.value })
              }
              required
            />
          )}
          <p className="text-xs text-gray-500">
            A temporary password will be generated and emailed to the admin.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Create Admin
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Admin"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />
          <Input
            label="Full Name"
            value={editForm.fullName}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            required
          />
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
            Generate a new temporary password for{' '}
            <strong>{editingAdmin?.fullName}</strong>? It will be emailed to them.
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
        title="Delete Admin"
        message={`Delete "${deleteTarget?.fullName}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default SuperAdminPage;
