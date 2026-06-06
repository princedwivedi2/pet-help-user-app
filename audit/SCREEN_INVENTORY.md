# Screen Inventory — Pet Help (User App)

Source: `pet-help-backend/docs/USER_APP_SCREENS.md` and `pet-help-backend/API.md`

Summary of primary screens, purpose, main UI sections, and primary APIs consumed.

1. Splash
- Purpose: Boot, check auth and app config, route user.
- Key logic: Read stored token, call `GET /api/v1/auth/me`.

2. Login / Signup (including OTP flow)
- Purpose: Authenticate / onboard users.
- APIs: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/otp/send`, `POST /api/v1/auth/otp/verify`, `POST /api/v1/auth/forgot-password`.

3. Home
- Purpose: Landing hub with quick actions, nearby vets, pets, banners.
- Sections: Header, Search, Quick Actions, Banners, Nearby Vets, My Pets, Articles, Bottom Tabs.
- APIs: `GET /vets`, `GET /pets`, `GET /ad-banners`, `GET /blog/posts`, `GET /notifications/unread-count`.

4. Search Vets
- Purpose: Discovery with search and filters (distance, specialization, languages, rating).
- APIs: `GET /api/v1/vets` (with filter query params).

5. Vet Detail
- Purpose: Full profile, reviews, hours, actions (book, call, directions).
- APIs: `GET /api/v1/vets/{uuid}`, `GET /api/v1/reviews/vet/{uuid}`.

6. Booking Slot
- Purpose: Select pet, appointment type, date/time, slot, confirm booking.
- APIs: `GET /pets`, `GET /appointments/slots/{vet_uuid}`, `POST /appointments`, `POST /payments/create-order`.

7. Payment
- Purpose: Show order, run Razorpay checkout, verify payment.
- APIs: `POST /payments/create-order`, `POST /payments/verify`.

8. My Appointments (list + detail)
- Purpose: Manage upcoming/past appointments, reschedule, cancel, join consult.
- APIs: `GET /appointments`, `GET /appointments/{uuid}`, `POST /appointments/{uuid}/reschedule`, `PATCH /appointments/{uuid}/cancel`.

9. Consultation Room (video/audio/chat)
- Purpose: Real-time consults, WebRTC signaling, chat messages.
- APIs: `POST /consultations`, `POST /consultations/{uuid}/join`, `POST /consultations/{uuid}/messages`.

10. Pets (CRUD + sub-resources)
- Purpose: Manage pet profiles, documents, reminders, medications, medical records.
- APIs: `GET|POST|PUT|DELETE /pets`, `GET /pets/{pet}/documents`, `POST /pets/{pet}/documents` etc.

11. SOS Flow
- Purpose: Emergency dispatch to nearby vets.
- APIs: `POST /sos`, `GET /sos/active`, `PUT /sos/{uuid}/location`.

12. Notifications
- Purpose: Inbox of app notifications and unread counts.
- APIs: `GET /notifications`, `GET /notifications/unread-count`, `PUT /notifications/read-all`.

13. Content & Blog
- Purpose: Guides, blog posts, categories, article detail.
- APIs: `GET /blog/posts`, `GET /blog/posts/{uuid}`, `GET /guides`.

14. Profile / Settings
- Purpose: Edit profile, device token, change password, account deletion.
- APIs: `PUT /auth/profile`, `POST /auth/device-token`, `PUT /auth/change-password`, `DELETE /auth/account`.

Notes / Next actions:
- Create a navigation map (entry + tab flows + conditional routing). Recommended file: `audit/SCREEN_FLOW.md`.
- Create a Screen → API matrix file: `audit/SCREEN_API_MAPPING.md`.
- Begin frontend code review to match implemented screens in `App.tsx` and `src/` files.

Generated: automated inventory pass (first draft). Review & confirm additions or missing screens to include (e.g., payment receipts, admin-only views).