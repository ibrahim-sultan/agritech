import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const serverUrl = process.env.REACT_APP_WS_URL || 
      process.env.REACT_APP_API_URL?.replace('/api', '') || (
        process.env.NODE_ENV === 'production' 
          ? window.location.origin  // Fallback to current domain in production
          : 'http://localhost:5000'
      );
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      this.isConnected = true;
      
      // Join price updates room
      this.socket.emit('joinPriceUpdates');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Subscribe to price updates
  onPriceUpdate(callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on('priceUpdate', callback);
  }

  // Unsubscribe from price updates
  offPriceUpdate(callback) {
    if (this.socket) {
      this.socket.off('priceUpdate', callback);
    }
  }

  // Subscribe to price alerts
  subscribeToPriceAlerts(cropName, market, priceThreshold) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.emit('subscribeToPriceAlerts', {
      cropName,
      market,
      priceThreshold
    });
  }

  // Generic event listener
  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.on(event, callback);
  }

  // Generic event emitter
  emit(event, data) {
    if (!this.socket) {
      this.connect();
    }
    
    this.socket.emit(event, data);
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get connection status
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
