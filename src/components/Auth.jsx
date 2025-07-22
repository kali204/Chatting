import { useState } from 'react';
import { Lock, Mail, User, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';

export default function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const userData = isLogin
        ? await authService.login(formData.email, formData.password)
        : await authService.register(formData.username, formData.email, formData.password);
      setUser(userData);
      setSuccess(isLogin ? "Successfully logged in" : "Registration successful");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields when switching between Login/Register
  const handleToggle = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '' });
    setError('');
    setSuccess('');
  };

  // Password strength meter function
  const passwordStrength = (pw) => {
    if (pw.length < 6) return 'Weak';
    if (pw.match(/[A-Z]/) && pw.match(/[0-9]/) && pw.length > 8) return 'Strong';
    return 'Medium';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Loopin</h1>
          <p className="text-gray-600 mt-2">Private &amp; Secure Messaging</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  disabled={isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {!isLogin && (
              <div className={`text-sm mt-1 ${passwordStrength(formData.password) === 'Strong' ? 'text-green-600' : passwordStrength(formData.password) === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                Password strength: {passwordStrength(formData.password)}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded">{success}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleToggle}
            className="text-blue-600 hover:text-blue-700"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
