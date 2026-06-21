import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  ConnectionStateType,
} from 'react-native-agora';
import type { IRtcEngine, IRtcEngineEventHandler } from 'react-native-agora';
import type { RtcProvider, RtcCallbacks, ConnectionState } from './types';

export class AgoraRtcProvider implements RtcProvider {
  private engine: IRtcEngine | null = null;
  private callbacks: RtcCallbacks = {};
  private handler: IRtcEngineEventHandler = {};

  setCallbacks(callbacks: RtcCallbacks): void {
    this.callbacks = callbacks;
  }

  async init(appId: string): Promise<void> {
    this.engine = createAgoraRtcEngine();
    this.engine.initialize({
      appId,
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
    });
    this.handler = {
      onUserJoined: (_conn, uid) => this.callbacks.onRemoteUserJoined?.(uid),
      onUserOffline: (_conn, uid) => this.callbacks.onRemoteUserLeft?.(uid),
      onConnectionStateChanged: (_conn, state) =>
        this.callbacks.onConnectionStateChanged?.(this.mapState(state)),
      onError: (code, msg) => this.callbacks.onError?.(code, msg ?? ''),
    };
    this.engine.registerEventHandler(this.handler);
    this.engine.enableVideo();
    this.engine.enableAudio();
    this.engine.startPreview();
  }

  async joinChannel(channel: string, token: string, uid: number): Promise<void> {
    this.engine?.joinChannel(token, channel, uid, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });
  }

  async leaveChannel(): Promise<void> {
    this.engine?.leaveChannel();
  }

  async toggleMic(on: boolean): Promise<void> {
    this.engine?.muteLocalAudioStream(!on);
  }

  async toggleCamera(on: boolean): Promise<void> {
    this.engine?.muteLocalVideoStream(!on);
  }

  async switchCamera(): Promise<void> {
    this.engine?.switchCamera();
  }

  async destroy(): Promise<void> {
    if (this.engine) {
      this.engine.unregisterEventHandler(this.handler);
      this.engine.release();
      this.engine = null;
    }
  }

  private mapState(state: ConnectionStateType): ConnectionState {
    switch (state) {
      case ConnectionStateType.ConnectionStateConnecting:
        return 'connecting';
      case ConnectionStateType.ConnectionStateConnected:
        return 'connected';
      case ConnectionStateType.ConnectionStateReconnecting:
        return 'reconnecting';
      case ConnectionStateType.ConnectionStateFailed:
        return 'failed';
      default:
        return 'disconnected';
    }
  }
}
