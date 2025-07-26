import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    if (this.socket && this.socket.connected) {
      return; // Already connected
    }

    // Automatically use current origin (e.g., https://ngrok-url) instead of localhost
    this.socket = io('/', {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket'], // Force WebSocket
    });

    this.socket.emit('join', userId);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message) {
    if (this.socket) {
      this.socket.emit('message', message);
    }
  }

  onMessage(callback) {
    if (this.socket) {
      this.socket.off('message'); // Remove old listeners
      this.socket.on('message', callback);
    }
  }
}

export const socketService = new SocketService();
