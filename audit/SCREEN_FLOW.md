# Screen Flow & Navigation Map

This document maps the mobile screens, main navigation flows, and primary backend API endpoints they depend on. Intended as a single-source-of-truth for the mobile client architecture.

Core navigation structure
- Root: `Splash` -> decides auth state and routes to `Auth` or `Main`.
- `Auth` (stack): `Login`, `Signup`, `OTP`.
- `Main` (bottom tabs): `Home`, `Search`, `Bookings`, `Pets`, `Profile`.
- Additional stacks: `VetDetail -> Booking -> Payment -> BookingConfirmation`, `ConsultationStack` (Instant + Scheduled), `SosFlow`.

Screens and primary APIs

- Splash
  - Purpose: Check `GET /api/v1/auth/me` and local token; prefetch settings and app config
  - API: `GET /api/v1/auth/me`

- Login (Auth)
  - Purpose: Authenticate user, store token, navigate to `Main`
  - API: `POST /api/v1/auth/login`, `POST /api/v1/auth/verify-otp` (if OTP flow)

- Home (Main Tab)
  - Purpose: Show recommended vets, quick actions (book, sos, consult), recent appointments
  - API: `GET /api/v1/vets`, `GET /api/v1/articles/recent`, `GET /api/v1/appointments?user=`

- Search
  - Purpose: Search vets by specialty/location/filters
  - API: `GET /api/v1/vets?query=...&filters=...`

- Vet Detail -> Booking
  - Purpose: Vet profile, services, available slots, reviews
  - API: `GET /api/v1/vets/{vet_uuid}`, `GET /api/v1/appointments/slots/{vet_uuid}`, `POST /api/v1/appointments`

- Booking Payment
  - Purpose: Create order, perform payment, verify
  - API: `POST /api/v1/payments/create-order`, `POST /api/v1/payments/verify`

- Appointments (Bookings) Tab
  - Purpose: List upcoming/past appointments, manage reschedule/cancel
  - API: `GET /api/v1/appointments`, `POST /api/v1/appointments/{id}/cancel`, `POST /api/v1/appointments/{id}/reschedule`

- Pets Tab
  - Purpose: List/manage pets, medical records, reminders
  - API: `GET /api/v1/pets`, `POST /api/v1/pets`, `GET /api/v1/pets/{id}/records`

- Profile
  - Purpose: User profile, device tokens, settings, logout
  - API: `GET /api/v1/user`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/registerDeviceToken`

- Instant Consultation / Video
  - Purpose: Start or join instant consults, obtain join token
  - API: `POST /api/v1/consultation/instant`, `POST /api/v1/consultation/{id}/join-token`

- SOS Flow
  - Purpose: Send SOS, follow dispatch status, accept/decline help
  - API: `POST /api/v1/sos`, `GET /api/v1/sos/{id}`

Notes on architecture
- Navigation: use nested stack + tab navigators. Keep `Main` isolated so auth stack and unauthenticated flows remain separate.
- State: keep auth token and critical user state in an `AuthProvider` (context) and persist securely (SecureStore). Use `react-query` or similar for server state caching and background refresh.
- Services: place API client, data adapters, and domain services under `src/services/` (single exported client used across screens).
- Screens: one screen per file under `src/screens/` grouped by domain.
- Components: shared UI at `src/components/` (atomic components, layouts, form fields, buttons).
- Types: centralize API types and DTOs in `src/types/` and `src/services/contracts` (keeps mapping to backend contract explicit).
- Navigation docs: use this file plus `docs/MOBILE_API_CONTRACT.md` (recommended) to lock field names and response shapes.

Next steps
- Generate `docs/MOBILE_API_CONTRACT.md` from backend routes and controllers (recommended immediate next step).
- Implement skeleton navigator and screens in the repo for iterative wiring.
