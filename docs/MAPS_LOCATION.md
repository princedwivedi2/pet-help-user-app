# Maps & Location

Android-first Maps & Location feature for the pet-owner USER app
(Expo SDK 54, RN 0.81, `react-native-maps` + Google provider, `expo-location`).

## What was built

### 1. Nearby Vets map — `src/screens/Map/NearbyVetsScreen.tsx`
- Requests foreground location (`useUserLocation` hook), centers the map on the user.
- Renders nearby vet clinics as markers; tapping a marker opens a callout
  (name, specialization, distance, rating) that links to **Vet Detail**.
- **List ⇄ Map toggle** in the header; list is sorted nearest-first.
- Per-vet distance label, computed client-side via haversine.
- Graceful states:
  - **Permission denied** / **location unavailable** → banner + falls back to the
    default city (`DEFAULT_REGION`, Bengaluru) and a **Retry** action.
  - Vets without coordinates are kept in the List view and counted in the map
    footer ("N without a pin") rather than silently dropped.
  - Network/error → `ErrorCard`; empty → `EmptyState`.
- Entry point: **Search screen → "Map"** button in the results header.

### 2. Vet Detail map — `src/screens/Vet/VetDetailScreen.tsx`
- New **Clinic location** section: a small non-interactive map with a marker,
  the clinic address, and a **Get directions** button.
- "Get directions" opens the device maps app via `geo:` (Android) / `maps://`
  (iOS), falling back to a Google Maps `https` URL. Address-only deep link is
  used when coordinates are missing; the button disables when there's nothing to
  route to.
- Section hides entirely when neither coordinates nor address exist.

### 3. Config
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` read from env (see `.env.example`).
- `app.config.js` injects it into `android.config.googleMaps.apiKey` at prebuild,
  with a `YOUR_GOOGLE_MAPS_API_KEY` placeholder when unset (no crash — maps just
  render grey tiles).
- `app.json`: added `expo-location` plugin + `ACCESS_FINE_LOCATION` /
  `ACCESS_COARSE_LOCATION` Android permissions.
- `android/app/src/main/AndroidManifest.xml` was updated directly (location
  permissions + `com.google.android.geo.API_KEY` meta-data) because `expo prebuild`
  currently fails on a **pre-existing, unrelated** issue (the repo references
  `./assets/notification-icon.png` and other assets that don't exist — there is no
  `assets/` folder). Once those assets are restored, `expo prebuild -p android`
  will regenerate the manifest from `app.config.js` and inject the real key.

### 4. Distance
- `src/utils/geo.ts`: `haversineKm`, `formatDistance`, `extractCoords`,
  `openDirections`, `DEFAULT_REGION`/`DEFAULT_DELTA`. Used for display + sorting.

## Dependencies added
- `react-native-maps@1.20.1`
- `expo-location@~19.0.8`

## Backend gaps — REQUIRED additions

The existing `GET /vets` endpoint **already supports geo search**
(`lat`, `lng`, `radius_km` 1–100, `sort_by=distance`, returns
`nearby_vets[] / city_vets[] / all_vets[]`), so no new "nearby" endpoint is
needed. The client uses it via `getNearbyVets()`.

However, to actually place markers and offer directions, each vet payload must
expose its coordinates, which the audit shows it currently does **not**:

1. **Add `latitude` and `longitude` to `VetController::formatVet()`** — for BOTH
   the list branch (`GET /vets`) and the detail branch (`GET /vets/{uuid}`).
   These columns exist on the spec/model (`vet.latitude` / `vet.longitude` are
   referenced in `USER_APP_SCREENS.md` and the Vet Detail design) but are not in
   the API response. Without them:
   - the Nearby map shows no pins (vets fall back to the List view),
   - haversine distance can't be computed client-side (falls back to backend
     `distance_km` if present, else "Nearby"),
   - "Get directions" degrades to an address-only Google Maps search.

2. **(Recommended) Include `distance_km` in the list payload** when `lat`/`lng`
   are supplied, so distance is correct even before client coords resolve. The
   client already reads `distance_km` if present.

3. **(Recommended) Return a clinic `address`** field (the client reads
   `clinic_address` / `address` / `full_address`, or composes from
   `address_line1, city, state`).

The client is defensive about all of the above — it never crashes when fields
are missing — but markers and accurate distances depend on gap #1 being closed.

## What the user must provide
- **A Google Maps Android API key** (Google Cloud Console → enable *Maps SDK for
  Android*). Set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env`. Until then maps
  render grey tiles. (Markers, directions, location, and the List view all work
  without the key; only the map base tiles need it.)
- Restore the missing `assets/` (icon / notification-icon / splash) so
  `expo prebuild` / `expo run:android` can complete — this is a pre-existing
  repo issue, not part of this feature.
