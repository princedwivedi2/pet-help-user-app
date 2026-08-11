# Respaw Full-App HTML Prototype — Master Product Design Task List

> Purpose: define every screen before building the remaining HTML prototype  
> Product: Respaw pet-owner app  
> Design source: `DESIGN.md` and the approved Home HTML direction  
> Brand: Respaw Purple `#51237B`, Respaw Cream `#FFF7F0`  
> Status: full 57-route HTML prototype implemented in `design-prototype/`; detailed visual review and iteration remain

---

## 1. Prototype objective

Create a polished, interactive HTML prototype of the complete Respaw user experience. It must be attractive enough for product/design review while remaining clear enough to guide the later React Native redesign.

The prototype must:

- Represent the real product, not a collection of unrelated mockups.
- Use one shared design system across every page.
- Keep the pet, appointment, care, and payment context consistent between pages.
- Allow reviewers to complete major flows through working interactions.
- Include realistic loading, empty, error, offline, permission, success, and destructive states.
- Work at mobile widths first, then adapt cleanly to tablet and desktop review widths.
- Preserve current product behavior where it exists and label proposed/future functionality honestly.

### Design character

- Warm and reassuring, not childish.
- Premium but not decorative.
- Friendly for everyday care and precise for medical/payment information.
- Calm under normal use and unmistakably urgent during emergencies.
- Rounded shapes inspired by the supplied logo, with structured layouts for records and receipts.

---

## 2. Prototype architecture

### Recommended deliverable structure

Build one reviewable prototype application rather than dozens of disconnected files:

```text
design-prototype/
├── index.html
├── styles/
│   ├── tokens.css
│   ├── components.css
│   ├── screens.css
│   └── responsive.css
├── scripts/
│   ├── app.js
│   ├── router.js
│   ├── state.js
│   └── interactions.js
└── assets/
    ├── brand/
    ├── pets/
    ├── vets/
    ├── articles/
    └── illustrations/
```

`index.html` will behave like a mobile app using hash routes such as `#/home`, `#/find-care`, and `#/appointments/respaw-2407`. This gives the user one file to open while still providing separate, linkable pages.

### Shared prototype data

Use one consistent fictional account throughout the prototype:

- User: Priya Sharma
- Primary pet: Bruno, Golden Retriever, 3 years
- Secondary pet: Luna, Indie Cat, 2 years
- Upcoming vet: Dr. Ananya Rao
- Nearby vets: Dr. Meera Iyer and Dr. Arjun Nair
- Upcoming video consultation: today at 4:30 PM
- Current care task: Bravecto Chewable
- Example payment reference: `RESPAW-24072026`

All pages must read and update this shared state so interactions feel continuous.

---

## 3. Global design-system tasks

### DS-01 — Brand assets

- [ ] Prepare the supplied wordmark for purple-on-cream and cream-on-purple use.
- [ ] Create a compact paw/cross app mark derived from an approved source asset.
- [ ] Define avatar fallbacks for pets, vets, and users.
- [ ] Never recreate the custom wordmark using ordinary text.

**Acceptance:** logo remains sharp, correctly proportioned, and readable on splash/auth surfaces.

### DS-02 — Color and surface tokens

- [ ] Implement the approved semantic palette from `DESIGN.md`.
- [ ] Use `#FFFBF8` as the default canvas, white for purposeful cards, and lavender for selected/featured areas.
- [ ] Reserve teal for healthy/completed, amber for pending, and red for emergencies/errors/destructive actions.
- [ ] Add hover, pressed, focused, disabled, and selected token variants.

**Acceptance:** no page introduces unapproved random colors or returns to the old orange/blue theme.

### DS-03 — Typography

- [ ] Use Nunito Sans for headings and Inter for body/interface copy.
- [ ] Implement display, screen-title, section-title, card-title, body, metadata, label, and numeric styles.
- [ ] Add safe system-font fallbacks.
- [ ] Ensure long names, prices, dates, and status text do not clip.

**Acceptance:** interface remains readable at 200% browser zoom and narrow widths.

### DS-04 — Layout, safe areas, and responsiveness

- [ ] Create a mobile app canvas for 320, 360, 390, and 430 px widths.
- [ ] Center the app at desktop review widths without stretching content unnaturally.
- [ ] Support tablet layouts with maximum readable widths and selected two-column views.
- [ ] Keep sticky actions above bottom navigation and safe areas.
- [ ] Prevent keyboard/modal simulations from hiding primary actions.

### DS-05 — Navigation shell

- [ ] Implement five-tab navigation: Home, Find care, Appointments, Pets, Profile.
- [ ] Build contextual top bars with back, title, and optional right-side action.
- [ ] Hide bottom navigation during booking, payment, consultation, and editing flows.
- [ ] Keep active, hover, keyboard-focus, and notification-badge states.
- [ ] Make browser back/forward operate predictably with hash routing.

### DS-06 — Core controls

- [ ] Primary, secondary, tertiary, destructive, and emergency buttons.
- [ ] Text field, search field, password field, text area, select, date picker mock, and OTP input.
- [ ] Chips, status badges, segmented controls, switches, checkboxes, and radio cards.
- [ ] Icon button, avatar, card, list row, divider, price row, and timeline item.
- [ ] Bottom sheet, dialog, toast, tooltip, and sticky action bar.
- [ ] Use consistent inline SVG icons; no emoji interface icons.

### DS-07 — Shared product components

- [ ] Pet switcher and pet summary card.
- [ ] Vet result card and compact vet identity header.
- [ ] Appointment card, appointment timeline, and join-now state.
- [ ] Medical record, medication, reminder, prescription, and document rows.
- [ ] Transaction row and receipt summary.
- [ ] Article card and author/source block.

### DS-08 — System states

- [ ] Skeleton loaders matching final card/list shapes.
- [ ] Empty state with specific copy and recovery action.
- [ ] Inline section error and full-screen blocking error.
- [ ] Offline banner and unsent-action state.
- [ ] Permission education and denied-permission recovery.
- [ ] Success state, destructive confirmation, and retry state.

### DS-09 — Accessibility

- [ ] Semantic landmarks, headings, buttons, dialogs, and form labels.
- [ ] Visible keyboard focus and logical focus movement.
- [ ] Minimum 44 × 44 px targets.
- [ ] Status conveyed through label/icon as well as color.
- [ ] Dialog focus trapping and Escape dismissal.
- [ ] `aria-live` updates for errors, toast messages, payment, and consultation state.
- [ ] Reduced-motion support.

### DS-10 — Motion and feedback

- [ ] Restrained button press and selected-state motion.
- [ ] Native-feeling page/sheet transitions.
- [ ] One-time booking/payment success animation.
- [ ] Consultation connection/reconnection feedback.
- [ ] No infinite decorative animation or exaggerated bounce.

---

## 4. Entry and authentication pages

### PAGE-01 — Splash

**Current product:** existing route.

**How it looks**

- Full Respaw Purple surface.
- Supplied cream wordmark centered with generous clear space.
- Optional small “Care for every paw” line.
- Minimal, calm, and free from forms or unrelated messaging.

**Functionality**

- Simulate session restoration.
- Route authenticated users to Home and signed-out users to Sign in.
- Show a subtle loading indicator only after a short delay.
- Provide a clickable prototype control to preview both outcomes.

**Required states**

- Restoring session.
- Authenticated redirect.
- Signed-out redirect.
- Startup error with retry.

### PAGE-02 — Welcome / authentication entry

**Current product:** existing login screen combines multiple methods; prototype improves progressive disclosure.

**How it looks**

- Cream canvas with purple logo, welcoming title, and calm pet-care image/illustration.
- One clear default sign-in method.
- Secondary actions for OTP and account creation.

**Functionality**

- Choose Email/Password, Phone OTP, or Create account.
- Validate the first identifier before revealing the next step.
- Link to Terms and Privacy.
- Development-only link to Server Settings.

**Required states**

- Default.
- Identifier validation error.
- Loading.
- Server unavailable.

### PAGE-03 — Email/password sign in

**How it looks**

- Focused form with persistent labels and one primary CTA.
- Password visibility control and low-emphasis recovery link.

**Functionality**

- Validate email and password.
- Toggle password visibility.
- Remember identifier for the prototype session.
- Successful sign-in routes to Home.
- Failed sign-in keeps the entered email and shows actionable feedback.

### PAGE-04 — Phone OTP

**How it looks**

- Phone-number step followed by six clear OTP cells.
- Visible resend timer and change-number link.

**Functionality**

- Phone-country code selector.
- Paste/autofill simulation.
- Resend timer.
- Invalid/expired OTP handling.
- Successful verification routes to Home or account setup.

### PAGE-05 — Create account

**How it looks**

- Short, staged form rather than one long card.
- Progress indicator for Account → Contact → Consent.

**Functionality**

- Name, email/phone, password, confirmation, and consent.
- Inline strength/validation guidance.
- Verification outcome page.
- Preserve values when moving backward.

### PAGE-06 — Forgot/reset password

**How it looks**

- Single-purpose screen with recovery identifier.
- Clear sent-link/OTP confirmation state.

**Functionality**

- Request reset.
- Enter code if applicable.
- Set and confirm new password.
- Route back to sign in after success.

---

## 5. Home and notification pages

### PAGE-07 — Home

**Current prototype:** `respaw-home-preview.html`; migrate into the shared app shell.

**How it looks**

- Greeting and selected-pet context.
- Next appointment as the dominant panel.
- Four care shortcuts.
- Care-today list, nearby vets, pet rail, and trusted articles.
- Bottom navigation with Home active.

**Functionality**

- Switch pet context.
- Open appointment detail.
- Mark a care task complete and undo.
- Open Find care, Online consult, Records, or Emergency.
- Open notifications, vet profile, pet profile, or article.
- Show email-verification and offline banners when relevant.

**Required states**

- Next appointment available.
- Join-now appointment.
- No appointments.
- No pets.
- Partially failed feeds.
- Loading skeleton.
- Offline cached home.

### PAGE-08 — Notifications

**Current product:** existing route.

**How it looks**

- Grouped by Today, Earlier, Older.
- Soft-purple unread rows and neutral read rows.
- Category icon, title, description, time, and unread dot.

**Functionality**

- Open appointment, payment, reminder, consultation, or system destination.
- Mark one notification read.
- Mark all read.
- Filter All/Unread.
- Simulate deep-link navigation.

**Required states**

- Mixed notifications.
- All read.
- Empty “You're all caught up.”
- Load more.
- Error/retry.

---

## 6. Find-care pages

### PAGE-09 — Find care / vet search

**Current product:** existing Search route.

**How it looks**

- Screen title, location-aware search field, quick filter chips, result count, sort control, and list/map segmented control.
- Image-led but compact vet rows.

**Functionality**

- Debounced search simulation.
- Filter by availability, online, emergency, home visit, specialty, language, distance, rating, and fee.
- Sort by relevance, distance, rating, availability, or price.
- Clear filters.
- Open vet detail.
- Switch list/map.

**Required states**

- Search results.
- No query/nearby recommendations.
- No matching vets.
- Location unavailable.
- Filter active.
- Loading/error/offline.

### PAGE-10 — Search filters sheet

**How it looks**

- Full-height bottom sheet with grouped, understandable filters.
- Sticky “Show 18 vets” action and visible Reset.

**Functionality**

- Multi-select specialties and languages.
- Distance range.
- Rating minimum.
- Available-now, emergency, home-visit, and online toggles.
- Apply, reset, close, and preserve selections.

### PAGE-11 — Nearby vets map

**Current product:** existing NearbyVets route.

**How it looks**

- Full-bleed map, floating search/list controls, purple pins, and snap-card carousel.
- Selected vet card remains visible without hiding the map.

**Functionality**

- Select pin and synchronize the bottom card.
- Swipe vet cards and update selected pin.
- “Search this area.”
- Center on user location.
- Return to list.
- Open vet detail.

**Required states**

- Location available.
- Location denied with manual city fallback.
- Map unavailable with list fallback.
- No vets in area.

### PAGE-12 — Vet profile

**Current product:** existing VetDetail route.

**How it looks**

- Vet identity header with real photo, verified indicator, credentials, clinic, rating, and reviews.
- Trust strip for experience, languages, and availability.
- Open sections for About, Services, Fees, Availability, Clinic, and Reviews.
- Sticky Consult online / Book appointment actions.

**Functionality**

- Read full profile and working hours.
- Expand services and qualifications.
- Open review details.
- Call clinic and get directions simulations.
- Select online consultation or booking.
- Save/favourite is shown only if functionality is approved; otherwise omit it.

**Required states**

- Complete profile.
- Missing photo.
- Missing fees/location.
- Closed/open now.
- No reviews.
- Profile unavailable.

### PAGE-13 — Reviews and rating details

**How it looks**

- Overall rating, distribution bars, filter/sort controls, and readable review list.
- Vet replies are visually nested but not over-styled.

**Functionality**

- Filter by star rating.
- Sort recent/helpful.
- Expand long reviews.
- Show review eligibility message.

---

## 7. Booking and payment pages

### PAGE-14 — Booking step 1: Pet and visit type

**Current product:** existing Booking screen; prototype converts it into a guided flow.

**How it looks**

- Compact vet summary and four-step progress indicator.
- Photo-based pet selection.
- Clear clinic, home, and online visit-type cards with fees.

**Functionality**

- Choose pet.
- Add a pet without losing booking progress.
- Choose visit type.
- Show modality choice when online.
- Disable unavailable types with explanation.

### PAGE-15 — Booking step 2: Date and time

**How it looks**

- Seven-day date strip, calendar action, and Morning/Afternoon/Evening slot groups.
- Selected slot uses solid or soft purple with a visible check.

**Functionality**

- Change date.
- Open calendar sheet.
- Choose available slot.
- Explain unavailable/expired slots.
- Refresh availability.

**Required states**

- Slots available.
- No slots on selected date.
- Loading.
- Slot becomes unavailable before confirmation.

### PAGE-16 — Booking step 3: Reason and visit details

**How it looks**

- Optional structured reason chips plus free-text area.
- Relevant pet medical warning or record shortcut without overwhelming the form.

**Functionality**

- Choose a common reason.
- Add notes.
- Attach an existing record simulation if supported.
- Enforce character limit accessibly.

### PAGE-17 — Booking step 4: Review

**How it looks**

- Clean summary grouped by Vet, Pet, Visit, Time, Notes, and Payment.
- Fee and cancellation policy are clearly separated.

**Functionality**

- Edit any earlier section.
- Choose booking token or full payment when supported.
- Accept policy.
- Create booking and continue to payment.
- Prevent double submission.

### PAGE-18 — Payment checkout

**Current product:** existing Payment route.

**How it looks**

- Booking summary, itemized fee, bold total, secure-payment reassurance, and one primary payment action.
- Razorpay methods represented clearly without inventing unavailable methods.

**Functionality**

- Simulate successful, cancelled, failed, and pending Razorpay outcomes.
- Disable duplicate payment attempts during verification.
- Retry failed payment without rebuilding the appointment.
- Open refund/cancellation policy.

**Required states**

- Ready to pay.
- Checkout open.
- Confirming payment.
- Payment failed.
- Verification failed.
- Network lost.

### PAGE-19 — Booking/payment confirmation

**Current product:** existing Confirmation route.

**How it looks**

- Restrained success moment using cream and purple.
- Title names the pet.
- Receipt-style summary and modality-specific next-step instructions.

**Functionality**

- View appointment.
- Add to calendar simulation.
- Download/share confirmation simulation.
- Return Home.

---

## 8. Appointment pages

### PAGE-20 — Appointments list

**Current product:** existing Appointments tab.

**How it looks**

- Upcoming / Past / Cancelled segmented control.
- Next appointment is visually prioritized.
- Remaining appointments use compact, date-grouped rows.

**Functionality**

- Switch segments.
- Open appointment detail.
- Join when eligible.
- Write a review for completed appointments.
- Pull-to-refresh/load-more simulation.

**Required states**

- Multiple statuses.
- Join window active.
- Empty per segment.
- Loading/error/offline.

### PAGE-21 — Appointment detail

**Current product:** existing route.

**How it looks**

- Identity summary plus status timeline.
- Structured Visit, Payment, Notes, and Records sections.
- Contextual sticky action area.

**Functionality**

- Join consultation.
- Reschedule.
- Cancel.
- Open payment detail.
- View/download prescription.
- Write or view review.
- Contact support.

### PAGE-22 — Reschedule appointment sheet

**How it looks**

- Current appointment shown first, then date and slot selection.
- Difference in time/fee is clearly explained.

**Functionality**

- Choose new slot.
- Confirm change.
- Handle slot conflict.
- Preserve original appointment if cancelled.

### PAGE-23 — Cancel appointment dialog/sheet

**How it looks**

- Named consequence, reason selector, optional detail field, and refund explanation.
- Safe action is visually dominant until the user confirms intent.

**Functionality**

- Select reason.
- Show refund estimate/status.
- Confirm cancellation.
- Return to updated appointment detail.

### PAGE-24 — Submit review sheet

**How it looks**

- Vet and appointment context, large accessible star selection, optional title/comment.

**Functionality**

- Choose 1–5 rating.
- Validate before submit.
- Show submitted state and prevent duplicates.

---

## 9. Consultation and assistant pages

### PAGE-25 — Consultation modality picker

**Current product:** existing ModalityPicker route.

**How it looks**

- Three large, understandable choices: Video, Audio, Chat.
- Each shows best use, fee, and availability.
- Emergency safety note is clearly separated.

**Functionality**

- Select modality.
- Show device requirements.
- Continue to vet selection/booking or instant consultation as supported.
- Open emergency care.

### PAGE-26 — Device check

**Product status:** proposed supporting page for a safer consultation flow.

**How it looks**

- Camera preview, microphone meter, speaker check, connection result, and privacy note.

**Functionality**

- Simulate permission allowed/denied.
- Toggle camera/mic.
- Retry device checks.
- Continue only when minimum requirements pass, with chat fallback.

### PAGE-27 — Video/audio consultation room

**Current product:** existing ConsultationRoom route.

**How it looks**

- Dark plum immersive surface.
- Vet media dominates; self-view is secondary.
- Top identity/timer/status bar and stable bottom controls.

**Functionality**

- Toggle microphone, camera, speaker, and chat.
- Switch camera simulation.
- Show connection/reconnection/failure states.
- Fall back to chat.
- End consultation with confirmation.
- Show refund notice only when applicable.

**Required states**

- Connecting.
- Connected.
- Reconnecting.
- Permission denied.
- Session unavailable.
- Connection failed/refund pending.
- Ended by vet/user.

### PAGE-28 — Consultation chat

**How it looks**

- Vet identity and session status in the header.
- Clear message bubbles, timestamps, attachment rows, and safe-area composer.

**Functionality**

- Send text.
- Simulate attachment.
- Retry failed message.
- Receive vet reply.
- End session.
- Maintain scroll position.

### PAGE-29 — Visit summary

**Product status:** documented supporting surface.

**How it looks**

- Consultation outcome, diagnosis, vet notes, prescription, follow-up, and care instructions.
- More structured/clinical than lifestyle pages.

**Functionality**

- Download prescription.
- Add medication/reminder to pet record.
- Book follow-up.
- Rate consultation.

### PAGE-30 — AI Pet Assistant

**Current product:** existing Chat route.

**How it looks**

- Friendly purple assistant identity, prompt suggestions, readable chat bubbles, and persistent safety disclaimer.

**Functionality**

- Start/new session.
- Send message and simulate reply.
- Retry failed message.
- Render emergency escalation card based on sample urgent text.
- Open Find emergency care.
- Keep the assistant clearly non-diagnostic.

---

## 10. Pet and health-record pages

### PAGE-31 — Pets list

**Current product:** existing Pets tab.

**How it looks**

- Primary pet feature card plus compact remaining pet cards.
- Next care item and record shortcut visible.

**Functionality**

- Select primary pet.
- Open records.
- Add pet.
- Open edit pet.
- Keep delete out of the main list surface.

**Required states**

- Multiple pets.
- One pet.
- No pets.
- Missing photos.
- Loading/error.

### PAGE-32 — Add/edit pet

**Current product:** currently contained within Pets screen; prototype gives it a focused page/sheet.

**How it looks**

- Basics, Details, Health notes, and Photo sections.
- Friendly image picker and native-style controls.
- Sticky Save action.

**Functionality**

- Add or change photo.
- Enter name, species, breed, sex, DOB, weight, markings, allergies, and notes.
- Show age preview.
- Validate fields and preserve data.
- Save changes.
- Delete in edit mode through explicit confirmation.

### PAGE-33 — Pet health dashboard

**Current product:** existing PetRecords route; prototype uses a stronger summary entry.

**How it looks**

- Pet identity, key health details, next care task, active medications, and recent timeline.
- Tabs: Timeline, Medical, Medications, Reminders.

**Functionality**

- Switch record category.
- Add record, medication, reminder, or document.
- Open individual record.
- Mark medication taken or reminder complete.
- Download documents/prescriptions.

### PAGE-34 — Medical timeline

**How it looks**

- Vertical chronological timeline with date, type icon, title, vet/source, and summary.

**Functionality**

- Filter by record type/date.
- Expand record.
- Open linked appointment/prescription/document.
- Load older records.

### PAGE-35 — Add/view medical record

**How it looks**

- Structured clinical form/read-only detail with restrained rounding and decoration.

**Functionality**

- Select type.
- Add title/date/notes.
- Attach document simulation.
- Validate and save.
- Edit/delete owner-created record where allowed.

### PAGE-36 — Medications

**How it looks**

- Active medication cards first, then medication history.
- Dose, frequency, timing, instructions, and adherence action are prominent.

**Functionality**

- Add medication.
- Mark dose taken.
- Undo recent mark.
- Edit schedule.
- Discontinue with confirmation.
- View adherence history.

### PAGE-37 — Add/edit medication

**Functionality and fields**

- Name, dosage, unit, frequency, timing, start/end date, route, and instructions.
- Native-style date/time controls.
- Validation with meaningful examples.
- Save, cancel, and discontinue handling.

### PAGE-38 — Reminders

**How it looks**

- Due today, Upcoming, and Completed groups.
- Recurrence and linked pet/record clearly visible.

**Functionality**

- Add/edit reminder.
- Mark complete and undo.
- Snooze.
- Filter by pet/type.

### PAGE-39 — Add/edit reminder

**Functionality and fields**

- Title, type, linked pet, date/time, recurrence, description, and notification preference.
- Validate future scheduling.
- Preview next occurrence.

### PAGE-40 — Prescriptions

**Current product:** existing Prescriptions route.

**How it looks**

- Filter by pet/date.
- Prescription rows clearly identify pet, vet, diagnosis, and date.

**Functionality**

- View details.
- Download PDF simulation.
- Open linked visit.
- Add medication/reminder from prescription.

### PAGE-41 — Documents

**Product status:** documented within records; prototype supplies a complete surface.

**How it looks**

- File-type icon, title, category, date, size, expiry, and source.

**Functionality**

- Upload document simulation.
- Preview supported file.
- Download.
- Rename/reclassify owner document.
- Delete with confirmation.

---

## 11. Payment and subscription pages

### PAGE-42 — Payments & wallet

**Current product:** existing Wallet route.

**How it looks**

- Balance panel only if a real wallet balance exists.
- Monthly transaction groups with purpose, appointment/pet, amount, and status.

**Functionality**

- Filter payment/refund status.
- Search reference.
- Open payment detail.
- Open support for failed refund.

### PAGE-43 — Payment history

**Current product:** existing PaymentHistory route.

**How it looks**

- Dense but readable transaction list; no decorative oversized cards.

**Functionality**

- Filter date/status/type.
- Load more.
- Open detail.
- Download history simulation.

### PAGE-44 — Payment/refund detail

**Current product:** existing PaymentDetail route.

**How it looks**

- Receipt-style summary, clear status, reference copy action, and refund timeline when relevant.

**Functionality**

- Copy reference.
- Download receipt.
- View linked appointment/subscription.
- Track refund status.
- Contact support.

### PAGE-45 — Subscription plans

**Current product:** existing Subscriptions route.

**How it looks**

- Current plan first.
- Vertically stacked plan comparison with one recommended option.
- Benefits, limits, exclusions, and FAQs.

**Functionality**

- Compare plans.
- Expand benefit details/FAQ.
- Select plan and confirm.
- Simulate payment.
- Show active plan after success.
- Manage/cancel state only if backend supports it.

---

## 12. Content pages

### PAGE-46 — Pet care articles

**Current product:** existing Blog route.

**How it looks**

- Featured article, search, category chips, then image-led article list.
- Credible source, updated date, and reading time visible.

**Functionality**

- Search.
- Filter category.
- Open article.
- Load more.
- Preserve selection on back.

### PAGE-47 — Article detail

**Current product:** existing BlogPost route.

**How it looks**

- Strong headline/hero image, credible author/reviewer block, readable article column, related stories.

**Functionality**

- Like/save only if supported.
- Share simulation.
- Expand sources.
- Submit comment only if supported.
- Open related article.

**Required states**

- Complete article.
- Missing image.
- Offline cached article.
- Article unavailable.

---

## 13. Profile, settings, and support pages

### PAGE-48 — Profile and settings

**Current product:** existing Profile tab.

**How it looks**

- Identity card followed by divider-based groups: Care & pets, Payments & plan, Notifications, Security, Help, Legal.
- Sign out is ordinary; Delete account is isolated and red.

**Functionality**

- Open edit profile, password, notification preferences, pets, plans, payments, help, and legal pages.
- Sign out with confirmation.
- Delete account through a stronger confirmation flow.

### PAGE-49 — Edit profile

**How it looks**

- Focused form with avatar/photo action and persistent labels.

**Functionality**

- Edit name, phone, address, city, and location.
- Validate and save.
- Show verified/unverified contact status.
- Request email verification resend.

### PAGE-50 — Change password and security

**How it looks**

- Current/new/confirm fields, requirements, and session/security information.

**Functionality**

- Show/hide passwords.
- Validate strength and match.
- Submit and show success.
- Optional “Sign out other sessions” only if backend supports it.

### PAGE-51 — Notification preferences

**Product status:** richer proposed surface based on existing notification capability.

**How it looks**

- Grouped preferences for appointments, medications/reminders, payments, care content, email, and push.

**Functionality**

- Toggle categories.
- Explain device-level notification state.
- Request permission when enabling push.
- Link to system settings after denial.
- Label UI-only/future preferences until backend persistence exists.

### PAGE-52 — Help and support

**How it looks**

- Searchable FAQ, common issues, contact methods, and current app/service information.

**Functionality**

- Search FAQ.
- Expand answers.
- Open email/call/chat simulations.
- Start a support request with relevant appointment/payment reference.

### PAGE-53 — Legal and about

**How it looks**

- Clean reading layout for About, Terms, Privacy, Refund policy, and medical disclaimer.

**Functionality**

- Switch documents.
- Show effective/updated date.
- Open external policy source when applicable.

### PAGE-54 — Delete account

**How it looks**

- Explicit consequence list and confirmation text entry.
- Safe back action remains easy to find.

**Functionality**

- Explain affected pets, records, appointments, and subscriptions.
- Require confirmation phrase.
- Simulate error and final success/sign-out.

### PAGE-55 — Server settings

**Current product:** existing internal route.

**How it looks**

- Clearly labeled development/internal tool, visually consistent but separated from consumer settings.

**Functionality**

- Display build default and active override.
- Edit/test/save/reset base URL.
- Show connection result.
- Never expose in the production prototype navigation.

---

## 14. Emergency pages

### PAGE-56 — Emergency care entry

**Product status:** documented, not currently present in the main route file.

**How it looks**

- Calm but unmistakable red-accented emergency surface.
- Clear warning for life-threatening situations.
- Pet selection, location, short notes, and direct-call options.

**Functionality**

- Select pet.
- Use/update location.
- Enter symptoms/notes.
- Call nearby emergency clinic simulation.
- Send SOS only after clear confirmation.
- Provide safe manual alternatives when location is denied.

### PAGE-57 — SOS live tracker

**Product status:** documented planned surface.

**How it looks**

- Live map, prominent status, assigned vet/clinic card, ETA, and activity timeline.

**Functionality**

- Simulate Pending → Assigned → In progress → Completed.
- Show vet movement/ETA update.
- Call/message clinic.
- Cancel only when allowed.
- Handle no assignment, lost connection, and completed care.

---

## 15. Prototype-wide functional flows

### FLOW-01 — First-time user

- [ ] Splash → Create account → Verification → Home empty-pet state → Add pet → Personalized Home.

### FLOW-02 — Find and book a vet

- [ ] Home/Find care → Search/filter → Vet profile → Booking steps → Payment → Confirmation → Appointment detail.

### FLOW-03 — Online consultation

- [ ] Home/Appointment → Modality/device check → Consultation room → Reconnection or chat fallback → Visit summary → Review.

### FLOW-04 — Daily care

- [ ] Home care task → Mark given → Pet medications/history reflects change → Undo path.

### FLOW-05 — Pet medical record

- [ ] Pets → Pet health dashboard → Add medical record/document/medication/reminder → Updated timeline.

### FLOW-06 — Appointment management

- [ ] Appointments → Detail → Reschedule or cancel → Updated status and payment/refund message.

### FLOW-07 — Payment and refund

- [ ] Profile → Payments → Payment detail → Refund timeline → Support with reference context.

### FLOW-08 — Emergency

- [ ] Emergency shortcut → Permission/location handling → Confirm SOS → Live tracker → Completion.

### FLOW-09 — Notification deep links

- [ ] Notification → correct appointment, consultation, payment, reminder, or SOS destination.

---

## 16. Implementation sequence

### Phase A — Prototype foundation

- [ ] DS-01 through DS-10.
- [ ] Hash router and shared prototype state.
- [ ] Shared navigation, dialogs, sheets, feedback, and state switcher.
- [ ] Asset inventory and approved imagery.

### Phase B — Entry and primary shell

- [ ] PAGE-01 through PAGE-08.
- [ ] Migrate the existing Home preview into the shared prototype.
- [ ] Review brand fidelity and primary navigation before continuing.

### Phase C — Discovery, booking, and payment

- [ ] PAGE-09 through PAGE-19.
- [ ] Complete FLOW-02.
- [ ] Review search usability, booking clarity, and payment trust.

### Phase D — Appointments and consultation

- [ ] PAGE-20 through PAGE-30.
- [ ] Complete FLOW-03 and FLOW-06.
- [ ] Test every connection, permission, and appointment status.

### Phase E — Pets and medical records

- [ ] PAGE-31 through PAGE-41.
- [ ] Complete FLOW-04 and FLOW-05.
- [ ] Review long medical content and form usability.

### Phase F — Payments, plans, content, profile

- [ ] PAGE-42 through PAGE-55.
- [ ] Complete FLOW-07 and FLOW-09.

### Phase G — Emergency care

- [ ] PAGE-56 and PAGE-57.
- [ ] Complete FLOW-08.
- [ ] Perform a dedicated high-stress usability review.

### Phase H — Final QA

- [ ] Responsive checks at 320, 360, 390, 430, 768, and desktop widths.
- [ ] Keyboard-only navigation.
- [ ] 200% zoom/text check.
- [ ] Contrast and visible-focus audit.
- [ ] Loading, empty, error, offline, and permission state audit.
- [ ] Long names, missing images, zero results, and large lists.
- [ ] Browser back/forward and direct hash-link tests.
- [ ] Interaction state persists across connected flows.
- [ ] Compare each completed screen against `DESIGN.md` and its approved concept.

---

## 17. Page completion checklist

Every page is complete only when:

- [ ] Its primary purpose is obvious within three seconds.
- [ ] One primary action is visually dominant.
- [ ] Content hierarchy matches the page's real functionality.
- [ ] It uses shared tokens and components.
- [ ] All visible controls work in the prototype.
- [ ] It has realistic data, not lorem ipsum.
- [ ] Loading, empty, error, offline, and permission states are included when relevant.
- [ ] Hover, pressed, selected, focused, disabled, and success states are included.
- [ ] Mobile, tablet, and desktop review layouts work.
- [ ] Keyboard navigation and screen-reader semantics are correct.
- [ ] Destructive actions name the affected object and consequence.
- [ ] Medical and payment content is precise and not hidden by decoration.
- [ ] The page visibly belongs to Respaw.

---

## 18. Scope rules

- Existing app routes and functionality must be redesigned without silently changing their business logic.
- Planned surfaces—SOS, device check, visit summary, documents, and richer settings—must be labeled as proposed until backend/navigation support is verified.
- Saved vets, insurance, pharmacy, social feeds, and other unrelated features must not be invented.
- The HTML prototype may simulate backend results, but it must clearly remain a design prototype.
- The later React Native implementation will be a separate phase after HTML design approval.

---

## Final output target

The final HTML prototype will contain **57 designed page/surface tasks**, **9 connected product flows**, a shared Respaw design system, and interactive states sufficient to review the app as one full product before React Native implementation begins.
