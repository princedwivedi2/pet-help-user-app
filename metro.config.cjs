// CommonJS Metro config for Windows (avoids ESM loader issues)
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname)];
config.resolver.sourceExts = Array.from(
  new Set([...config.resolver.sourceExts, 'js', 'jsx', 'ts', 'tsx', 'json'])
);

module.exports = config;
