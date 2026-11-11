import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as authApi from '../api/authApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const PendingUsersPage = () => {
  const { isHiddenAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isHiddenAdmin) {
      window.location.href = '/';
      return;
    }
    loadUsers();
  }, [isHiddenAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await authApi.getPendingUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await authApi.approveUser(id);
      toast.success('User approved');
      loadUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setSaving(true);
    try {
      await authApi.rejectUser(rejectTarget._id, rejectReason);
      toast.success('User rejected');
      setRejectTarget(null);
      setRejectReason('');
      loadUsers();
    } catch (error) {
      toast.error('Failed to reject user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner size="lg" className="py-20" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Users</h1>
        <p className="text-gray-600 mt-1">Review and approve new registrations</p>
      </div>

      <Card>
        {users.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500">No pending users</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{user.fullName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {user.email || user.username || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {user.schoolName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(user.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <Button variant="success" size="sm" onClick={() => handleApprove(user._id)}>
                        Approve
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setRejectTarget(user)}>
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Registration"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Reject <strong>{rejectTarget?.fullName}</strong>'s registration?
          </p>
          <Input
            label="Reason (optional)"
            placeholder="Explain why the registration was rejected"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} isLoading={saving}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingUsersPage;
