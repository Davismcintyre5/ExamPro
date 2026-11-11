import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlatform } from '../context/PlatformContext';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';

const Login = () => {
  const { login, hiddenLogin, isAuthenticated, isAdminMode, setIsAdminMode } = useAuth();
  const { platform } = usePlatform();
  const navigate = useNavigate();
  const [showHiddenModal, setShowHiddenModal] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [hiddenCredentials, setHiddenCredentials] = useState({ username: '', password: '', accessHash: '' });
  const [adminError, setAdminError] = useState('');
  const [hiddenError, setHiddenError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [hiddenLoading, setHiddenLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && (event.key === 'A' || event.key === 'a')) {
        event.preventDefault();
        setShowHiddenModal(true);
      }
      if (event.key === 'Escape') setShowHiddenModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isAdminMode) {
      setShowHiddenModal(true);
      setIsAdminMode(false);
    }
  }, [isAdminMode, setIsAdminMode]);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminLoading(true);

    const result = await login(adminCredentials);

    if (result.success) {
      navigate('/');
    } else if (
      result.code === 'PENDING_APPROVAL' ||
      result.code === 'REJECTED' ||
      result.code === 'SUSPENDED'
    ) {
      sessionStorage.setItem('authBlockedState', JSON.stringify({
        code: result.code,
        reason: result.reason || '',
        email: adminCredentials.username,
      }));
      navigate('/pending-approval');
    } else {
      setAdminError(result.error || 'Login failed');
    }

    setAdminLoading(false);
  };

  const handleHiddenSubmit = async (e) => {
    e.preventDefault();
    setHiddenError('');
    setHiddenLoading(true);
    const result = await hiddenLogin(hiddenCredentials);
    if (result.success) {
      setShowHiddenModal(false);
      navigate('/');
    } else {
      setHiddenError(result.error || 'Hidden admin login failed');
    }
    setHiddenLoading(false);
  };

  return (
    <>
      <AuthLayout title="Welcome Back" subtitle="Log in to your account to continue managing classes, students, and assessments.">
        <div className="max-w-sm mx-auto w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials below</p>

          {adminError && (
            <div className="mb-4">
              <Alert type="error" message={adminError} onClose={() => setAdminError('')} />
            </div>
          )}

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <Input
              label="Email or Username"
              type="text"
              placeholder="you@example.com"
              value={adminCredentials.username}
              onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={adminCredentials.password}
              onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
              required
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" isLoading={adminLoading} className="w-full" size="lg">
              Login
            </Button>
          </form>

          {platform.allowSelfRegistration && (
            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
                Register
              </Link>
            </p>
          )}
        </div>
      </AuthLayout>

      <Modal
        isOpen={showHiddenModal}
        onClose={() => setShowHiddenModal(false)}
        title="Hidden Admin Access"
        size="sm"
      >
        <div className="space-y-4">
          {hiddenError && <Alert type="error" message={hiddenError} onClose={() => setHiddenError('')} />}
          <form onSubmit={handleHiddenSubmit} className="space-y-4">
            <Input
              label="Email or Username"
              type="text"
              value={hiddenCredentials.username}
              onChange={(e) => setHiddenCredentials({ ...hiddenCredentials, username: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              value={hiddenCredentials.password}
              onChange={(e) => setHiddenCredentials({ ...hiddenCredentials, password: e.target.value })}
              required
            />
            <Input
              label="Access Hash"
              type="password"
              value={hiddenCredentials.accessHash}
              onChange={(e) => setHiddenCredentials({ ...hiddenCredentials, accessHash: e.target.value })}
              required
            />
            <Button type="submit" isLoading={hiddenLoading} className="w-full" variant="danger">
              Hidden Admin Login
            </Button>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default Login;
