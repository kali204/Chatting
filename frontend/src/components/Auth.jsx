import { useState } from 'react';
import { Lock, Mail, User, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';
import './css/auth.css'; // Ensure this path is correct

export default function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotMode, setForgotMode] = useState(false);
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
    setIsLogin(true);
    setFormData({ username: '', email: '', password: '' });
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <MessageCircle className="logo-icon" />
          </div>
          <h1 className="auth-title">Loopin</h1>
          <p className="auth-subtitle">
            {forgotMode ? 'Reset your password' : 'Private & Secure Messaging'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && !forgotMode && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                required
                className="form-input"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {forgotMode ? 'New Password' : 'Password'}
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input password-input"
                placeholder={forgotMode ? 'Enter new password' : 'Enter password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="toggle-icon" /> : <Eye className="toggle-icon" />}
              </button>
            </div>
          </div>

          {error && <div className="message error-message">{error}</div>}
          {success && <div className="message success-message">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            <span className={`button-text ${loading ? 'loading' : ''}`}>
              {loading
                ? 'Processing...'
                : forgotMode
                  ? 'Reset Password'
                  : isLogin
                    ? 'Sign In'
                    : 'Sign Up'}
            </span>
          </button>
        </form>

        {isLogin && !forgotMode && (
          <div className="forgot-link">
            <button
              type="button"
              className="link-button"
              onClick={startForgotMode}
            >
              Forgot password?
            </button>
          </div>
        )}

        <div className="auth-toggle">
          {!forgotMode ? (
            <button
              type="button"
              onClick={handleToggleAuthMode}
              className="link-button"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="link-button"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
