import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.gameEventListeners = {};
    this.isConnecting = false;
  }

  // Connect to the socket server
  connect(token) {
    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected, no need to reconnect');
      return true;
    }
    
    if (this.isConnecting) {
      console.log('Socket connection already in progress');
      return false;
    }
    
    try {
      console.log('Attempting to connect to socket server at:', SOCKET_URL);
      this.isConnecting = true;
      
      // Connect with authentication token
      this.socket = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000 // 10 seconds timeout
      });
      
      // Setup default event listeners
      this.socket.on('connect', () => {
        this.isConnecting = false;
        console.log('Socket connected successfully with ID:', this.socket.id);
      });
      
      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      this.socket.on('connect_error', (error) => {
        this.isConnecting = false;
        console.error('Socket connection error:', error.message);
        
        // Check for auth error
        if (error.message.includes('auth')) {
          console.error('Authentication error - invalid token');
        }
      });
      
      return true;
    } catch (error) {
      this.isConnecting = false;
      console.error('Error initializing socket connection:', error);
      return false;
    }
  }
  
  // Check if socket is connected
  isConnected() {
    return this.socket && this.socket.connected;
  }
  
  // Disconnect from the socket server
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // Join a game room to receive game-specific events
  joinGame(gameId) {
    if (!this.socket) {
      console.error('Socket not initialized - cannot join game');
      return false;
    }
    
    if (!this.socket.connected) {
      console.error('Socket not connected - cannot join game - connection status:', 
        this.socket.connected ? 'connected' : 'disconnected');
      return false;
    }
    
    console.log(`Joining game room: ${gameId}`);
    this.socket.emit('join-game', gameId);
    return true;
  }
  
  // Leave a game room
  leaveGame(gameId) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected - cannot leave game');
      return false;
    }
    
    console.log(`Leaving game room: ${gameId}`);
    this.socket.emit('leave-game', gameId);
    return true;
  }
  
  // Attempt to conquer a pub
  conquerPub(gameId, pubId) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected - cannot conquer pub');
      return false;
    }
    
    console.log(`Attempting to conquer pub ${pubId} in game ${gameId}`);
    this.socket.emit('conquer-pub', { gameId, pubId });
    return true;
  }
  
  // Subscribe to socket events
  on(event, callback) {
    if (!this.socket) {
      console.error('Socket not initialized - cannot listen for event:', event);
      return false;
    }
    
    console.log(`Setting up listener for event: ${event}`);
    this.socket.on(event, callback);
    
    // Store callback for potential cleanup
    if (!this.gameEventListeners[event]) {
      this.gameEventListeners[event] = [];
    }
    this.gameEventListeners[event].push(callback);
    return true;
  }
  
  // Unsubscribe from socket events
  off(event, callback) {
    if (!this.socket) {
      return false;
    }
    
    if (callback) {
      this.socket.off(event, callback);
      
      // Remove specific callback from listeners
      if (this.gameEventListeners[event]) {
        this.gameEventListeners[event] = this.gameEventListeners[event].filter(
          cb => cb !== callback
        );
      }
    } else {
      this.socket.off(event);
      delete this.gameEventListeners[event];
    }
    return true;
  }
  
  // Remove all event listeners for cleanup
  removeAllListeners() {
    if (!this.socket) {
      return;
    }
    
    console.log('Removing all socket event listeners');
    Object.keys(this.gameEventListeners).forEach(event => {
      this.socket.off(event);
    });
    
    this.gameEventListeners = {};
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 