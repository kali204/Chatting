import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Chat from './components/Chat';
import ResetPassword from './components/ResetPassword';
import { authService } from './services/auth';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReset, setShowReset] = useState(false); // Added state for reset screen

  // Show reset password page
  if (showReset) {
    return <ResetPassword setShowReset={setShowReset} />;
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService
        .validateToken(token)
        .then((userData) => setUser(userData))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? (
    <Chat user={user} setUser={setUser} />
  ) : (
    <Auth setUser={setUser} setShowReset={setShowReset} />
  );
}

export default App;
