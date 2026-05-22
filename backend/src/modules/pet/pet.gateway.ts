import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/pet',
})
export class PetGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userRooms = new Map<string, string>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;

      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log(`[Pet WebSocket] Client connected: ${client.id}, User: ${payload.sub || payload.id}`);
      }
    } catch (error) {
      console.error('[Pet WebSocket] Authentication failed:', error.message);
      client.disconnect();
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const token = client.handshake.auth?.token || client.handshake.query?.token;
    return token as string || null;
  }

  handleDisconnect(client: Socket) {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`[Pet WebSocket] Client disconnected: ${client.id}`);
    }
    this.userRooms.delete(client.id);
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinRoom(client: Socket, userId: string) {
    const room = `user:${userId}`;
    client.join(room);
    this.userRooms.set(client.id, room);
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      console.log(`[Pet WebSocket] Client ${client.id} joined pet room ${room}`);
    }
  }

  // Emit events to specific user
  emitToUser(userId: string, event: string, data: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit(event, data);
  }

  // Pet events
  notifyPetCreated(userId: string, pet: any) {
    this.emitToUser(userId, 'pet:created', pet);
  }

  notifyPetStatsUpdate(userId: string, pet: any) {
    this.emitToUser(userId, 'pet:statsUpdated', pet);
  }

  notifyPetFed(userId: string, pet: any) {
    this.emitToUser(userId, 'pet:fed', pet);
  }

  notifyPetWatered(userId: string, pet: any) {
    this.emitToUser(userId, 'pet:watered', pet);
  }

  notifyPetPlayed(userId: string, pet: any) {
    this.emitToUser(userId, 'pet:played', pet);
  }

  notifyPetItemUsed(userId: string, pet: any, item: any) {
    this.emitToUser(userId, 'pet:itemUsed', { pet, item });
  }

  notifyPetRanAway(userId: string, petId: string) {
    this.emitToUser(userId, 'pet:ranAway', { petId });
  }
}
