import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/farm',
})
export class FarmGateway implements OnGatewayConnection, OnGatewayDisconnect {
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
        console.log(`[Farm WebSocket] Client connected: ${client.id}, User: ${payload.sub || payload.id}`);
      }
    } catch (error) {
      console.error('[Farm WebSocket] Authentication failed:', error.message);
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
      console.log(`[Farm WebSocket] Client disconnected: ${client.id}`);
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
      console.log(`[Farm WebSocket] Client ${client.id} joined room ${room}`);
    }
  }

  // Emit events to specific user
  emitToUser(userId: string, event: string, data: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit(event, data);
  }

  // Farm events
  notifyPlantUpdate(userId: string, plant: any) {
    this.emitToUser(userId, 'plant:updated', plant);
  }

  notifyPlantHarvested(userId: string, plantId: string, item: any) {
    this.emitToUser(userId, 'plant:harvested', { plantId, item });
  }

  notifyAnimalUpdate(userId: string, animal: any) {
    this.emitToUser(userId, 'animal:updated', animal);
  }

  notifyAnimalCollected(userId: string, animalId: string, item: any) {
    this.emitToUser(userId, 'animal:collected', { animalId, item });
  }

  notifyProductionStarted(userId: string, production: any) {
    this.emitToUser(userId, 'production:started', production);
  }

  notifyProductionCompleted(userId: string, productionId: string, item: any) {
    this.emitToUser(userId, 'production:completed', { productionId, item });
  }

  notifyInventoryUpdate(userId: string, inventory: any) {
    this.emitToUser(userId, 'inventory:updated', inventory);
  }
}
