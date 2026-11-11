import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changeOwnPassword } from '../api/authApi';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

const ChangePasswordPage = () => {
  const { admin, mustChangePassword, completePasswordChange, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changeOwnPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      completePasswordChange();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mustChangePassword ? 'Change Your Password' : 'Update Password'}
        </h2>

        {mustChangePassword && (
          <div className="mb-4">
            <Alert
              type="warning"
              title="Required"
              message="You must change your password before continuing."
            />
          </div>
        )}

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!mustChangePassword && (
            <Input
              label="Current Password"
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
          )}
          <Input
            label="New Password"
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
          <Button type="submit" isLoading={loading} className="w-full" size="lg">
            Change Password
          </Button>
        </form>

        {mustChangePassword && (
          <button
            onClick={logout}
            className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordPage;
