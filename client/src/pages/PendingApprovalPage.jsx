import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlatform } from '../context/PlatformContext';
import { loginTeacher } from '../api/authApi';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

const STATES = {
  pending: {
    title: 'Account Pending Approval',
    subtitle: 'Your registration is being reviewed',
    icon: 'clock',
    color: 'yellow',
    message: 'Your account has been created successfully. It is currently pending approval by an administrator.',
    detail: 'You will receive an email once your account is reviewed. This usually takes less than 24 hours.',
  },
  rejected: {
    title: 'Registration Not Approved',
    subtitle: 'Your registration was not approved',
    icon: 'x',
    color: 'red',
    message: 'Unfortunately, your registration could not be approved at this time.',
    detail: 'If you believe this was a mistake, please contact support for assistance.',
  },
  suspended: {
    title: 'Account Suspended',
    subtitle: 'Your account has been suspended',
    icon: 'pause',
    color: 'orange',
    message: 'Your account has been suspended and you cannot access the platform at this time.',
    detail: 'Please contact support if you have any questions or believe this was a mistake.',
  },
};

const PendingApprovalPage = () => {
  const { platform } = usePlatform();
  const navigate = useNavigate();
  const [state, setState] = useState('pending');
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('authBlockedState');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.code === 'PENDING_APPROVAL') setState('pending');
        else if (parsed.code === 'REJECTED') setState('rejected');
        else if (parsed.code === 'SUSPENDED') setState('suspended');
        if (parsed.reason) setReason(parsed.reason);
        if (parsed.email) setEmail(parsed.email);
      } catch (err) {
        console.error('Failed to parse auth blocked state');
      }
    }
  }, []);

  const handleRecheck = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Enter your email');
      return;
    }

    setChecking(true);
    try {
      await loginTeacher({ username: email, password: '__placeholder__' });
      toast.error('Invalid password. Please try logging in again.');
      sessionStorage.removeItem('authBlockedState');
      navigate('/login');
    } catch (err) {
      const code = err.response?.data?.code;

      if (code === 'PENDING_APPROVAL') {
        toast.error('Still pending approval');
      } else if (code === 'REJECTED') {
        toast.error('Your registration was rejected');
      } else if (code === 'SUSPENDED') {
        toast.error('Your account is suspended');
      } else {
        // Not blocked anymore - let them try logging in
        toast.success('Your account may be active now. Please log in.');
        sessionStorage.removeItem('authBlockedState');
        navigate('/login');
      }
    } finally {
      setChecking(false);
    }
  };

  const current = STATES[state];

  const colorClasses = {
    yellow: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    red: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      badge: 'bg-red-100 text-red-800',
    },
    orange: {
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-800',
    },
  };

  const c = colorClasses[current.color];

  const renderIcon = () => {
    if (current.icon === 'clock') {
      return (
        <svg className={`h-10 w-10 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (current.icon === 'x') {
      return (
        <svg className={`h-10 w-10 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className={`h-10 w-10 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <AuthLayout title={current.title} subtitle={current.subtitle}>
      <div className="max-w-sm mx-auto w-full">
        <div className={`w-20 h-20 ${c.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {renderIcon()}
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">{current.title}</h2>
        <p className="text-sm text-gray-600 text-center mb-4">{current.message}</p>

        {reason && state === 'rejected' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-800 mb-1">Reason:</p>
            <p className="text-sm text-red-700">{reason}</p>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center mb-6">{current.detail}</p>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Check your status</p>
          <form onSubmit={handleRecheck} className="space-y-3">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" variant="secondary" isLoading={checking} className="w-full">
              Re-check Status
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
              Back to Login
            </Link>
          </p>
          {platform.supportEmail && (
            <p className="text-xs text-gray-500">
              Need help?{' '}
              <a href={`mailto:${platform.supportEmail}`} className="text-blue-600 hover:underline">
                {platform.supportEmail}
              </a>
            </p>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default PendingApprovalPage;
