import { useState } from 'react';
import { Lock, Mail, User, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';

export default function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false); // simple reset: email + new password
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // --- Forgot password flow (no token / email sending) ---
    if (forgotMode) {
      if (!formData.email || !formData.password) {
        setError('Email and new password are required.');
        return;
      }
      setLoading(true);
      try {
        await authService.resetPassword(formData.email, formData.password);
        setSuccess('Password reset successfully. You can login now.');
        setForgotMode(false);
        setFormData({ username: '', email: '', password: '' });
      } catch (err) {
        setError(err.message || 'Password reset failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // --- Normal login/register flow ---
    if (!formData.email || !formData.password || (!isLogin && !formData.username)) {
      setError('Please fill all fields.');
      return;
    }

    setLoading(true);
    try {
      const userData = isLogin
        ? await authService.login(formData.email, formData.password)
        : await authService.register(formData.username, formData.email, formData.password);

      setUser(userData);
      setSuccess(isLogin ? 'Successfully logged in' : 'Registration successful');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAuthMode = () => {
    setIsLogin((v) => !v);
    setForgotMode(false);
    setFormData({ username: '', email: '', password: '' });
    setError('');
    setSuccess('');
  };

  const startForgotMode = () => {
    setForgotMode(true);
    setIsLogin(true); // ensure we're visually in "login" context
    setFormData({ username: '', email: '', password: '' });
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Loopin</h1>
          <p className="text-gray-600 mt-2">
            {forgotMode ? 'Reset your password' : 'Private & Secure Messaging'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username ONLY when registering */}
          {!isLogin && !forgotMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password (login/register) or New Password (forgot) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {forgotMode ? 'New Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={forgotMode ? 'Enter new password' : 'Enter password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>}
          {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded">{success}</div>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : forgotMode
                ? 'Reset Password'
                : isLogin
                  ? 'Sign In'
                  : 'Sign Up'}
          </button>
        </form>

        {/* Forgot password link */}
        {isLogin && !forgotMode && (
          <div className="text-right mt-2">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700"
              onClick={startForgotMode}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Toggle auth mode / back buttons */}
        <div className="text-center mt-6">
          {!forgotMode ? (
            <button
              type="button"
              onClick={handleToggleAuthMode}
              className="text-blue-600 hover:text-blue-700"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="text-blue-600 hover:text-blue-700"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
