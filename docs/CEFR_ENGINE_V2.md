# English Twin Curriculum Engine v2

Status: implementation of approved Amir Dev Brain CEFR expansion decision.

## Scope

Curriculum Engine v2 extends the existing A0/A1/A2 product through B1, B2 and C1 without rewriting historical lesson IDs or learner progress.

- A0 Foundation remains separate.
- Existing A1 lesson IDs remain immutable.
- Existing A2 lesson IDs remain immutable.
- B1: 8 units × 5 lessons = 40 lessons.
- B2: 8 units × 5 lessons = 40 lessons.
- C1: 8 units × 5 lessons = 40 lessons.

The product describes these paths as **CEFR-aligned** and learner results as an **Estimated CEFR profile**. It does not claim external CEFR certification.

## Compatibility model

v2 is a superset, not a destructive replacement. Legacy A1/A2 lessons continue to use the existing renderer and progress documents. Native v2 lessons use explicit metadata and `LessonRouter` dispatches them to the advanced renderer.

Historical progress remains under `users/{uid}/lessonProgress/{lessonId}`. No bulk migration rewrites existing user records.

## Canonical v2 model

Every native v2 lesson has:

- `schemaVersion: 2`
- independent `contentVersion`
- explicit CEFR `level`
- explicit `unitId`
- primary and supporting skills
- CEFR-aligned Can-Do descriptors
- prerequisites
- discriminated activity types
- review seeds
- an assessment completion policy

Long-form content is represented by typed content blocks. Markdown may exist only as an explicitly typed content value; it is not mixed with JSON structure.

## Skill model

The advanced learner model distinguishes:

- vocabulary
- grammar
- reading
- listening
- spoken interaction
- spoken production
- writing
- pronunciation
- mediation

The overall learner level is not treated as proof that every skill has the same level.

## Advanced activities

The engine supports extended reading, inference, critical reading, listening comprehension, dictation, lexical chunks, collocations, paraphrase, error correction, guided/free writing, paragraph synthesis, summarisation, argument building, roleplay, open speaking, mediation, source comparison and presentation.

## Evaluation policy

Objective tasks remain deterministic. Open-response tasks use a hybrid pipeline:

1. deterministic preflight;
2. constrained AI analytic rubric;
3. JSON schema validation;
4. deterministic aggregation;
5. remediation targets stored as learner evidence.

The AI evaluator never decides the final overall score or pass/fail status. It returns dimension scores only. The application/server aggregates those dimensions with a versioned deterministic rule.

Transcript-based speaking/pronunciation flows must not claim acoustic measurement that is not implemented. The advanced pronunciation lab reports transcript matching as an intelligibility proxy and presents prosody guidance as coaching.

## Learner state

The v2 profile separates:

- declared level;
- estimated overall level;
- current curriculum level;
- skill-specific evidence/mastery.

Advanced learners are not forced through A0 simply because a historical beginner flag is absent. Missing prerequisites trigger targeted repair rather than a full level reset.

## Persistence

Large or repeatable learner records use subcollections rather than one growing profile document:

- `lessonProgress`
- `reviewCards`
- `reviewLogs`
- `mistakes`
- `assessments`
- `attempts`
- `writingResponses`
- `evaluations`
- `skillEvidence`
- `mastery`
- `twin`
- `learningSessions`

Account deletion is required to remove all app-managed collections above plus the user profile.

## Rollout and rollback

Client rollout flags:

- `VITE_CURRICULUM_V2`
- `VITE_ENABLE_B1`
- `VITE_ENABLE_B2`
- `VITE_ENABLE_C1`
- `VITE_AI_EVALUATION`

A disabled advanced level is removed from the Learn path and direct native-v2 lesson routing is blocked. Existing A0-A2 remains available.

Rollback must never delete or rename stored v2 responses. A rollback simply disables advanced routing or deploys the prior verified release; historical A0-A2 data remains unchanged.

## Release gates

A release is not complete until:

- TypeScript typecheck passes;
- curriculum contracts pass;
- evaluation contracts pass;
- legacy progress/review regression tests pass;
- mobile/RTL visual contracts pass;
- production build passes;
- CodeQL/security scan passes;
- verified `main` is deployed to production;
- production health and deep routes are checked.
