# Frontend Code Review — Pet Help (User App)

Location: `pet-help-user-app/App.tsx` (+ `src/data/mock.ts`, `src/theme.ts`)

Date: 2026-05-31

Summary
- The app is a functional prototype implemented in a single `App.tsx` file using Expo + React Navigation.
- Screens implemented: Splash, Auth (login/signup/OTP UI), Home, Search, Pets, Appointments, Profile, Vet Detail, Booking, Payment.
- The UI uses mock data from `src/data/mock.ts` and theme tokens from `src/theme.ts`.

Implemented vs. Required (high-level)
- Implemented screens map to the audit inventory's major screens, but most are populated with static/mock data and local UI logic (no real API integration).
- Key missing integrations: authentication flows (token storage, `POST /auth/login`), `GET /auth/me`, pets API, vets API, appointments API, payments verification, SOS, consultations, notifications (device token), real file upload/download, and server-driven error/validation handling.

Detailed Findings

1) Structure & Code Quality
- Single-file prototype: `App.tsx` contains navigation, all screens, UI primitives, styles; this works for prototyping but will hinder maintainability.
- Recommendation: split into `src/screens/*`, `src/components/*`, `src/services/api.ts`, and `src/hooks/*`.
- TypeScript usage is partial (some types in `mock.ts`), but `App.tsx` is .tsx and lacks typed props for many components; add screen prop types and central `RootStackParamList` reuse.

2) Data Layer & API Integration
- Current state: entirely mock-driven (`src/data/mock.ts`). No network layer present.
- Recommendation: implement a central API client (`src/services/api.ts`) that:
  - unwraps the `{ success, message, data, errors }` envelope
  - handles auth header injection (SecureStore + in-memory cache)
  - maps 422 to field errors, 401 to sign-out, and throttling to retry/backoff
  - exposes typed endpoints: `auth.login`, `auth.me`, `vets.list`, `appointments.create`, `payments.createOrder`, etc.
- Start with `GET /api/v1/auth/me` on `Splash` and `POST /api/v1/auth/login` in `Auth`.

3) Navigation & Flows
- Navigation skeleton exists (stack + bottom tabs). Deep flows (e.g., post-booking redirect after payment, consult join windows) are not implemented.
- Recommendation: add guarded routes for authenticated screens, and a central `AuthProvider` that exposes `isAuthenticated` + `user` + `signIn`/`signOut`.

4) Forms, Validation & Error Handling
- UI inputs exist but have no validation/feedback except navigation replacements.
- Recommendation: use `react-hook-form` + a validation schema (Yup/Zod) and surface `errors` from backend 1:1.

5) Payments & Consultations
- Payment screen is a placeholder; no Razorpay integration or server verification.
- Consultation / WebRTC features are not present.
- Recommendation: implement payments flow only after `payments/create-order` + `payments/verify` contract is stable. For consultations, integrate the `POST /consultations/{uuid}/join` join token flow and Firebase signaling.

6) SOS, Notifications, Push
- No SOS UI beyond an SOS quick-action placeholder.
- No device-token registration or FCM/Expo Push integration.
- Recommendation: urgent — add `POST /auth/device-token` after login, implement SOS UI and fan-out UX (immediate success + push updates). Verify background/foreground push behavior on iOS and Android.

7) Accessibility & Responsiveness
- Visual tokens present; contrast and hit targets should be validated across devices.
- Recommendation: add accessibility labels to interactive elements, ensure dynamic font scaling, and verify layout on multiple device sizes.

8) Performance
- Static lists are fine for prototype; networked lists will need pagination and lazy-loading.
- Recommendation: add `FlatList` pagination (already used in Home for vets), caching strategy for images and API responses, and consider code-splitting screen modules if bundle grows.

9) Testing
- No tests present.
- Recommendation: add unit tests for `api` client, basic smoke tests for screen rendering using `@testing-library/react-native`, and e2e tests with Detox or Playwright Mobile once flows are wired.

Priority Action Plan (next steps)
1. Implement API client and auth provider (high) — wire `Splash` and `Auth` to `POST /auth/login` and `GET /auth/me`.
2. Break `App.tsx` into `src/screens/*` and `src/components/*` (medium) — keeps PRs manageable.
3. Wire `Home` to `GET /vets`, `GET /pets`, `GET /ad-banners` (high) and implement error handling.
4. Implement booking flow end-to-end: slots (`GET /appointments/slots/{vet_uuid}`), `POST /appointments`, `POST /payments/create-order`, Razorpay + `POST /payments/verify` (high).
5. Add SOS and consultations (medium-high) after payments are stable.
6. Add push/device token registration and notifications (high for SOS reliability).

Files referenced
- `pet-help-user-app/App.tsx` (main prototype)
- `pet-help-user-app/src/data/mock.ts` (mock dataset)
- `pet-help-user-app/src/theme.ts` (tokens)
- `pet-help-user-app/audit/SCREEN_API_MAPPING.md` (mapping produced earlier)

Acceptance criteria for frontend readiness
- All screens read real data from the backend and handle 200/4xx/5xx properly.
- Auth token lifecycle (store, refresh if applicable, sign-out on 401) implemented.
- Payments and consultations wired and verified against backend contracts.
- SOS works with push notifications and real-time assignment updates.
- Unit and e2e tests cover critical booking/payment/consult paths.

Next recommendation
- I can now produce the navigation map (`audit/SCREEN_FLOW.md`) or start the backend code review to validate API readiness and contracts. Which should I do next?
