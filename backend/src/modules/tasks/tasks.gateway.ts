import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'tasks',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class TasksGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TasksGateway.name);

  afterInit() {
    this.logger.log('Tasks WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to tasks: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from tasks: ${client.id}`);
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(client: Socket, userId: string) {
    client.join(`user:${userId}`);
    this.logger.log(`User ${userId} joined their room`);
    return { event: 'joined', data: { userId } };
  }

  // Emit comment notification to student
  emitCommentNotification(studentId: string, data: any) {
    this.server.to(`user:${studentId}`).emit('comment:new', data);
    this.logger.log(`Comment notification sent to student ${studentId}`);
  }

  // Emit submission status change to student
  emitSubmissionStatusChange(studentId: string, data: any) {
    this.server.to(`user:${studentId}`).emit('submission:statusChanged', data);
    this.logger.log(`Submission status change sent to student ${studentId}`);
  }
}
