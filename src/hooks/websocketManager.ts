import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

class WebSocketManager {
  private farmSocket: Socket | null = null;
  private petSocket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;
  private currentUserId: string | null = null;

  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  connect(userId: string | null): void {
    if (!userId) {
      this.disconnect();
      return;
    }

    // Check if token changed - if so, reconnect
    const token = this.getToken();
    const currentToken = (this.farmSocket as any)?.auth?.token || (this.petSocket as any)?.auth?.token;
    const tokenChanged = token && token !== currentToken;

    // If already connected for this user and token hasn't changed, don't reconnect
    if (this.currentUserId === userId && this.farmSocket?.connected && this.petSocket?.connected && !tokenChanged) {
      return;
    }

    // If token changed or user changed, disconnect old connections
    if (tokenChanged || this.currentUserId !== userId) {
      console.log('[WebSocketManager] Token or user changed, reconnecting...');
      this.disconnect();
    }

    // If connecting, wait
    if (this.isConnecting) {
      return;
    }

    this.currentUserId = userId;
    this.isConnecting = true;
    if (!token) {
      console.warn('[WebSocketManager] No auth token found');
      this.isConnecting = false;
      return;
    }

    // Check if token is expired (basic check - decode JWT payload)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.warn('[WebSocketManager] Token expired, not connecting');
        this.isConnecting = false;
        this.disconnect();
        return;
      }
    } catch (e) {
      // If can't decode token, try to connect anyway
      console.warn('[WebSocketManager] Could not decode token, attempting connection');
    }

    // Farm Socket
    if (!this.farmSocket || (!this.farmSocket.connected && !(this.farmSocket as any).connecting)) {
      if (this.farmSocket) {
        this.farmSocket.removeAllListeners();
        this.farmSocket.disconnect();
      }

      this.farmSocket = io(`${BACKEND_URL}/farm`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        reconnectionDelayMax: 5000,
        auth: { token },
      });

      this.setupFarmListeners();
    }

    // Pet Socket
    if (!this.petSocket || (!this.petSocket.connected && !(this.petSocket as any).connecting)) {
      if (this.petSocket) {
        this.petSocket.removeAllListeners();
        this.petSocket.disconnect();
      }

      this.petSocket = io(`${BACKEND_URL}/pet`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        reconnectionDelayMax: 5000,
        auth: { token },
      });

      this.setupPetListeners();
    }

    this.isConnecting = false;
  }

  private setupFarmListeners(): void {
    if (!this.farmSocket) return;

    this.farmSocket.on('connect', () => {
      console.log('[WebSocketManager] Farm connected:', this.farmSocket?.id);
      if (this.currentUserId) {
        this.farmSocket?.emit('joinUserRoom', this.currentUserId);
      }
      this.emit('farm:connected');
    });

    this.farmSocket.on('disconnect', (reason) => {
      console.log('[WebSocketManager] Farm disconnected:', reason);
      this.emit('farm:disconnected', reason);
      
      // If disconnected due to authentication error, don't reconnect
      if (reason === 'io server disconnect') {
        const token = this.getToken();
        if (!token) {
          console.warn('[WebSocketManager] No token, stopping reconnection');
          this.farmSocket.io.opts.reconnection = false;
        }
      }
    });

    this.farmSocket.on('connect_error', (error: any) => {
      console.error('[WebSocketManager] Farm connection error:', error);
      
      // If authentication failed, disable reconnection
      if (error.message?.includes('jwt') || error.message?.includes('expired') || error.message?.includes('unauthorized')) {
        console.warn('[WebSocketManager] Authentication failed, disabling reconnection');
        this.farmSocket.io.opts.reconnection = false;
        this.disconnect();
        this.emit('farm:error', error);
        return;
      }
      
      this.emit('farm:error', error);
    });

    // Farm events
    this.farmSocket.on('plant:updated', (data) => this.emit('plant:updated', data));
    this.farmSocket.on('plant:harvested', (data) => this.emit('plant:harvested', data));
    this.farmSocket.on('animal:updated', (data) => this.emit('animal:updated', data));
    this.farmSocket.on('animal:collected', (data) => this.emit('animal:collected', data));
    this.farmSocket.on('production:started', (data) => this.emit('production:started', data));
    this.farmSocket.on('production:completed', (data) => this.emit('production:completed', data));
    this.farmSocket.on('inventory:updated', (data) => this.emit('inventory:updated', data));
  }

  private setupPetListeners(): void {
    if (!this.petSocket) return;

    this.petSocket.on('connect', () => {
      console.log('[WebSocketManager] Pet connected:', this.petSocket?.id);
      if (this.currentUserId) {
        this.petSocket?.emit('joinUserRoom', this.currentUserId);
      }
      this.emit('pet:connected');
    });

    this.petSocket.on('disconnect', (reason) => {
      console.log('[WebSocketManager] Pet disconnected:', reason);
      this.emit('pet:disconnected', reason);
      
      // If disconnected due to authentication error, don't reconnect
      if (reason === 'io server disconnect') {
        const token = this.getToken();
        if (!token) {
          console.warn('[WebSocketManager] No token, stopping reconnection');
          this.petSocket.io.opts.reconnection = false;
        }
      }
    });

    this.petSocket.on('connect_error', (error: any) => {
      console.error('[WebSocketManager] Pet connection error:', error);
      
      // If authentication failed, disable reconnection
      if (error.message?.includes('jwt') || error.message?.includes('expired') || error.message?.includes('unauthorized')) {
        console.warn('[WebSocketManager] Authentication failed, disabling reconnection');
        this.petSocket.io.opts.reconnection = false;
        this.disconnect();
        this.emit('pet:error', error);
        return;
      }
      
      this.emit('pet:error', error);
    });

    // Pet events
    this.petSocket.on('pet:created', (data) => this.emit('pet:created', data));
    this.petSocket.on('pet:statsUpdated', (data) => this.emit('pet:statsUpdated', data));
    this.petSocket.on('pet:fed', (data) => this.emit('pet:fed', data));
    this.petSocket.on('pet:watered', (data) => this.emit('pet:watered', data));
    this.petSocket.on('pet:played', (data) => this.emit('pet:played', data));
    this.petSocket.on('pet:itemUsed', (data) => this.emit('pet:itemUsed', data));
    this.petSocket.on('pet:ranAway', (data) => this.emit('pet:ranAway', data));
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[WebSocketManager] Error in listener for ${event}:`, error);
      }
    });
  }

  disconnect(): void {
    if (this.farmSocket) {
      this.farmSocket.removeAllListeners();
      this.farmSocket.disconnect();
      this.farmSocket = null;
    }
    if (this.petSocket) {
      this.petSocket.removeAllListeners();
      this.petSocket.disconnect();
      this.petSocket = null;
    }
    this.currentUserId = null;
    this.listeners.clear();
  }

  isConnected(): boolean {
    return (this.farmSocket?.connected ?? false) && (this.petSocket?.connected ?? false);
  }

  getFarmSocket(): Socket | null {
    return this.farmSocket;
  }

  getPetSocket(): Socket | null {
    return this.petSocket;
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();
