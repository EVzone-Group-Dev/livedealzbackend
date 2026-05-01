import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../infra/prisma.service';
import { RedisService } from '../infra/redis.service';

@Injectable()
export class MediaService {
  private apiKey: string;
  private apiSecret: string;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {
    this.apiKey = this.configService.get<string>('LIVEKIT_API_KEY')!;
    this.apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET')!;
  }

  /**
   * Generate a JWT for a user to join a LiveKit room.
   */
  async generateToken(
    roomName: string,
    participantName: string,
    canPublish: boolean,
  ) {
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
    const recordingId = `rec_${Date.now()}`;

    await this.prismaService.session.update({
      where: { id: sessionId },
      data: {
        isRecording: true,
        recordingId,
      },
    });

    console.log(
      `⏺️ Starting cloud recording for session ${sessionId} (ID: ${recordingId})`,
    );

    // Broadcast via Redis
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'RECORDING_STARTED',
        data: { recordingId },
      }),
    );

    return { recordingId };
  }

  async stopRecording(sessionId: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      select: { recordingId: true },
    });

    await this.prismaService.session.update({
      where: { id: sessionId },
      data: {
        isRecording: false,
        recordingId: null,
      },
    });

    console.log(`⏹️ Stopping cloud recording for session ${sessionId}`);

    // Broadcast via Redis
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'RECORDING_STOPPED',
        data: { recordingId: session?.recordingId },
      }),
    );

    return { success: true };
  }

  async updateVideoSettings(sessionId: string, settings: any) {
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: { videoSettings: settings },
    });

    // Broadcast update so all operators/participants see the change
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'VIDEO_SETTINGS_UPDATED',
        data: settings,
      }),
    );

    return { success: true, settings };
  }

  async getScenes(sessionId: string) {
    return await this.prismaService.scene.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async activateScene(sessionId: string, sceneId: string) {
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: { activeSceneId: sceneId },
    });

    // Broadcast to all viewers via Redis
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'SCENE_CHANGE',
        data: { sceneId },
      }),
    );

    return { success: true, activeSceneId: sceneId };
  }

  async updateFilters(sessionId: string, filters: Record<string, any>) {
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: { activeFilters: filters },
    });

    // Update Stage Truth (for late joiners)
    await this.redisService.hSet(
      `stage:truth:${sessionId}`,
      'activeFilters',
      JSON.stringify(filters),
    );

    // Broadcast to all active viewers via Redis
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'FILTER_CHANGE',
        data: filters,
      }),
    );

    return { success: true, filters };
  }

  async getSourceMetadata(sessionId: string) {
    return await this.prismaService.sourceMetadata.findMany({
      where: { sessionId },
    });
  }

  async updateSourceMetadata(sessionId: string, sourceId: string, data: any) {
    const metadata = await this.prismaService.sourceMetadata.upsert({
      where: { sessionId_sourceId: { sessionId, sourceId } },
      update: data,
      create: { ...data, sessionId, sourceId },
    });

    // Broadcast update
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'SOURCE_METADATA_UPDATED',
        data: metadata,
      }),
    );

    return metadata;
  }

  async uploadAsset(
    sessionId: string,
    data: {
      name: string;
      url: string;
      type: string;
      width?: number;
      height?: number;
      sizeBytes?: number;
    },
  ) {
    const asset = await this.prismaService.sessionAsset.create({
      data: {
        ...data,
        sessionId,
      },
    });

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'ASSET_UPLOADED',
        data: asset,
      }),
    );

    return asset;
  }

  async getAssets(sessionId: string) {
    return await this.prismaService.sessionAsset.findMany({
      where: { sessionId },
    });
  }

  async getLivePlaybackInfo(sessionId: string, token?: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      include: { host: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // In production, this would connect to LiveKit to get the actual stream URL
    // For now, return HLS URL format that LiveKit would provide
    const roomName = `session-${sessionId}`;
    const rawBaseUrl = this.configService.get<string>('LIVEKIT_URL') || 'http://localhost:7880';

    // LiveKit signal connections are WSS, but HLS delivery is over HTTPS on a CDN endpoint.
    // Convert the signal URL to an HTTP base and construct the HLS path.
    const httpBaseUrl = rawBaseUrl
      .replace(/^wss:\/\//, 'https://')
      .replace(/^ws:\/\//, 'http://');

    // In development (localhost) LiveKit doesn't serve HLS natively — return null so
    // the buyer player falls back to the local demo video instead of throwing a network error.
    const isLocalDev = httpBaseUrl.includes('localhost') || httpBaseUrl.includes('127.0.0.1');
    const hlsUrl = isLocalDev
      ? null
      : `${httpBaseUrl}/live/${roomName}/index.m3u8`;
    const dashUrl = isLocalDev
      ? null
      : `${httpBaseUrl}/live/${roomName}/manifest.mpd`;




    return {
      liveSessionId: sessionId,
      status: session.status === 'LIVE' ? 'live' : session.status === 'ENDED' ? 'ended' : 'starting',
      playback: hlsUrl ? {
        id: `playback-${sessionId}`,
        manifestUrl: hlsUrl,
        fallbackUrl: hlsUrl,
        posterUrl: '',
        mimeType: 'application/x-mpegURL',
        sourceWidth: 1920,
        sourceHeight: 1080,
        sourceBitrate: 4000000,
        processingStatus: 'ready',
        adaptivePlaybackAvailable: true,
        renditions: [
          { id: '1080p', url: hlsUrl, width: 1920, height: 1080, bitrate: 5000000, codec: 'avc1', fps: 30, label: '1080p HD' },
          { id: '720p', url: hlsUrl, width: 1280, height: 720, bitrate: 2500000, codec: 'avc1', fps: 30, label: '720p HD' },
          { id: '480p', url: hlsUrl, width: 854, height: 480, bitrate: 1000000, codec: 'avc1', fps: 30, label: '480p SD' },
          { id: '360p', url: hlsUrl, width: 640, height: 360, bitrate: 500000, codec: 'avc1', fps: 30, label: '360p' },
        ],
        auth: token ? { signed: true, tokenizedCdn: true, expiresAt: new Date(Date.now() + 3600000).toISOString() } : { signed: false },
      } : null,
      latencyTier: 'ultra_low',
      liveEdgeTargetMs: 2000,
    };

  }

  async getAdPlaybackInfo(adId: string) {
    // Mock ad playback info - in production would fetch from CDN
    return {
      adId,
      playback: {
        id: `ad-${adId}`,
        manifestUrl: `https://cdn.example.com/ads/${adId}/master.m3u8`,
        fallbackUrl: `https://cdn.example.com/ads/${adId}/fallback.mp4`,
        posterUrl: `https://cdn.example.com/ads/${adId}/poster.jpg`,
        mimeType: 'application/x-mpegURL',
        sourceWidth: 1280,
        sourceHeight: 720,
        sourceBitrate: 2000000,
        processingStatus: 'ready',
        adaptivePlaybackAvailable: true,
        renditions: [
          { id: '720p', url: `https://cdn.example.com/ads/${adId}/720p.m3u8`, width: 1280, height: 720, bitrate: 2000000, codec: 'avc1', fps: 30, label: '720p' },
          { id: '480p', url: `https://cdn.example.com/ads/${adId}/480p.m3u8`, width: 854, height: 480, bitrate: 1000000, codec: 'avc1', fps: 30, label: '480p' },
        ],
        auth: { signed: false },
      },
    };
  }
}
