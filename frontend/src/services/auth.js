// src/services/auth.js
async function safeJson(response) {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

const BASE = 'http://127.0.0.1:5000'; // ✅ Updated

export const authService = {
  async login(email, password) {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('token', data.token);
    return data.user || {};
  },

  async register(username, email, password) {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('token', data.token);
    return data.user || {};
  },

  async validateToken(token) {
    const res = await fetch(`${BASE}/api/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || 'Invalid token');
    return data.user || {};
  },

  async resetPassword(email, password) {
    try {
      const res = await fetch(`${BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to reset password');
      }
      return await res.json();
    } catch (err) {
      throw err;
    }
  },
};
