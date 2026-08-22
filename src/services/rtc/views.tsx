import React from 'react';
import { StyleSheet } from 'react-native';
import { RtcSurfaceView } from 'react-native-agora';
import type { ViewStyle } from 'react-native';

export function RtcLocalView({ style }: { style?: ViewStyle }) {
  return <RtcSurfaceView canvas={{ uid: 0 }} style={[StyleSheet.absoluteFill, style]} />;
}

export function RtcRemoteView({ uid, style }: { uid: number; style?: ViewStyle }) {
  return <RtcSurfaceView canvas={{ uid }} style={[StyleSheet.absoluteFill, style]} />;
}
