import type { ViewStyle } from 'react-native';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export interface RtcCallbacks {
  onRemoteUserJoined?: (uid: number) => void;
  onRemoteUserLeft?: (uid: number) => void;
  onConnectionStateChanged?: (state: ConnectionState) => void;
  onError?: (code: number, msg: string) => void;
}

export interface VideoViewProps {
  style?: ViewStyle;
}

export interface RtcProvider {
  init(appId: string, options?: { enableVideo?: boolean }): Promise<void>;
  joinChannel(channel: string, token: string, uid: number): Promise<void>;
  leaveChannel(): Promise<void>;
  toggleMic(on: boolean): Promise<void>;
  toggleCamera(on: boolean): Promise<void>;
  switchCamera(): Promise<void>;
  destroy(): Promise<void>;
  setCallbacks(callbacks: RtcCallbacks): void;
}

export interface RtcTokenResponse {
  token: string;
  uid: number;
  channel: string;
  expires_at: string;
}
