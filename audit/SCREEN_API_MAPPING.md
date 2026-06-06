# Screen → API Mapping — Pet Help (User App)

Source: `pet-help-backend/docs/USER_APP_SCREENS.md`, `pet-help-backend/docs/API.md`.

Conventions
- Base prefix: `/api/v1`
- Auth: `Authorization: Bearer {token}` for protected endpoints
- Envelope: `{ success, message, data, errors }`
- Pagination: `?per_page=15` (responses include `pagination`)

SUMMARY
- This matrix maps each user-facing screen to the APIs it consumes, expected request payloads, minimal response shape used by the frontend, auth requirements, important validation rules, and common error handling the frontend must implement.

---

## 0. Common / App-level

- GET `/api/v1/auth/me`
  - Auth: required
  - Purpose: check token validity, fetch current user profile & roles
  - Frontend use: direct routing (Splash → Home or Login)
  - Response `data`: `{ id, name, email, role, avatar, email_verified_at, profile, ... }`
  - Errors: 401 → clear token & route to Login

- POST `/api/v1/auth/device-token`
  - Auth: required
  - Body: `{ token, platform? }`
  - Use: register FCM/Expo push token

- Error envelope handling
  - 422 → `errors` object keyed by field; show inline validation messages
  - 401 → auth failure, prompt re-login
  - 429 / 503 → surface friendly retry message + exponential backoff

---

## 1. Splash

Primary calls:
- GET `/api/v1/auth/me` (see above)

Frontend behaviour:
- If 200 → store user, route to `Home`
- If 401 / network error → route to `Login`
- Show a minimum 1.2s splash delay; show retry if network fetch fails

---

## 2. Login / Signup / OTP

Login flow:
- POST `/api/v1/auth/login`
  - Auth: public
  - Body: `{ email, password }` (or identifier+password if phone allowed)
  - Response `data`: `{ user: {...}, token: "..." }`
  - On success: save token to SecureStore, call `GET /auth/me`
  - Errors: 422 show inline field errors; 403/409 show message

Signup:
- POST `/api/v1/auth/register`
  - Body: `{ name, email, password, password_confirmation, phone? }`
  - Response: `{ user, token }`
  - On success: save token, show email verification banner

OTP send/verify (passwordless or 2FA):
- POST `/api/v1/auth/otp/send`
  - Body: `{ identifier, channel? }`
  - Response: `{ success: true }` (may include TTL)
  - Throttle: 3/min; frontend must disable resend for 60s
- POST `/api/v1/auth/otp/verify`
  - Body: `{ identifier, code, channel? }`
  - Response: `{ success: true }` → note: server currently does NOT issue token on verify (docs), but future behavior may return a token
  - Frontend: if token returned, save and route; if not, treat verified identity as part of multi-step flow

Forgot password:
- POST `/api/v1/auth/forgot-password` → shows success message (email sent)

Edge handling:
- Map `errors` to input fields; block submit while requests in-flight

---

## 3. Home

APIs consumed on mount:
- GET `/api/v1/vets?lat={lat}&lng={lng}&limit=10` (public)
  - Use for "Nearby Vets" cards
  - Response `data.items[]`: vet objects with `{ uuid, vet_name, clinic_name, profile_photo, avg_rating, distance_km, is_emergency_available, is_24_hours, specializations[] }`
- GET `/api/v1/pets` (auth)
  - Response `data.items[]`: `{ uuid, id, name, species, photo_url }`
- GET `/api/v1/ad-banners?position=home_top` (public)
  - Response `data.items[]`: `{ id, image, title, target_url }`
- GET `/api/v1/blog/posts?per_page=3` (public)
  - Response `data.items[]`: posts
- GET `/api/v1/notifications/unread-count` (auth)
  - Response `data`: `{ unread_count: N }`

Frontend notes:
- Graceful degrade if location not available; show city search or generic feed
- Cache pets locally for immediate UI
- Show skeletons while loading; handle partial failures (e.g., banners fail but vets succeed)

---

## 4. Search Vets

Primary API:
- GET `/api/v1/vets` with query params: `lat, lng, radius_km, available_only, emergency_only, city, specialization, languages[], min_rating, sort_by, limit, per_page`
  - Response: `{ items: [...], pagination: {...} }` or three buckets depending on server side (nearby_vets/city_vets/all_vets)

Frontend responsibilities:
- Debounce search input (≈400ms)
- Map filters into query params; preserve UI state
- Handle empty results → show CTA to widen filters
- Map server-provided `working_hours` to "Open now" badge
- For map view: call same API and plot `latitude`/`longitude`

---

## 5. Vet Detail

APIs:
- GET `/api/v1/vets/{uuid}` (public)
  - Response `data.vet`: full profile fields including `services`, `working_hours`, `fees`, `address`, `latitude`, `longitude`
- GET `/api/v1/reviews/vet/{uuid}` (public)
  - Response `data.items[]`: reviews

Actions mapping:
- Book Visit → Booking flow (see Booking Slot)
- Call → `tel:` (no API)
- Directions → open device map

Edge cases:
- 404 → show "Vet not found" view with navigation back
- Network failure → provide retry

---

## 6. Booking Slot

APIs:
- GET `/api/v1/pets` (auth) — pet selector
- GET `/api/v1/appointments/slots/{vet_uuid}?date=YYYY-MM-DD` (auth/public) — returns available slots for date
  - Response `data.slots[]`: `{ start_at, end_at, available: boolean, capacity? }`
- POST `/api/v1/appointments` (auth)
  - Body example:
    ```json
    {
      "vet_uuid": "...",
      "pet_id": 1,
      "appointment_type": "clinic_visit",
      "scheduled_at": "2026-05-10T14:00:00+05:30",
      "reason": "Annual checkup"
    }
    ```
  - Response: `data.appointment` with `uuid`, `status` (requested)
- POST `/api/v1/payments/create-order` (auth)
  - Body: `{ payable_type: "appointment", payable_uuid, payment_model }`
  - Response: `{ payment, payment_uuid, razorpay_key }` (or `_mock: true` in mock mode)

Client-side validation:
- Pet must be selected; slot must be in future; enforce timezone normalization
- Handle 422 with field errors (pet_id, scheduled_at)

Booking concurrency:
- Backend rejects overlapping or already-booked slots (422 / 409) — frontend should surface appropriate error and refresh slots

---

## 7. Payment

APIs and flow:
1. POST `/api/v1/payments/create-order` → returns `payment_uuid` + `razorpay_key` + `order_id` data
2. Client opens Razorpay SDK/checkout using server-provided `order_id`/`key`
3. On SDK success, POST `/api/v1/payments/verify` (auth)
   - Body: `{ payment_uuid, razorpay_payment_id, razorpay_order_id, razorpay_signature }`
   - Verification performs HMAC check + gateway fetch. On success returns `data.payment` with `status: paid`.

Failure handling:
- If verify fails (422 / 400) → show failure UI with support link and retry/cancel options
- If webhook arrives after client navigates away, server state still consistent via idempotent webhook handling

---

## 8. My Appointments (List + Detail)

APIs:
- GET `/api/v1/appointments?per_page=20` (auth)
  - Response `data.items[]` with appointment summary
- GET `/api/v1/appointments/{uuid}` (auth)
  - Response `data.appointment` full detail
- POST `/api/v1/appointments/{uuid}/reschedule` (auth)
  - Body: `{ new_scheduled_at }` → returns updated appointment
- PATCH `/api/v1/appointments/{uuid}/cancel` (auth)
  - Returns 200 with updated status

Client rules:
- Only allow reschedule/cancel within business rules (based on appointment times returned by server)
- For online appointments, join allowed only within window (±5 minutes) — validate both client time and server `scheduled_at`

---

## 9. Consultation Room (Instant & Scheduled)

APIs:
- POST `/api/v1/consultations` (auth)
  - Body: `{ modality, pet_uuid?, issue_category?, issue_description?, fee_amount?, payment_uuid? }`
  - Response: `data.session` with `uuid`, `status`, `available_vets[]`
- POST `/api/v1/consultations/{uuid}/accept` (vet)
- POST `/api/v1/consultations/{uuid}/join` (auth)
  - Response: `{ room_provider: "webrtc", room_id, token, role }` used by the client to connect to WebRTC + signaling
- GET / POST `/api/v1/consultations/{uuid}/messages` (chat history + send)

Realtime signalling:
- Firebase path `/signaling/{room_id}` used for SDP/ICE exchange (client must be configured with Firebase credentials and fallback handling)

Edge handling:
- Connection failures → POST `/api/v1/consultations/{uuid}/connection-failure`
- Auto-refunds & watchdog events handled server-side; frontend must show final resolved status and any refund messages

---

## 10. Pets (CRUD + Subresources)

APIs:
- GET `/api/v1/pets` (auth)
- POST `/api/v1/pets` (auth) — body includes multipart if `photo` provided
- GET `/api/v1/pets/{pet}`
- PUT/PATCH `/api/v1/pets/{pet}`
- DELETE `/api/v1/pets/{pet}`

Subresources:
- Documents: GET/POST `/api/v1/pets/{pet}/documents` (multipart), download via signed URL `GET /pets/{pet}/documents/{document}/download`
- Medical records: GET/POST `/api/v1/pets/{pet}/medical-records`
- Reminders, medications endpoints as per docs

Client notes:
- Use multipart upload for files; show progress UI
- Downloads use signed URLs; use `fetch` or open in browser

---

## 11. SOS Flow

APIs:
- POST `/api/v1/sos` (auth) — Body: `{ latitude, longitude, pet_id?, notes?, urgency? }`
  - Returns `data.sos_request` with `uuid`, `status`, assigned vets maybe null
- GET `/api/v1/sos/active` (auth)
- PUT `/api/v1/sos/{uuid}/location` (assigned vet only)

Client expectations:
- Very fast UX: show immediate success animation and polling or push-based updates for assignment
- Do not block on long-running server tasks — server fans out notifications via background jobs

---

## 12. Notifications

APIs:
- GET `/api/v1/notifications` (auth)
- GET `/api/v1/notifications/unread-count` (auth)
- PUT `/api/v1/notifications/read-all` (auth)
- PUT `/api/v1/notifications/{id}/read` (auth)

Client notes:
- Subscribe to push via `POST /auth/device-token`
- Polling optional; prefer push + local badge updates

---

## 13. Content & Blog

APIs:
- GET `/api/v1/blog/posts` (public) — pagination supported
- GET `/api/v1/blog/posts/{uuid}` (public)
- GET `/api/v1/guides` (public)

Client notes:
- Prefetch top articles for Home; handle 404 on post detail

---

## 14. Profile / Settings

APIs:
- PUT `/api/v1/auth/profile` (auth) — update basic fields
- PUT `/api/v1/auth/change-password` (auth)
- DELETE `/api/v1/auth/account` (auth)

Client notes:
- After password change, server revokes other tokens — prompt re-login if current token revoked

---

## Recommendations for Frontend Validation & Error Mapping

- Centralize API client wrapper to unwrap response envelope and return `data` or standardized error objects.
- Map 422 `errors` to form fields consistently. Provide fallback to `message` for global errors.
- Implement retry logic for idempotent GETs; exponential backoff for 429/503.
- For payments and consults, provide robust UX for partial states: `created` orders, pending verifications, and webhook-driven eventual consistency.

---

## Next steps
- Verify the frontend `App.tsx` and `src/` screens consume the above endpoints and shapes; create tests/mocks for each API contract.
- Produce `audit/SCREEN_FLOW.md` with navigation map and conditional routing.

Generated by audit automation — review and tell me any additional fields or screens to expand. 
