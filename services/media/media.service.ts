import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class MediaService {
  private apiKey: string;
  private apiSecret: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('LIVEKIT_API_KEY')!;
    this.apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET')!;
  }

  /**
   * Generate a JWT for a user to join a LiveKit room.
   */
  async generateToken(roomName: string, participantName: string, canPublish: boolean) {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish,
      canSubscribe: true,
    });

    return await at.toJwt();
  }

  async startRecording(sessionId: string) {
    // Logic to trigger LiveKit Egress (requires Egress client)
    console.log(`⏺️ Starting cloud recording for session ${sessionId}`);
    return { recordingId: `rec_${Date.now()}` };
  }
}
