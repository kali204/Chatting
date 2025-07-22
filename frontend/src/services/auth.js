const API_URL = '/api';

// Helper function to safely parse JSON or return a plain object on error/empty
async function safeJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await safeJson(response);
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    localStorage.setItem('token', data.token);
    return data.user;
  },

  async register(username, email, password) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await safeJson(response);
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    localStorage.setItem('token', data.token);
    return data.user;
  },

  async validateToken(token) {
    const response = await fetch(`${API_URL}/auth/validate`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await safeJson(response);
    if (!response.ok) throw new Error(data.message || 'Invalid token');
    return data.user;
  }
};
