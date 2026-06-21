# RESPAW User App — Release-Grade QA Report

**Date:** 2026-06-20
**Scope:** Full Android-first QA pass of the pet-owner USER app (Expo SDK 54, RN 0.81, fetch + React Context). Every screen and flow reviewed for functional correctness, UI/UX polish, and edge cases. P0/P1 issues fixed in code; `tsc --noEmit` clean throughout.

---

## Summary

- **Release blocker fixed:** the app referenced `./assets/notification-icon.png` but had **no `assets/` folder at all**, so `expo prebuild` / `expo run:android` failed. A full branded asset set was created and wired; **`expo prebuild -p android` now completes successfully** and generates launcher icons, adaptive icon, splash, and notification-icon drawables.
- **Systemic UI blocker fixed:** Android **edge-to-edge is enabled** (`edgeToEdgeEnabled=true`) but there was **no `SafeAreaProvider`** and no top-inset handling, so screen titles/headers rendered *under* the status bar across the whole app. Added `SafeAreaProvider` + a navigator-level safe-area wrapper covering all tab and stack screens.
- **Production hygiene fixed:** the Login screen shipped a debug "Test API connection" control, printed the backend URL on-screen, and surfaced raw exception strings (incl. the API base URL) in error alerts. All removed / replaced with friendly messages.
- Several smaller correctness/UX issues fixed (dead "Reschedule" button, fake fallback user name, consultation chat not receiving replies, RTC hanging silently when Agora isn't configured, in-app notification deep-linking).

Overall the codebase is in good shape: consistent theme tokens, ErrorCard/EmptyState patterns, optimistic chat, robust payment + consultation state machines, inline form validation. The defects were concentrated in build config, edge-to-edge insets, and a few unfinished affordances.

---

## P0 — Breaks / blocks release

### P0-1 — Missing `assets/` → prebuild & Android build fail ✅ FIXED
`app.json` referenced `./assets/notification-icon.png` and Expo expected app icon/splash/adaptive-icon, but no `assets/` directory existed. `expo prebuild` aborted with `ENOENT … notification-icon.png`, so **no Android build could be produced**.
**Fix:** Generated a branded paw-mark asset set as valid PNGs — `icon.png` (1024²), `adaptive-icon.png`, `splash-icon.png`, `notification-icon.png` (96², white-on-transparent for Android tinting), `favicon.png`. Wired into `app.json` (`icon`, `expo-splash-screen` plugin, `android.adaptiveIcon`, `web.favicon`) and installed `expo-splash-screen` + `expo-system-ui`. **`expo prebuild -p android` now finishes**; launcher/notification drawables are generated.

### P0-2 — Edge-to-edge content clipped under the status bar ✅ FIXED
`gradle.properties` has `edgeToEdgeEnabled=true`, so content draws under the system bars. There was no `SafeAreaProvider` (despite `PetsScreen` calling `useSafeAreaInsets()` and `ConsultationRoom` using RN's iOS-only `SafeAreaView`). Result: every screen's title/header was partially hidden behind the status bar on Android.
**Fix:** Added `SafeAreaProvider` in `App.tsx`; created `withSafeTop` HOC (`src/components/SafeScreen.tsx`) and applied it to all 5 tab screens and all relevant stack screens in `AppNavigator.tsx`. `NearbyVets` and `Payment` now use `useSafeAreaInsets()` for their custom headers; `ConsultationRoom` switched to `react-native-safe-area-context`'s `SafeAreaView` (works on Android). Full-bleed screens (Splash, ConsultationRoom body) opt out.

---

## P1 — Significant

### P1-1 — Login ships debug tooling & leaks backend details ✅ FIXED
`LoginScreen` rendered a "Test API connection" link, printed `API_BASE` on screen, and error alerts did `String(error) + "\n\nAPI: " + API_BASE` — exposing the internal API URL and raw stack strings to end users.
**Fix:** Removed the debug link, the on-screen URL, and `handleApiTest`; all auth catch blocks now use `parseApiError()` for friendly, consistent messaging. Removed dead styles.

### P1-2 — Consultation chat never received replies ✅ FIXED
The chat room (`modality === 'chat'`) and the in-call chat panel loaded messages once with no polling or socket, so a vet's reply never appeared without leaving and re-entering.
**Fix:** Added a silent 5-second poll to both surfaces that merges the server list while preserving still-pending / failed optimistic messages (deduped by content + sender), so no duplicates and failed sends stay visible.

### P1-3 — Video room hangs forever when Agora isn't configured ✅ FIXED
In `useRtcSession`, a missing `EXPO_PUBLIC_AGORA_APP_ID` or a `joinChannel` rejection only did `console.error`; the UI sat on "Waiting for your vet to join…" indefinitely with no recovery.
**Fix:** Missing App ID and join failures now set `connectionState = 'failed'`, which triggers the existing "Connection Lost" overlay offering **Continue via Chat** / **Leave**.

### P1-4 — Dead "Reschedule appointment" button ✅ FIXED
`AppointmentDetailScreen` rendered a primary-styled "Reschedule appointment" button with **no `onPress`** — looked functional, did nothing.
**Fix:** It now explains the supported path (cancel + rebook) via an alert. (A true reschedule endpoint is a backend/product follow-up.)

### P1-5 — Fake hardcoded user name ✅ FIXED
`HomeScreen` fell back to `'Aanya'` for the greeting and nearby-vet count seed, so a real user with no name briefly saw someone else's name.
**Fix:** Fallback changed to a neutral `'there'` ("Hi, there.").

### P1-6 — Notifications weren't actionable in-app ✅ FIXED
Tapping a notification only marked it read; it never navigated, even though push-tap handling (in `AppNavigator`) deep-links. 
**Fix:** Added best-effort in-app deep-linking (`AppointmentDetail` / `PaymentHistory` / `ConsultationRoom`) based on the notification's `data.screen` / type, mirroring the push handler.

---

## P2 — Polish / follow-ups (not blocking; documented)

- **Most stack screens lack a visible back affordance** (rely on hardware/gesture back). `AppointmentDetail`, `Payment`, `Wallet`, `NearbyVets` have one; `VetDetail`, `Booking`, `Notifications`, `Subscriptions`, `Confirmation`, `ModalityPicker`, `Blog`, `Chat` do not. Functional on Android, but a consistent header bar would be more polished.
- **Home feed sections have no empty states** — with no pets/vets/appointments the horizontal rails render blank rather than a gentle prompt.
- **Booking date picker only offers today + 2 days**; a wider range or calendar would help.
- **Confirmation back-stack:** hardware-back from Confirmation returns to Booking (Payment was `replace`d). A `reset` to Home/Bookings would be cleaner.
- **`ModalityPicker`** starts a consultation with no pet/vet when the user has none; consider gating or letting the user pick.
- **Login OTP field** writes the same value to both email and phone state — harmless but messy.
- **Booking/consult fees** are computed/displayed client-side with hardcoded fallbacks (₹549 / ₹200, online = fee − 150); backend recomputes the authoritative amount, but the displayed estimate can differ.
- **Splash** uses a remote Unsplash image as the backdrop (offline → solid orange, acceptable).

---

## Backend gaps surfaced (require server changes — out of app scope)

These come from the QA audit set under `QA_REVIEW_2026_05_30/` and remain true:
- **Vet lat/lng not in API payload** — `VetController::formatVet()` omits `latitude`/`longitude`; needed for Nearby-Vets pins, haversine distance, and Vet-Detail directions. (Geo *search* params already work.)
- **Reschedule appointment** — no endpoint exists.
- **Favorites/saved vets** — no endpoint/model.
- **Vet text search (`q`), pagination, `consultation_types[]`, `online_fee` in list** — unimplemented (Search filters degrade).
- **Refunds** — cancel/disconnect refunds are manual per current copy; auto-refund is not wired server-side.
- **PII leak (HIGH):** public vet endpoints expose phone/email/license (`VR-01`).

---

## What the user must provide / verify on a real device

- **Google Maps Android API key** — set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env` (manifest currently injects the `YOUR_GOOGLE_MAPS_API_KEY` placeholder; maps render grey tiles until set).
- **Agora App ID** — set `EXPO_PUBLIC_AGORA_APP_ID` for video/audio calls (without it the room now degrades to the chat fallback instead of hanging).
- **Razorpay key** — live payments need the backend to return `razorpay_key`/`razorpay_order_id` (test mode via `EXPO_PUBLIC_PAYMENTS_MOCK=true`).
- **Device-only verification:** real GPS/permission prompts (location, camera, mic), the Agora video call end-to-end (join, mute, camera toggle, flip, reconnect/failed states), push notification delivery + tap deep-linking, and maps marker/callout rendering with a real key.

---

## Verification performed
- `npm run typecheck` (`tsc --noEmit`) — **clean** after all changes.
- `npx expo prebuild -p android` — **succeeds**; verified generated `AndroidManifest.xml` contains location permissions, the Google Maps key meta-data, and notification-icon drawables, and that launcher/adaptive icons were generated from the new assets.
- Static review of all screens/flows listed in the task (auth, home, search/nearby map, vet detail/map, booking→payment→confirmation, consultation video/audio/chat room + RTC hook, pets CRUD, appointments, profile, notifications, subscriptions, wallet/payments).
