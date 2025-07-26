const API_URL = '/api';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const chatService = {
  async getUsers() {
    const response = await fetch(`${API_URL}/users`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getMessages(userId) {
    const response = await fetch(`${API_URL}/messages/${userId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async sendMessage(message) {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(message)
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  }
};
