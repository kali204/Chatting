import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    if (this.socket && this.socket.connected) {
      return; // Don't reconnect if already connected
    }
    this.socket = io('https://loopin-1vvf.onrender.com', {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ["websocket"], // Optional: enforce WebSocket (not polling)
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
      // Remove previous listeners before registering a new one
      this.socket.off('message'); 
      this.socket.on('message', callback);
    }
  }
}

export const socketService = new SocketService();
