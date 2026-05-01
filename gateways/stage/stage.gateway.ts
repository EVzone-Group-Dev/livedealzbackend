import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StageService } from '../../services/stage/stage.service';
import { AudienceService } from '../../services/audience/audience.service';
import { BuyerService } from '../../services/buyer/buyer.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'stage',
})
export class StageGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private stageService: StageService,
    private audienceService: AudienceService,
    private buyerService: BuyerService,
  ) {}

  async handleConnection(client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    const userId = client.handshake.query.userId as string;

    if (sessionId) {
      client.join(`session:${sessionId}`);

      // Send initial Stage Truth
      const truth = await this.stageService.getStageTruth(sessionId);
      client.emit('STAGE_TRUTH_INITIAL', truth);

      if (userId) {
        // Record watch history
        void this.buyerService.recordWatch(userId, sessionId);

        // Broadcast join event to chat
        void this.audienceService.submitChatMessage(
          sessionId,
          userId,
          'joined the live',
          'JOIN',
        );
      }

      console.log(
        `👤 Client ${client.id} (User: ${userId || 'Guest'}) joined session ${sessionId}`,
      );
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
