# Respaw User App — Product Design Specification

> Status: Design direction approved for implementation planning  
> Platform: Expo / React Native (Android and iOS)  
> Product: Respaw pet-owner application  
> Brand source: supplied Respaw wordmark  
> Document version: 1.0 — 20 July 2026

---

## 1. Product vision

Respaw is the calm, trusted place pet parents open when they need to understand what to do next: find a veterinarian, book care, attend a consultation, manage a pet's health history, or respond to an urgent situation.

The experience should feel:

- **Warm, not childish:** affectionate and approachable without reducing medical credibility.
- **Calm, not empty:** generous spacing and clear hierarchy while keeping useful information close.
- **Clinical when it matters:** fees, dates, prescriptions, medical notes, and status changes must be precise.
- **Fast under stress:** urgent care, upcoming appointments, and consultation access must never be buried.
- **Personal:** the product is organized around the user's pets, not around backend modules.

### Product promise

**Trusted pet care, without the uncertainty.**

### Primary user jobs

1. Find a trustworthy vet who fits the pet's need, location, schedule, and budget.
2. Book and pay for an appointment with confidence.
3. Join online care without technical friction.
4. Keep each pet's records, prescriptions, medications, and reminders together.
5. Get clear help during an urgent situation.

### Core product principles

1. **Show the next useful action.** Every screen has one obvious primary action.
2. **Put the pet in context.** Booking, records, reminders, and prescriptions always show which pet they affect.
3. **Reduce uncertainty.** Explain availability, fees, payment state, appointment status, and what happens next.
4. **Use urgency honestly.** Red is reserved for destructive actions, failures, and genuine emergencies.
5. **Preserve trust.** Never hide medical, payment, cancellation, or refund details behind decorative UI.
6. **Design every state.** Loading, empty, offline, error, permission-denied, and success states are part of the product.

---

## 2. Brand direction

### Brand idea: “A warm hand for every paw”

The supplied wordmark combines soft rounded lettering, a medical cross, and a paw. The app should carry the same relationship between care and companionship.

The dominant brand colors sampled from the supplied logo are:

- **Respaw Purple:** `#51237B`
- **Respaw Cream:** `#FFF7F0`

Purple communicates care, confidence, and distinction. Cream removes the coldness of a conventional clinical-white interface. Together they create a recognizable brand without making health information difficult to scan.

### Personality

- Reassuring
- Capable
- Friendly
- Clear
- Respectful
- Optimistic

### Voice and tone

Use plain, supportive language. Prefer an action and an outcome over system terminology.

| Situation | Use | Avoid |
|---|---|---|
| Empty pets | “Add your first pet to start their care profile.” | “No data found.” |
| Search failure | “We couldn't load vets. Check your connection and try again.” | “API request failed.” |
| Booking success | “Bruno's appointment is confirmed.” | “Transaction successful.” |
| Payment pending | “Payment is being confirmed. This can take a moment.” | “Status: processing.” |
| Destructive action | “Delete Max's profile? Health records linked to this pet may also be affected.” | “Are you sure?” |
| Consultation issue | “The connection dropped. We're trying again.” | “WebRTC disconnected.” |

Use sentence case throughout. Avoid all-caps headings except compact metadata labels where the visual treatment is accessible.

### Logo usage

- Use the supplied artwork as an image asset; do not recreate the custom wordmark with a standard font.
- Maintain clear space equal to the height of the paw mark around the logo.
- Preferred lockups: cream wordmark on purple, purple wordmark on cream, or purple wordmark on white.
- Never stretch, outline, recolor individual letters, add shadows, or place it on visually busy photography.
- Splash and sign-in may use the full wordmark. In compact headers use a dedicated paw/cross brand mark once a clean vector asset is available.

---

## 3. Visual design system

### 3.1 Color tokens

#### Brand and action

| Token | Value | Purpose |
|---|---:|---|
| `brand.primary` | `#51237B` | Primary buttons, active navigation, key links, brand moments |
| `brand.primaryPressed` | `#3F1764` | Pressed primary controls |
| `brand.primarySoft` | `#F1E8F7` | Selected rows, active chips, informational callouts |
| `brand.primarySubtle` | `#F8F2FB` | Decorative or grouped section background |
| `brand.onPrimary` | `#FFF7F0` | Text and icons on primary purple |
| `brand.cream` | `#FFF7F0` | Branded background and splash surface |

#### Neutral surfaces and text

| Token | Value | Purpose |
|---|---:|---|
| `surface.canvas` | `#FFFBF8` | Default app background |
| `surface.card` | `#FFFFFF` | Cards, sheets, input surfaces |
| `surface.sunken` | `#F7F2F8` | Grouped controls, skeleton tracks, inactive wells |
| `border.subtle` | `#E9E0EB` | Card and list separators |
| `border.strong` | `#CDBED2` | Focused structure and disabled controls |
| `text.primary` | `#251A2C` | Main copy and titles |
| `text.secondary` | `#695F70` | Descriptions and metadata |
| `text.tertiary` | `#8B818F` | Hints and timestamps |
| `text.inverse` | `#FFFFFF` | Text on dark surfaces |

#### Supporting and semantic

| Token | Value | Purpose |
|---|---:|---|
| `care.teal` | `#247C73` | Healthy/completed states and care guidance |
| `care.tealSoft` | `#E3F3F0` | Completed/healthy status backgrounds |
| `info.blue` | `#27658A` | Neutral information and online care |
| `info.blueSoft` | `#E7F2F8` | Informational status backgrounds |
| `warning.amber` | `#A76108` | Due soon, pending, attention |
| `warning.amberSoft` | `#FFF0D2` | Warning backgrounds |
| `danger.red` | `#B42318` | Emergency, error, destructive action |
| `danger.redPressed` | `#8F1A12` | Pressed destructive control |
| `danger.redSoft` | `#FDE8E6` | Error and emergency backgrounds |

#### Color rules

- Purple is the brand and primary-action color, not a universal background.
- Use no more than one solid purple primary CTA in a visible action group.
- Use semantic color plus an icon and a text label; color alone never carries status.
- Keep long-form text on light neutral surfaces, not on purple.
- White cards are used only when grouping improves comprehension. Do not wrap every element in a card.
- Validate text/background pairs against WCAG AA before implementation.

### 3.2 Typography

Use a friendly rounded display face with a highly legible utility face.

| Role | Family | Size / line | Weight | Usage |
|---|---|---:|---:|---|
| Display | Nunito Sans | 32 / 38 | 800 | Welcome and major success moments only |
| Heading 1 | Nunito Sans | 28 / 34 | 800 | Screen title |
| Heading 2 | Nunito Sans | 22 / 28 | 800 | Major section or sheet title |
| Heading 3 | Nunito Sans | 18 / 24 | 700 | Card and section title |
| Body large | Inter | 16 / 24 | 400 | Prominent body copy and inputs |
| Body | Inter | 14 / 21 | 400 | Default content |
| Body small | Inter | 12 / 18 | 400 | Metadata and helper text |
| Label | Inter | 14 / 18 | 700 | Buttons, tabs, chips |
| Label small | Inter | 12 / 16 | 700 | Status and compact controls |

Implementation notes:

- Bundle font files locally through `expo-font`; do not depend on a runtime font download.
- Until fonts are bundled, use the platform system font and preserve the same sizes and hierarchy.
- Respect system font scaling. Essential actions and values must remain visible at 200% text scaling.
- Use tabular numerals for prices, timers, OTP, and medical measurements where supported.
- Never use the logo typeface for interface copy.

### 3.3 Spacing and grid

Use a 4-point base grid.

| Token | Value |
|---|---:|
| `space.1` | 4 |
| `space.2` | 8 |
| `space.3` | 12 |
| `space.4` | 16 |
| `space.5` | 20 |
| `space.6` | 24 |
| `space.8` | 32 |
| `space.10` | 40 |
| `space.12` | 48 |

- Mobile horizontal screen gutter: 20 px; 16 px only below 360 px width.
- Major sections: 32 px apart.
- Section heading to content: 12–16 px.
- Card padding: 16 px compact, 20 px standard, 24 px hero.
- Minimum touch target: 44 × 44 pt; target 48 × 48 for primary and high-stress controls.
- On tablet, center content in a maximum 720 px column; lists may use a two-column grid above 768 px when it improves scanning.

### 3.4 Shape

| Token | Value | Usage |
|---|---:|---|
| `radius.sm` | 10 | Compact chips and tags |
| `radius.md` | 14 | Inputs and small controls |
| `radius.lg` | 20 | Standard cards and buttons |
| `radius.xl` | 28 | Hero panels and bottom sheets |
| `radius.full` | 999 | Avatars, badges, segmented pills |

Rounded forms echo the logo, but medical tables, receipts, and dense records should use `radius.md` to remain structured.

### 3.5 Depth and borders

- Default hierarchy uses surface tone and a `1 px` subtle border.
- Standard cards: `0 4 16 rgba(52, 28, 67, 0.06)`.
- Floating bars/sheets: `0 -8 32 rgba(52, 28, 67, 0.12)`.
- Avoid stacked shadows, glow effects, glassmorphism, or blur that reduces contrast.
- Focused input: `2 px` Respaw Purple outline with no layout shift.

### 3.6 Icons, illustration, and photography

- Continue using Ionicons for product UI; use one consistent outline/filled pairing.
- Standard sizes: 20 px inline, 24 px navigation, 28 px feature action.
- Do not use emoji as production interface icons; replace current emoji with Ionicons or a Respaw illustration set.
- Pet photography should feel authentic, bright, and calm. Avoid visibly distressed animals except in explicit educational/emergency content.
- Vet imagery should show the person and clinical environment clearly; never use generic avatars when a real profile photo exists.
- Empty-state illustrations should use purple linework, cream surfaces, and one supporting teal or amber accent.

---

## 4. Navigation and information architecture

### Primary tabs

Retain the current five-tab architecture because it matches the product's recurring jobs:

1. **Home** — today's care overview
2. **Find care** — search and nearby vets (rename the current “Search” label)
3. **Appointments** — upcoming and past bookings (rename the current “Bookings” label)
4. **Pets** — pet profiles and records
5. **Profile** — account, payments, plans, and support

### Bottom navigation specification

- White elevated surface with a subtle top border.
- Respect device safe area; visual bar height 64 px before safe-area inset.
- Active tab uses a filled purple icon, purple label, and soft-purple 40 × 32 px icon container.
- Inactive tabs use `text.tertiary` outline icons.
- Always display labels; never rely on icons alone.
- Notification badges are compact red count badges and must not move the icon.
- Hide the bar in focused transactional and immersive flows: booking, payment, consultation room, pet edit form, and destructive confirmations.

### Global screen anatomy

1. Safe-area inset.
2. Top app bar or contextual header.
3. Scrollable content.
4. Optional sticky action region.
5. Bottom safe-area inset or tab bar.

Top app bars use a 44–52 px content height, a clear screen title, a 44 px back target, and no centered title when a right-side action would make the title visually unbalanced.

### Route hierarchy

```text
Splash
└── Authentication
    └── Main tabs
        ├── Home
        │   ├── Notifications
        │   ├── AI Pet Assistant
        │   ├── Vet Detail → Booking → Payment → Confirmation
        │   └── Consultation Picker → Consultation Room
        ├── Find care
        │   ├── Search results ↔ Nearby map
        │   └── Vet Detail → Booking
        ├── Appointments
        │   ├── Appointment Detail
        │   └── Consultation Room
        ├── Pets
        │   ├── Add/Edit Pet
        │   ├── Pet Records
        │   └── Prescriptions
        └── Profile
            ├── Edit Profile / Security
            ├── Payments & Wallet → Payment Detail
            ├── Subscription Plans
            ├── Support and legal
            └── Server Settings (development builds only)
```

---

## 5. Core component specifications

### Buttons

#### Primary

- Purple fill, cream/white label, 52 px height, 20 px radius.
- Full width for final actions in forms and payment flows.
- Loading replaces the leading icon but keeps button width and label context stable.
- Disabled uses `surface.sunken`, `text.tertiary`, and no shadow.

#### Secondary

- White or transparent surface, 1 px purple border, purple label.
- Use for alternatives such as “View details” or “Reschedule.”

#### Tertiary

- Text/icon only with a 44 px touch target.
- Use for “Skip,” “See all,” or non-critical navigation.

#### Destructive and emergency

- Destructive actions use red only inside a clearly labeled confirmation flow.
- The SOS action may use solid red because it represents a genuine emergency entry point.
- Never use the same red treatment for logout.

### Inputs

- Persistent label above the field; placeholder is an example, never the only label.
- 52 px minimum single-line height, 14 px radius, white fill, subtle border.
- Focus uses purple border and visible caret.
- Error adds red border, error icon, and actionable message below.
- Success validation is usually silent; avoid green borders on every valid input.
- Password visibility, date picker, clear, and search icons have 44 px touch targets.

### Cards and list rows

- Use a card when several pieces of information and an action belong together.
- Use divider-based rows for settings and dense histories.
- Pet and vet cards lead with a real image, then identity, then decision information.
- Entire card is tappable where appropriate; nested secondary actions remain distinct and accessible.
- Pressed state: 2% purple overlay and scale no smaller than `0.99`.

### Status chips

| Status family | Treatment |
|---|---|
| Confirmed / active | Purple text on `brand.primarySoft` |
| Completed / healthy | Teal text on `care.tealSoft` |
| Pending / due soon | Amber text on `warning.amberSoft` |
| Failed / cancelled | Red text on `danger.redSoft` |
| Neutral / unavailable | Secondary text on `surface.sunken` |

Every status chip includes a readable label. Avoid uppercase unless the chip is very short and letter spacing remains legible.

### Bottom sheets and dialogs

- Use a bottom sheet for selection and short forms on mobile.
- Use a centered dialog only for consequential confirmation.
- Sheet radius: 28 px top corners; grab handle is decorative and not the only dismiss mechanism.
- Provide an explicit close button, meaningful title, and safe-area padding.
- Destructive dialogs name the affected object and explain the consequence.

### Feedback patterns

- Skeletons for first-load lists and cards.
- Pull-to-refresh for user-owned changing data.
- Inline retry for section failure; full-screen error only when the screen cannot function.
- Toast/snackbar for reversible lightweight confirmation.
- Dedicated success state for booking, payment, and account-critical outcomes.

---

## 6. Screen-by-screen product design

### 6.1 Splash

**Goal:** establish trust while session restoration runs.

- Full Respaw Purple background.
- Cream supplied wordmark centered optically, not mathematically.
- Optional small line: “Care for every paw.”
- No generic spinner during normal startup; use a subtle paw pulse only if startup exceeds 800 ms.
- Version/build appears only in development or a long-press diagnostic state.
- Transition with a short 220 ms fade; respect reduced motion.

### 6.2 Sign in, sign up, OTP, and password recovery

**Goal:** get the user into care with minimal uncertainty.

- Cream canvas, compact purple logo at top, one welcoming title, one sentence of guidance.
- Segmented sign-in methods should not expose every authentication form at once. Default to the most common method and progressively disclose alternatives.
- Phone/email field appears first; primary CTA reads “Continue.”
- OTP uses six separate visual cells backed by one accessible input and supports paste/autofill.
- Keep “Server settings” out of production builds; in development place it in a low-emphasis footer.
- Keyboard never covers the primary action or error message.
- Terms and privacy links appear before account creation confirmation.

### 6.3 Home — “Today with your pets”

**Goal:** show the most important care action within one glance.

Content order:

1. Greeting, selected pet context, and notification action.
2. **Next appointment card** when one exists; this replaces generic dashboard statistics as the highest-value item.
3. **Care shortcuts:** Find a vet, Online consult, Records, Emergency.
4. **Pet care today:** due medication, vaccination, or reminder items.
5. Nearby recommended vets.
6. User's pets.
7. Useful care articles.

Design details:

- Header: “Good morning, Priya” and “How is Bruno today?” with pet avatar switcher.
- Appointment hero uses soft purple, shows vet, pet, time, modality, and a contextual action such as “View details” or “Join now.”
- Emergency shortcut is visually distinct but not the biggest element when no emergency exists.
- Replace the current three generic count statistics with actionable care information. Counts may appear as supporting metadata.
- Verification, offline, and permission banners sit below the header and can be dismissed when appropriate.
- Horizontal carousels show part of the next card to indicate scrolling; critical content is never carousel-only.

Empty personalized state: introduce the value of adding a pet and use “Add your first pet” as the CTA.

### 6.4 Find care / Search

**Goal:** help users compare vets quickly and confidently.

- Large search field below the title with query, location, and filter controls.
- Quick filter chips: Available today, Online, Emergency, Home visit, Rating 4+.
- Results header shows result count and sort control.
- List/map toggle uses a labeled segmented control; remember the user's last choice.
- Vet result row includes photo, name, qualification/specialty, clinic, rating and review count, distance, next availability, fee, and relevant service chips.
- Primary row action is “View profile”; do not place a full-width “Book” button on every result.
- Sponsored or promoted results must be clearly labeled.
- No results state explains which filters are limiting results and offers “Clear filters.”
- If location is denied, allow city/postcode entry and explain why location helps.

### 6.5 Nearby vets map

**Goal:** understand proximity without losing comparison context.

- Full-bleed map with floating search and list/map toggle.
- Purple branded pins; selected pin is larger with a cream center.
- A bottom snap carousel shows the selected vet summary and keeps the map visible.
- “Search this area” appears only after the map moves meaningfully.
- Location permission failure falls back to the list, never a dead-end map.

### 6.6 Vet detail

**Goal:** establish credibility and support a booking decision.

- Image-led identity header with vet photo, name, credentials, clinic, verified badge, rating, and review count.
- A compact trust strip shows experience, response/availability, and languages.
- Content sections: About, Services, Fees, Availability, Clinic location, Reviews.
- Avoid making all information separate cards; use clear section dividers and cards only for fees, availability, and map.
- Sticky bottom action area: secondary “Consult online” and primary “Book appointment.”
- Fee language is explicit: consultation, online, and home-visit fees are not blended.
- “Get directions” opens the map app. “Call clinic” is secondary and requires confirmation only when necessary.
- Reviews show distribution and recent useful comments; rating alone is not enough.

### 6.7 Booking

**Goal:** complete a correct booking with no hidden decisions.

Use a four-step structure with a compact progress indicator:

1. **Pet and visit type**
2. **Date and time**
3. **Reason and details**
4. **Review and pay**

Rules:

- Keep the selected vet summary visible in a compact header.
- Pet selector uses photo chips/cards; “Add pet” is available inline.
- Modality changes update fee and explanatory content immediately.
- Date strip shows the next seven useful dates. Calendar sheet handles later dates.
- Slots are grouped Morning / Afternoon / Evening. Disabled slots remain visible with a reason when known.
- Review step shows pet, vet, type, date/time, reason, fee, cancellation policy, and payment choice.
- Sticky CTA uses the next action: “Choose a time,” “Review booking,” then “Continue to payment.”
- Preserve progress if the user navigates back within the flow.

### 6.8 Payment

**Goal:** make amount, payment state, and outcome unmistakable.

- White/cream screen with a compact booking summary, itemized fee card, and bold total.
- State who receives payment and what the cancellation/refund policy is.
- Primary action reads “Pay ₹499 securely,” not “Submit.”
- External Razorpay UI should receive Respaw Purple as its theme color.
- While verification runs, lock duplicate payment actions and show “Confirming payment…” with an explanation.
- Failure retains the booking and offers “Try payment again” plus support.
- Never show success until server verification succeeds.

### 6.9 Confirmation

**Goal:** celebrate briefly, then explain what happens next.

- Cream canvas, purple success mark with a restrained paw animation.
- Title names the pet when possible: “Bruno's appointment is confirmed.”
- Summary card: vet, date/time, visit type, amount paid, appointment reference.
- Next-step callout varies by modality: clinic arrival instructions, home-visit preparation, or online join time.
- Primary CTA: “View appointment.” Secondary: “Back to home.”

### 6.10 Appointments and appointment detail

**Goal:** manage care before and after a visit.

- Top segmented control: Upcoming / Past / Cancelled; badge only when meaningful.
- Upcoming appointments are grouped by date and emphasize the next event.
- Card includes vet, pet, time, modality, status, and only the most relevant action.
- Detail screen uses a timeline: Booked → Accepted → In progress → Completed.
- Actions change by state: Pay, Reschedule, Cancel, Join, View records, Review.
- Join button becomes prominent only inside the valid join window, with a visible countdown or availability note.
- Cancellation sheet explains refund implications before confirmation.
- Past appointment details connect directly to visit notes and prescriptions.

### 6.11 Consultation modality picker

**Goal:** help users select the right kind of remote care.

- Three large choices: Video, Audio, Chat.
- Each shows best-for guidance, expected fee, and availability.
- Recommended option may have a “Recommended” badge only when based on real context.
- Include a safety note: online consultation is not for life-threatening emergencies, with an emergency-care link.
- CTA: “Continue with video/audio/chat.”

### 6.12 Consultation room

**Goal:** keep medical conversation stable and understandable.

- Use a dark plum immersive surface for video/audio, distinct from the normal app canvas.
- Top bar: vet identity, elapsed time, and connection status with text.
- Bottom controls use large circular targets and consistent positions; end-call is isolated in red.
- Self-view never covers the vet's face or critical connection messaging.
- Chat panel opens as a sheet/side panel and preserves message position.
- Reconnecting state leaves the session visible, explains progress, and offers chat fallback.
- Permission-denied state explains which permission is needed and links to system settings.
- End consultation requires confirmation, then routes to visit summary or appointment detail.

### 6.13 AI Pet Assistant chat

**Goal:** provide helpful guidance without pretending to replace a vet.

- Purple-tinted assistant bubbles, neutral user bubbles, visible assistant identity.
- Start screen offers contextual prompts: symptoms, feeding, medication reminders, or preparing for a visit.
- Persistent disclaimer is concise: “Respaw Assistant offers general guidance, not a diagnosis.”
- Potential emergency language triggers a red urgent-care card with “Find emergency care.”
- Failed messages stay in place with retry; never silently disappear.
- Composer supports multiline input and remains above keyboard/safe area.

### 6.14 Pets

**Goal:** make each pet feel like a living care profile.

- Page title and “Add pet” action at top.
- The primary/selected pet may use a wider feature card; other pets use compact list cards.
- Card: photo, name, species/breed, age, next care item, and record shortcut.
- Do not put Edit and Delete as equally prominent card actions. Edit lives in detail; Delete lives in an overflow/settings area.
- Empty state uses a friendly branded illustration and one CTA.

### 6.15 Add / edit pet

**Goal:** collect enough information without making setup feel clinical.

- Break into sections: Basics, Details, Health notes, Photo.
- Use native date picker instead of date-format text entry.
- Species and sex use accessible selection controls; weight uses numeric keyboard and explicit kg unit.
- Photo picker offers Camera and Gallery through a bottom sheet.
- Validate near the field and retain entered values after errors.
- Sticky primary CTA: “Add pet” or “Save changes.”
- Delete is separated at the bottom of edit mode with a named confirmation.

### 6.16 Pet records and prescriptions

**Goal:** make medical history scannable and trustworthy.

- Pet identity header stays compact and shows key details.
- Tabs: Timeline, Medical, Medications, Reminders. Documents and prescriptions can be filters within Medical unless content volume justifies separate tabs.
- Timeline uses a vertical line with recognizable icons, date, title, vet/source, and summary.
- “Add” opens a menu for Record, Medication, Reminder, or Document instead of a generic unlabeled form.
- Replace raw ISO date/time entry with native pickers.
- Prescription screen groups by pet, clearly labels vet and date, and separates view from download.
- Document download shows progress and an offline/error outcome.
- Medical records use sharper card radius and lower decoration than lifestyle content.

### 6.17 Notifications

**Goal:** show what changed and take the user to the right place.

- Group by Today, Earlier, and Older.
- Unread item uses a soft-purple surface and a purple dot; read item is neutral.
- Icons reflect category: appointment, payment, reminder, consultation, system.
- Entire row opens its destination; swipe actions are optional and never the only way to mark read.
- “Mark all read” is a tertiary action with confirmation feedback, not a primary button.
- Empty state: “You're all caught up.”

### 6.18 Payments, wallet, and payment detail

**Goal:** make money movement auditable.

- Wallet balance uses a purple feature panel only if balance is a real user concept; otherwise title the surface “Payments.”
- Transactions are grouped by month and show purpose, pet/appointment, date, amount, and status.
- Payment detail uses receipt-style rows, reference IDs with copy action, and a clear refund timeline.
- Refund messages include expected timing and support path.
- Monetary values use consistent rupee formatting and never rely on color for positive/negative meaning.

### 6.19 Subscription plans

**Goal:** explain value before asking for payment.

- Current plan appears first with status, renewal/expiry date, and manage action.
- Plans use a vertically scrollable comparison, not tiny side-by-side cards on phones.
- Each plan names who it is for, price cadence, top benefits, limits, and exclusions.
- Highlight only one recommended plan.
- CTA states price/cadence: “Choose Plus — ₹299/month.”
- FAQ follows plans and includes cancellation and refund rules.

### 6.20 Pet care articles

**Goal:** make trustworthy education easy to browse.

- Featured story with image, then category chips and article list.
- Cards show category, title, credible author/source, date, and read time.
- Article detail prioritizes readable text: 16 px body, 24 px line height, controlled line width.
- Medical content includes reviewer/source and updated date.
- Like/comment features remain secondary to reading and credibility.

### 6.21 Profile and settings

**Goal:** manage account and connected product services without clutter.

- Identity card: avatar, name, verified email/phone state, edit action.
- Group rows into Care & pets, Payments & plan, Notifications, Security, Help, Legal.
- Use icons in soft tinted containers and plain divider rows, not a separate floating card per setting.
- Sign out is a standard secondary row. Delete account is red and isolated at the end.
- Edit profile and password forms open as full screens or keyboard-safe sheets.
- Server settings is visible only in development/internal builds.

---

## 7. Cross-cutting states

### Loading

- Use skeletons shaped like the final content for lists, pet cards, vet cards, and appointment cards.
- Use a spinner only for compact in-place actions such as a button or pull-to-refresh.
- Preserve layout to prevent content jumps.

### Empty

Every empty state contains:

1. Relevant illustration/icon.
2. Specific title.
3. One sentence explaining value or cause.
4. One primary recovery action when the user can act.

### Error

- Field errors appear next to the field.
- Section errors stay within the failed section and offer retry.
- Full-screen errors are reserved for screens that cannot render any useful data.
- Error copy never exposes endpoints, status codes, or internal identifiers.
- Preserve user input after recoverable errors.

### Offline

- Show a persistent but compact offline banner.
- Previously loaded records remain readable where cached.
- Mutations state clearly whether they were not sent; do not imply a save succeeded.
- Consultation and payment have purpose-built offline states because retry consequences differ.

### Permissions

- Ask for location at the moment the user requests nearby care, not at first launch.
- Ask for camera/microphone when entering the matching consultation or capture flow.
- Explain benefit before the system prompt.
- Provide a manual fallback and a path to Settings after denial.

### Destructive actions

- Name the item affected.
- Explain irreversibility and downstream impact.
- Default focus is the safe action.
- Never use swipe-only deletion.

---

## 8. Motion and haptics

Motion should communicate state, not decorate the screen.

| Interaction | Duration | Treatment |
|---|---:|---|
| Button press | 80–120 ms | Subtle tint/scale response |
| Screen transition | 220–280 ms | Native stack transition |
| Sheet open | 260–320 ms | Native spring with restrained bounce |
| Success mark | 400–600 ms | One-time draw/scale; no loop |
| Skeleton shimmer | 1200 ms | Low-contrast loop; stop after load |

- Use light haptic feedback for selection, medium for booking/payment success, and warning haptic for destructive confirmation.
- Do not haptic-feedback ordinary scrolling or every text interaction.
- Respect the operating system's reduced-motion preference.

---

## 9. Accessibility and inclusive design

- Minimum 4.5:1 contrast for normal text and 3:1 for large text and meaningful graphical controls.
- Touch targets are at least 44 × 44 pt with adequate spacing between destructive and safe actions.
- All icons have accessibility labels; decorative images are hidden from screen readers.
- Announce loading completion, validation errors, payment status, connection changes, and new chat messages appropriately.
- Focus moves to the first invalid field after submission and to sheet/dialog title after opening.
- Support font scaling without clipped tabs, buttons, values, or cards.
- Do not communicate appointment/payment/health status by color alone.
- Provide captions or chat fallback for remote consultations when possible.
- Inputs use correct keyboard, autocomplete, content type, and return-key behavior.
- Verify Android TalkBack and iOS VoiceOver for all critical flows.
- Design copy to support localization; do not concatenate translated fragments.
- Dates and times use device locale while storing/sending canonical backend formats.

---

## 10. Responsive and device behavior

- Baseline mobile widths: 320, 360, 390, 430 px.
- Test small-height devices and screens with the keyboard open.
- Tablet: center content, allow two-column discovery/profile layouts, and keep transactional forms in a readable 600–720 px column.
- Landscape is required for consultation room and supported gracefully elsewhere.
- Respect notches, gesture areas, and edge-to-edge Android insets.
- Bottom sticky actions always include safe-area padding.
- Maps, video, and web payment views must provide explicit loading and fallback surfaces.

---

## 11. Implementation architecture

The redesign should be implemented as a design-system migration, not as isolated screen recoloring.

### Token layer

Replace the current compact theme with semantic tokens while retaining temporary compatibility aliases during migration:

```text
src/design/
├── colors.ts
├── typography.ts
├── spacing.ts
├── radius.ts
├── shadows.ts
├── motion.ts
└── index.ts
```

### Foundation components

Create or upgrade reusable primitives before redesigning screens:

```text
AppScreen, AppHeader, AppText, IconButton
Button, TextField, SearchField, SelectField
Card, ListRow, Divider, Avatar
Chip, StatusBadge, SegmentedControl
BottomSheet, ConfirmDialog, Snackbar
Skeleton, EmptyState, ErrorState, OfflineBanner
PetAvatar, PetSummaryCard, VetSummaryCard, AppointmentCard
StickyActionBar
```

### Migration rules

- Preserve navigation names, API calls, data adapters, auth behavior, notification deep links, and payment/consultation business logic.
- Move styles to semantic tokens and primitives incrementally.
- Do not redesign and change backend contracts in the same change set.
- Replace emoji UI icons with Ionicons during the owning screen migration.
- Maintain compatibility exports from `src/theme.ts` until all screens migrate.
- Keep server settings behavior untouched and development-only.

---

## 12. Recommended delivery plan

### Phase 0 — Brand asset preparation

- Obtain/export transparent SVG and PNG variants of the wordmark.
- Produce a compact app mark, monochrome mark, adaptive icon, splash asset, and notification icon.
- Confirm legal product naming/capitalization: use **Respaw** in prose and the lowercase custom wordmark in artwork.

### Phase 1 — Foundations

- Add semantic design tokens and local fonts.
- Build shared text, button, input, card, header, status, state, sheet, and sticky-action primitives.
- Configure status bar, navigation theme, safe areas, and bottom tab bar.
- Add a small internal component showcase screen for visual QA.

### Phase 2 — Entry and navigation

- Redesign Splash and Authentication.
- Apply the branded bottom navigation and global screen/header structure.
- Validate keyboard, font scaling, safe areas, and session-restoration states.

### Phase 3 — Core care discovery

- Redesign Home, Find care, Nearby map, Vet detail.
- Introduce pet context and next-appointment priority on Home.
- Validate location denied, empty vets, filters, long names, and missing images.

### Phase 4 — Booking and payment

- Convert Booking into the guided four-step flow.
- Redesign Payment and Confirmation.
- Validate duplicate submission prevention, failed verification, back navigation, and payment retry.

### Phase 5 — Appointments and consultation

- Redesign Appointments, Appointment Detail, Modality Picker, Consultation Room, and AI Assistant.
- Test every appointment status and consultation connection/permission state.

### Phase 6 — Pet health

- Redesign Pets, Add/Edit Pet, Pet Records, Prescriptions, medications, and reminders.
- Replace raw date/time fields with native pickers.
- Test image permissions/uploads, long records, missing files, and deletion warnings.

### Phase 7 — Account and supporting surfaces

- Redesign Notifications, Profile, Payments/Wallet, Payment Detail, Plans, Blog, and Article Detail.
- Confirm Server Settings remains internal and functional.

### Phase 8 — Quality and release hardening

- Visual regression check at target device widths.
- TalkBack and VoiceOver pass.
- Font-scale, contrast, keyboard, safe-area, and reduced-motion pass.
- Offline, slow network, empty, partial API failure, and retry pass.
- Performance check for long lists, images, maps, and consultation surfaces.
- Final copy and brand consistency review.

---

## 13. Product analytics checkpoints

Use analytics to validate usability, not to decorate the dashboard.

- Home primary action selected.
- Search initiated, filter applied, result opened.
- Vet detail viewed → booking started.
- Booking step viewed/completed/abandoned.
- Payment initiated/succeeded/failed/cancelled.
- Appointment join attempted/succeeded/failed.
- Pet added and record/reminder created.
- Empty/error recovery CTA selected.
- Permission education viewed and system outcome.

Do not send medical note text, chat contents, payment credentials, precise location, or other sensitive data as analytics properties.

---

## 14. Design acceptance checklist

A screen is complete only when:

- The primary user goal is visible without interpretation.
- It uses semantic tokens and shared components rather than one-off values.
- Real content, long content, missing images, and zero-content states work.
- Loading, error, offline, disabled, focused, pressed, success, and destructive states are designed where relevant.
- Content is usable at narrow width and with large text.
- Touch targets, contrast, labels, and screen-reader order pass accessibility review.
- Keyboard and safe-area behavior are correct.
- Back navigation preserves or safely discards progress with clear warning.
- Business logic and API behavior remain unchanged unless separately approved.
- The result visibly belongs to Respaw: purple and cream, warm rounded forms, meaningful pet context, and calm clinical clarity.

---

## 15. Out of scope for the visual redesign

- New backend endpoints or changes to API contracts.
- Changing appointment, refund, subscription, or consultation business rules.
- Inventing saved-vet, insurance, pharmacy, or social features that are not implemented.
- Replacing the existing navigation library, map provider, RTC provider, or payment provider solely for appearance.
- A dark theme in the first migration. The consultation room can use a dedicated dark immersive surface.

---

## Final design direction

Respaw should be immediately recognizable from its first frame: deep caring purple, warm cream, soft confident shapes, real pet context, and calm clinical information. The redesign succeeds when a pet parent can open the app—especially while worried—and understand the next safe action in seconds.
