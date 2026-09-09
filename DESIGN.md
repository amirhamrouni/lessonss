---
version: v12
name: "English Twin — Education Product System"
description: "A mobile-first language-learning interface built from proven education UX patterns, bilingual target/support composition, tactile learning controls, focused lessons, FSRS review and measurable speech feedback."
colors:
  canvas: "#F4F6FB"
  surface: "#FFFFFF"
  surface-soft: "#F8F9FD"
  primary-soft: "#EDF2FF"
  voice-soft: "#EAF8F6"
  ink: "#18233B"
  ink-muted: "#768198"
  line: "#E1E6EF"
  primary: "#3561F5"
  primary-strong: "#234BD0"
  voice: "#0CA59D"
  success: "#1A9B55"
  warning: "#E3A22C"
  danger: "#D34F47"
typography:
  latin: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
  arabic: "Tajawal, Noto Sans Arabic, Tahoma, Arial, sans-serif"
layout:
  phone-max: "430px"
  responsive-max: "520px"
  page-inline: "16px"
  bottom-nav: "68px"
  primary-control: "48px"
---

# English Twin Design System

## Product direction

English Twin is a **language-learning product first**. It must not look like an AI dashboard, a template gallery, a newspaper/editorial experiment, or a decorative chatbot.

Every route answers one concrete learner question:

- **Home:** What should I do next?
- **Learn:** Where am I in the course?
- **Lesson:** What is the one task in front of me now?
- **Review:** What is due from memory now?
- **Speak / Pronunciation:** What did I say and how can I improve it?
- **Twin:** How do I turn what I learned into conversation?
- **Profile:** What learning plan and language support am I using?

The product signature is **Target ↔ Support**: English remains the target; the learner's preferred language supports understanding. The identity comes from that learning relationship and from consistent interaction patterns, not a mascot or generic AI imagery.

## Source-informed foundations

V12 deliberately studies proven education UX and permissively licensed implementations before adding product-specific design:

- **Open-Apps-Studio/lingo-lessons — MIT:** focused lesson flow, tactile learning-button behavior, locked/unlocked course progression, Learn / Practice / Profile separation.
- **pablocaeg/polyglot — MIT:** semantic theme-token thinking, compact icon + label bottom navigation, reusable learning surfaces.
- **sanidhyy/duolingo-clone — MIT:** challenge selection states, correct/wrong feedback, progress + persistent lesson action.
- **Busuu product patterns:** compact study-plan hierarchy and short, goal-oriented learning sessions. Used as UX research only; no proprietary assets or code.
- **ELSA product patterns:** target phrase → listen → record → transcript → measured feedback hierarchy. Used as UX research only; no proprietary assets or code.

License notices for adapted open-source patterns live in `THIRD_PARTY_NOTICES.md`.

## Runtime authority

- `src/design-tokens.css` remains the compatibility token layer for older routes.
- `src/product-system-v12.css` is the **canonical visual authority** for the signed-in learning product.
- `src/ui/LearningUI.tsx` is the shared primitive layer for shell, surfaces, buttons, progress, language pairs, choices, feedback and task rows.
- `src/live-voice-v11.css` remains only for Live Voice details that are genuinely route-specific; v12 is loaded after it and owns the final shared appearance.
- `src/product-system-v11.css` is historical and is not imported at runtime.

Do not add another global theme override. Extend v12 or add a narrowly scoped route stylesheet only when a route has unique mechanics that cannot live in the shared system.

## Visual semantics

- **Cobalt `#3561F5`:** primary learning action, active navigation, course progress and selected learning state.
- **Teal `#0CA59D`:** real listening, microphone and pronunciation feedback only.
- **Green `#1A9B55`:** verified completion or correct answer.
- **Amber `#E3A22C`:** achievement or memory emphasis.
- **Red `#D34F47`:** error, destructive action and incorrect answer.
- **Cool white/gray:** background and information surfaces.

Color communicates learning state; it is not decoration.

## Typography and bilingual rules

- Latin interface uses an Inter-compatible system stack.
- Arabic uses Tajawal / Noto Sans Arabic-compatible metrics with greater natural line-height.
- Arabic interface is RTL; English target phrases remain explicitly LTR.
- English target content is visually stronger than support-language content inside exercises.
- Arabic never receives uppercase transformation or Latin letter-spacing.

## Core learning flows

### Home — study-plan clarity

1. Compact English Twin brand header.
2. Learner greeting and CEFR state.
3. Honest weekly target from real completed lessons.
4. One Next recommendation only.
5. Target ↔ Support preview inside the recommendation.
6. Three compact Today actions.
7. Fixed five-item bottom navigation.

### Learn — course progression

1. Short page title.
2. A0/A1/A2/B1/B2 level switcher.
3. Compact level progress.
4. Unit rail with explicit sequence.
5. Complete / current / locked lesson states.
6. No fake XP, hearts or decorative gamification gates.

### Lesson — focused task flow

During an active lesson the global bottom navigation is hidden intentionally.

1. Exit control + step count.
2. Progress bar.
3. One activity surface.
4. Explicit English target and native-language support.
5. Tactile answer choices with idle / selected / correct / wrong states.
6. Feedback keeps layout stable.
7. Persistent bottom Check / Continue / Retry action.

### Review — FSRS memory

1. One due card at a time.
2. Recall before reveal.
3. Meaning/example after reveal.
4. Equal Again / Hard / Good / Easy controls.
5. No decorative memory score that competes with the recall task.

### Speak — guided output

1. Prompt.
2. English target phrase.
3. Listen control.
4. One obvious microphone action.
5. Transcript.
6. Accuracy and missing/extra words.
7. Retry or next prompt.

### Pronunciation — measurable feedback

1. Word or sentence target.
2. Stress/focus information.
3. Normal and slow playback.
4. Record.
5. Transcript and measured recognition accuracy.
6. Actionable feedback using teal only for actual speech state.

### Twin Coach — learning conversation

Simple conversation thread; no robot face, aura, glow or fake AI visualization. Learner messages use cobalt, Twin messages use white, corrections use a compact instructional surface, and the composer remains directly above navigation.

### Profile — study plan settings

Identity, language support and daily plan are grouped separately. Data deletion is visible but isolated from everyday learning settings.

## Control system

### Primary buttons

- ~48px minimum height
- cobalt fill
- white label
- 12px radius
- restrained tactile bottom edge that collapses on press
- one dominant primary action per learning view

### Secondary controls

White or soft semantic surface with a visible border. No arbitrary feature-specific styles.

### Choices

Answer controls share the same geometry across lesson and assessment contexts. The state model is always:

`idle → selected → correct | wrong`

### Navigation

Five equal icon + label targets. Active navigation uses cobalt and a compact active indicator. No floating dark slab and no unlabeled icon-only navigation.

## Anti-patterns

Never reintroduce:

- placeholder/cartoon tutor art
- generic robot or AI-personality illustration
- sparkles/glow as visual identity
- glassmorphism
- Swiss/editorial rails
- giant empty spacing
- floating percentages detached from context
- multiple competing primary CTAs
- inconsistent button geometry
- fake streaks, fake progress or fake speech metrics
- a new global CSS override stack

## Verification gate

Before design work merges:

1. Typecheck passes.
2. Unit tests pass.
3. Production build passes.
4. CodeQL passes.
5. Home, Learn, Lesson, Practice, Review, Speak, Pronunciation, Twin and Profile remain usable at 360px and 430px widths.
6. Arabic RTL and English LTR target content are preserved.
7. No rejected mascot asset is referenced.
8. Real product logic — Firebase, curriculum, FSRS, AI Twin, speech scoring and AudioWorklet/Worker — remains unchanged unless the task explicitly changes it.
