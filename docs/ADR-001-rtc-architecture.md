# ADR-001 — RTC Architecture for the User App

**Date:** 2026-06-15  
**Status:** Accepted  
**Deciders:** Prince Dwivedi  

---

## Context

The user app (`pet-help-user-app`) is ~65% built using:
- `fetch`-based API client (`services/client.ts`) with `SecureStore` auth token
- React Context for global state (`AuthProvider`)
- Plain service modules (no Zustand, no React Query)

The vet app (`respaw-vet-app`) uses a different stack (Axios + Zustand + React Query + react-hook-form + Zod) and has already integrated `react-native-agora 4.5.4` for video/audio consultations via a provider abstraction in `src/services/rtc/`.

A rewrite of the user app's state layer to mirror the vet app would take approximately 2 days and provides no user-visible value within the 10-day delivery window.

## Decision

**Keep the existing `fetch` + React Context + service-module stack unchanged.** Do not introduce Axios, Zustand, or React Query into the user app.

**Mirror only the RTC provider abstraction** from the vet app:
- Copy the `RtcProvider` interface and `ConnectionState` / callback types (provider-agnostic contract)
- Adapt `AgoraRtcProvider` (identical Agora SDK calls; no vet-app-specific imports)
- Adapt `useRtcSession` hook to use this app's own `fetch`-based `request()` client instead of `useQuery` / `consultationsApi`
- Adapt `RtcLocalView` / `RtcRemoteView` wrappers (identical `RtcSurfaceView` usage)

The token is fetched via `GET /consultations/:uuid/rtc-token` using this app's existing `request()` function from `services/client.ts`.

## Consequences

**Positive:**
- ~2 days saved vs. a full state-layer rewrite
- RTC provider contract is identical between both apps — a future migration to a non-Agora provider (Twilio, LiveKit, etc.) only requires a new `RtcProvider` implementation
- No risk of breaking the 17 already-working screens
- TypeScript interface enforces the contract; concrete provider is swapped by changing one `new AgoraRtcProvider()` call

**Negative / Trade-offs:**
- `useRtcSession` uses `useState` + `useEffect` for token fetching instead of React Query — no automatic cache / stale-time / retry UI. Acceptable for a single-use consultation screen.
- If the user app later adopts React Query, the hook can be updated to `useQuery` without changing the `RtcProvider` interface.

## Rejected alternative

Rewrite `services/` to Zustand + React Query to fully mirror the vet app. Rejected because:
- 2-day cost with zero user-visible feature gain
- High regression risk on ~17 already-working screens
- Not required to ship Agora A/V
