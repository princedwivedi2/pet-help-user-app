// Dynamic Expo config. Expo passes the static app.json contents in as `config`;
// here we layer the Google Maps Android API key on top, read from the
// EXPO_PUBLIC_GOOGLE_MAPS_API_KEY env var so the key is never committed.
//
// If the key isn't set, a clearly-fake placeholder is used so prebuild still
// succeeds — maps will render grey tiles until a real key is supplied, but the
// app won't crash.
const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...(config.android && config.android.config),
      googleMaps: {
        ...(config.android && config.android.config && config.android.config.googleMaps),
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
  },
})
