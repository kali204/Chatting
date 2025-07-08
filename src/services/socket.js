import  { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    this.socket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
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
      this.socket.on('message', callback);
    }
  }
}

export const socketService = new SocketService();
 