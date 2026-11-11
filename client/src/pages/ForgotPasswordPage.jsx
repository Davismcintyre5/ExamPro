import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/authApi';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setMessage(res.message || 'If an account exists with that email, we have sent password reset instructions.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password?" subtitle="Enter your email and we'll send you a link to reset your password.">
      <div className="max-w-sm mx-auto w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h2>
        <p className="text-sm text-gray-500 mb-6">We'll email you a reset link</p>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        {message && (
          <div className="mb-4">
            <Alert type="success" message={message} />
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" isLoading={loading} className="w-full" size="lg">
              Send Reset Link
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          Remembered it?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
            Back to Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
