import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { request } from '../client';
import { AgoraRtcProvider } from './AgoraRtcProvider';
import type { ConnectionState, RtcProvider, RtcTokenResponse } from './types';

async function requestRtcPermissions(audioOnly: boolean): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const permissions = audioOnly
      ? [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]
      : [PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    const results = await PermissionsAndroid.requestMultiple(permissions);
    return permissions.every((p) => results[p] === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

export function useRtcSession(consultationUuid: string, options?: { audioOnly?: boolean }) {
  const audioOnly = options?.audioOnly ?? false;
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(!audioOnly);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [callSeconds, setCallSeconds] = useState(0);
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(null);
  const [tokenData, setTokenData] = useState<RtcTokenResponse | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const providerRef = useRef<RtcProvider | null>(null);
  const destroyedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch RTC token using this app's fetch-based client
  useEffect(() => {
    let cancelled = false;
    setTokenLoading(true);
    setTokenError(null);
    request<RtcTokenResponse>(`/consultations/${consultationUuid}/rtc-token`)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setTokenData(res.data);
        } else {
          setTokenError(res.message ?? 'Failed to fetch RTC token');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setTokenError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setTokenLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [consultationUuid]);

  useEffect(() => {
    requestRtcPermissions(audioOnly).then(setPermissionsGranted);
  }, [audioOnly]);

  useEffect(() => {
    if (!permissionsGranted || !tokenData) return;

    const provider: RtcProvider = new AgoraRtcProvider();
    providerRef.current = provider;
    destroyedRef.current = false;

    provider.setCallbacks({
      onRemoteUserJoined: (uid) => setRemoteUid(uid),
      onRemoteUserLeft: () => setRemoteUid(null),
      onConnectionStateChanged: setConnectionState,
      onError: (code, msg) => console.warn('[RTC]', code, msg),
    });

    const appId = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '';
    if (!appId) {
      // No Agora App ID configured — can't establish a call. Surface as a
      // failed connection so the UI offers the chat fallback instead of
      // hanging on "Waiting for vet…".
      console.error('[RTC] EXPO_PUBLIC_AGORA_APP_ID is not set');
      setConnectionState('failed');
      return;
    }
    provider
      .init(appId, { enableVideo: !audioOnly })
      .then(() => provider.joinChannel(tokenData.channel, tokenData.token, tokenData.uid))
      .catch((err: unknown) => {
        console.error('[RTC] join failed', err);
        if (!destroyedRef.current) setConnectionState('failed');
      });

    return () => {
      if (!destroyedRef.current) {
        destroyedRef.current = true;
        provider.leaveChannel();
        provider.destroy();
        providerRef.current = null;
      }
    };
  }, [permissionsGranted, tokenData, audioOnly]);

  useEffect(() => {
    if (connectionState === 'connected') {
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionState]);

  const toggleMic = useCallback(async () => {
    const next = !isMicOn;
    await providerRef.current?.toggleMic(next);
    setIsMicOn(next);
  }, [isMicOn]);

  const toggleCamera = useCallback(async () => {
    const next = !isCameraOn;
    await providerRef.current?.toggleCamera(next);
    setIsCameraOn(next);
  }, [isCameraOn]);

  const switchCamera = useCallback(async () => {
    await providerRef.current?.switchCamera();
  }, []);

  const leave = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider || destroyedRef.current) return;
    destroyedRef.current = true;
    providerRef.current = null;
    await provider.leaveChannel();
    await provider.destroy();
  }, []);

  return {
    isMicOn,
    isCameraOn,
    remoteUid,
    connectionState,
    callSeconds,
    permissionsGranted,
    tokenLoading,
    tokenError,
    toggleMic,
    toggleCamera,
    switchCamera,
    leave,
  };
}
