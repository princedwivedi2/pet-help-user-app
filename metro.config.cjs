// Minimal CommonJS Metro config for Windows (avoids ESM loader issues)
const path = require('path');

module.exports = {
  projectRoot: __dirname,
  watchFolders: [path.resolve(__dirname)],
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
  },
};
