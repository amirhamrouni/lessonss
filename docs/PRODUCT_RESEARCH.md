# English Twin — Product Research & Architecture Decisions

This document records the external references used to improve the product structure. It is not a copy plan: only ideas, architecture patterns, and permissively licensed implementation references may be reused.

## Product references

### My Korean Birdie — MIT
Repository: https://github.com/Reterics/project_v9_korea

Useful patterns:
- Learning Hub as the product center
- feature-based structure
- SRS flashcards
- sentence builder / grammar practice
- mini-games as separate practice modes
- design system as a first-class package
- mobile bottom navigation and desktop adaptation
- Vitest + Playwright + Storybook quality stack

Applied to English Twin:
- dedicated Practice area
- learning journey separate from practice
- one clear next action on Home
- future reusable activity/game host

### Recall — MIT
Repository: https://github.com/Madlezz/Recall

Useful patterns:
- FSRS / ts-fsrs scheduling
- local-first review flow
- React + TypeScript strict architecture
- PWA/offline mindset
- Zustand/i18n separation

Planned use:
- real Review queue based on ts-fsrs
- due cards and review history
- offline-friendly practice

### Google Gemini Live API Web Console — Apache-2.0
Repository: https://github.com/google-gemini/live-api-web-console
Official Live API: https://ai.google.dev/api/live
Ephemeral token guidance: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens

Useful patterns:
- WebSocket live-session lifecycle
- audio streaming boundaries
- voice session state handling

Decision:
- permanent Gemini keys must never ship in the client
- production Live API should use a secure backend / ephemeral token path
- English Twin voice UI uses explicit states: idle, listening, thinking, speaking

### Voice Assistant — MIT
Repository: https://github.com/cris-m/voice-assistant

Useful patterns:
- Web Audio API + AudioWorklet
- live PCM processing
- stateful audio visualizer architecture

Potential use:
- audio capture/visualizer implementation after secure Gemini service boundary is complete

## Pedagogy references

### Council of Europe — CEFR
Main reference: https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions
Descriptors: https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors

Decisions:
- curriculum should be organized by CEFR levels and communicative competencies
- lessons should lead to action-oriented outcomes rather than isolated trivia questions
- self-reported level is not equivalent to a placement result
- future assessment must evaluate multiple skills and not claim official CEFR certification

## Authentication and data security

### Firebase
Auth persistence: https://firebase.google.com/docs/auth/web/auth-state-persistence
Firestore security: https://firebase.google.com/docs/firestore/security/overview
Security checklist: https://firebase.google.com/support/guides/security-checklist

Decisions:
- Firebase Auth UID is the canonical user identity
- private progress is owner-only via Firestore Rules
- no public wildcard writes
- App Check should be added before production
- auth session persistence is expected and tested

## Localization

### react-i18next
Docs: https://react.i18next.com/

Decision:
- interface language must be separated from learning language
- translations must move out of hardcoded JSX
- Arabic must use real RTL layout support

## New information architecture

Bottom navigation:
1. Home
2. Learn
3. Practice
4. Speak
5. Me

Secondary routes:
- Progress
- Lesson Player
- future Review
- future Placement Assessment
- Settings

### Why

Home = one recommended next action and daily plan.
Learn = structured CEFR journey.
Practice = reinforcement modes such as recall, grammar, real-life practice, and future games.
Speak = dedicated voice-first AI experience.
Me = identity, progress access, preferences and account.

Progress is intentionally not one of the five primary navigation actions because it is observation, not learning activity.

## Non-negotiable product rules

- No fake XP, fake streaks, fake AI insights or fake progress.
- No proprietary course content copied from commercial products.
- No Gemini key in browser source.
- No single giant chatbot replacing the curriculum.
- No visual-only buttons presented as finished features.
- Open-source code reuse requires compatible licensing and attribution where required.
