import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StageService } from '../../services/stage/stage.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'stage',
})
export class StageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private stageService: StageService) {}

  async handleConnection(client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    if (sessionId) {
      client.join(`session:${sessionId}`);
      
      // Send initial Stage Truth to the newly connected client
      const truth = await this.stageService.getStageTruth(sessionId);
      client.emit('STAGE_TRUTH_INITIAL', truth);
      
      console.log(`👤 Client ${client.id} joined session ${sessionId}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🚫 Client ${client.id} disconnected`);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any) {
    return { event: 'pong', data };
  }
}
