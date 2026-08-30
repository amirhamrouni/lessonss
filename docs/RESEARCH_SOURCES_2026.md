# English Twin — Research Sources (2026)

This document records the primary sources used for product and engineering decisions. It is a research ledger, not a claim of certification or endorsement.

## Curriculum and assessment

- Council of Europe — CEFR Descriptors: https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- Council of Europe — CEFR Companion Volume (2020): https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions
- Council of Europe — CEFR in the classroom: https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-in-the-classroom
- Council of Europe — Tests and Examinations: https://www.coe.int/en/web/common-european-framework-reference-languages/tests-and-examinations

Product rule: English Twin may align learning objectives and diagnostics with CEFR descriptors, but it must not present its internal placement result as an official CEFR certificate.

## Spaced repetition

- open-spaced-repetition/ts-fsrs: https://github.com/open-spaced-repetition/ts-fsrs

Engineering rule: FSRS owns vocabulary review scheduling. Review dates must not be random. Review state and logs remain persistent per authenticated user.

## Gemini

- Gemini API docs: https://ai.google.dev/gemini-api/docs
- Interactions API: https://ai.google.dev/api/interactions-api-v1
- Live API: https://ai.google.dev/api/live
- Live transcription / ephemeral tokens: https://ai.google.dev/gemini-api/docs/live-api/live-transcribe

Engineering rules:
- New text tutor workflows use the Interactions API.
- Permanent Gemini API keys are server-side only.
- Browser/mobile live-audio connections must use a secure server token flow / ephemeral tokens rather than exposing a permanent key.
- AI responses consumed by application logic are validated before use.

## Firebase security

- Firestore security overview: https://firebase.google.com/docs/firestore/security/overview
- Firestore quickstart/security examples: https://firebase.google.com/docs/firestore/quickstart
- Insecure rules guidance and emulator testing: https://firebase.google.com/docs/firestore/security/insecure-rules

Engineering rules:
- Private learner data is owner-scoped by authenticated UID.
- Firestore Security Rules are authorization, not UI hiding.
- App Check is part of the production hardening plan.
- Rules should be tested with the emulator before release.

## Open-source product references

- My Korean Birdie (MIT): https://github.com/Reterics/project_v9_korea

Used as a reference for product information architecture: learning hub, short focused practice, SRS, sentence-building and a separate design system. No proprietary third-party course content is copied.

## Current English Twin implementation decisions

1. Core curriculum is deterministic and versionable; Gemini does not invent the whole course at runtime.
2. A1 and A2 use Course/Level → Unit → Lesson → Activity structure.
3. Placement uses deterministic objective questions and produces an internal estimated level only.
4. FSRS controls due-review scheduling.
5. The adaptive home prioritizes: placement → due review → next structured lesson → speaking transfer.
6. Gemini is an intelligence layer for feedback/conversation, not the curriculum database.
