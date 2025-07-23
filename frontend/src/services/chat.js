const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';


const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const chatService = {
  async getUsers() {
    const response = await fetch(`${API_URL}/users`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  async getMessages(userId) {
    const response = await fetch(`${API_URL}/messages/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  async sendMessage(message) {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(message)
    });
    return response.json();
  }
};
 