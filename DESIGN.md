---
version: v11
name: "English Twin — Product UI"
description: "A compact mobile language-learning product built around a bilingual target/support relationship, cobalt learning actions, teal speech feedback, structured progress and source-informed interaction patterns."
colors:
  canvas: "#F6F8FC"
  surface: "#FFFFFF"
  surface-soft: "#F0F4FF"
  ink: "#15213A"
  ink-muted: "#748096"
  line: "#E4E9F1"
  primary: "#2F5BFF"
  primary-strong: "#2048DF"
  voice: "#06A7A1"
  success: "#16A34A"
  warning: "#E9A72F"
  danger: "#D94A43"
typography:
  latin: "Inter, Segoe UI Variable, Segoe UI, system-ui, sans-serif"
  arabic: "Tajawal, Noto Sans Arabic, Tahoma, Inter, sans-serif"
layout:
  phone-max: "430px"
  page-inline: "16px"
  bottom-nav: "66px"
  primary-control: "48px"
---

# English Twin Design System

## Product direction

English Twin is a **mobile language-learning product**, not an AI dashboard and not a decorative editorial concept. The UI must make the learner's next action obvious, keep course progress understandable, and make speaking feedback feel concrete.

The distinctive product idea is **Target ↔ Support**: English is always the target language; the learner's preferred language is the support layer. The visual identity expresses that relationship through paired language surfaces, not a mascot or generic AI imagery.

## Source-informed foundations

The v11 interaction system deliberately studies permissively licensed open-source patterns instead of inventing every behavior from scratch:

- **pablocaeg/polyglot — MIT:** semantic theme-token thinking, compact mobile bottom navigation, visible active rail, dense learning cards.
- **sanidhyy/duolingo-clone — MIT:** lesson challenge state model, explicit answer states, progress + persistent primary action logic.
- **shadcn/ui:** open-code component philosophy and predictable control composition. No shadcn visual template is copied into the product.

Required license notices for substantial adapted patterns live in `THIRD_PARTY_NOTICES.md`.

## Runtime authority

- `src/design-tokens.css` contains cross-product semantic variables used by older screens.
- `src/product-system-v11.css` is the **canonical current product visual layer**.
- `src/live-voice-v11.css` contains only Live Voice route-specific composition.
- Old experimental theme layers are intentionally **not imported** by `src/main.tsx`.

Do not add another global theme override file. Extend the canonical system or add a narrowly scoped route file only when the route has genuinely unique layout needs.

## Brand

The product mark is image-free and built from two overlapping vertical forms representing the learner's support language and the English target. It must remain recognizable at 24–32px and must not depend on a character illustration.

No mascot is required for the product to feel friendly. If character art is introduced later, it must be an approved asset with consistent art direction and licensing; placeholder SVG people are prohibited.

## Color semantics

- **Cobalt `#2F5BFF`:** learning progress, primary actions, current lesson, active navigation.
- **Teal `#06A7A1`:** real listening/speaking/pronunciation states only.
- **Green `#16A34A`:** verified success/completion.
- **Amber `#E9A72F`:** achievement/memory emphasis.
- **Red `#D94A43`:** destructive/error states.
- **Cool white/gray:** canvas and information surfaces.

Do not give every feature its own color. Color communicates state, not decoration.

## Typography and bilingual rules

- Latin interface: Inter-compatible system stack.
- Arabic interface: Tajawal/Noto Sans Arabic-compatible stack.
- Arabic UI uses RTL, but English target phrases stay explicitly LTR.
- Target English text is visually stronger than translated support text inside lessons.
- Arabic never receives uppercase or artificial Latin letter spacing.

## Layout grammar

### Home

1. Compact image-free brand header + profile entry.
2. Learner greeting + current CEFR level.
3. Honest weekly progress.
4. One primary **Next** card.
5. The Next card contains a real Target ↔ Support language sample instead of mascot art.
6. Three compact Today tasks.
7. Five-item fixed bottom navigation.

### Learn

1. Short title.
2. A0/A1/A2/B1/B2 tabs.
3. Compact progress summary.
4. Vertical unit rail.
5. Complete/current/locked lesson cards with one consistent geometry.

### Lesson

1. Exit/back + step context.
2. Thin progress rail.
3. One focused activity surface.
4. Target English prominent; native support secondary.
5. Explicit selectable states.
6. One dominant primary action.

### Review

One card at a time. Reveal before rating. FSRS ratings use compact equal controls and never dominate the screen with decorative metrics.

### Speak / Pronunciation

Target phrase first, clear listen controls, one obvious recording action, transcript, then measured feedback. Teal is used only where the interface is representing real audio/speech state.

### AI Twin Chat

Simple conversation thread. Learner messages use cobalt; Twin messages use white. Memory/context is a compact optional strip. Composer stays directly above bottom navigation.

### Profile

Settings are grouped by Identity, Languages and Plan. Data-control actions are visible but visually separated from everyday settings.

## Control system

### Primary

- height: ~48px
- cobalt fill
- white label
- 12px radius
- one dominant primary action per view

### Secondary

White or soft neutral surface, visible border, brand-colored text where appropriate.

### Navigation

Bottom navigation follows the compact open-source pattern of icon + text + clear active rail/state. No oversized floating dark slab.

### Cards

Cards are functional groupings, not decoration. Typical radius 11–16px, light border, restrained shadow. The main Next card may use a cobalt gradient because it is the single branded focal surface.

## Interaction states

Every interactive control requires:

- default
- hover where relevant
- pressed
- focus-visible
- disabled
- busy when async
- selected where applicable
- correct/wrong where applicable

State changes should preserve the layout instead of making components jump.

## Anti-patterns

Do not reintroduce:

- placeholder/cartoon tutor art
- generic AI robot imagery
- sparkles/glow as decoration
- glassmorphism
- giant empty spacing
- floating percentage typography
- multiple competing primary buttons
- different button geometry per screen
- Swiss/editorial rails
- another global CSS override stack
- fake streaks, fake progress, fake speech metrics

## Verification

Before visual work can merge:

1. Typecheck passes.
2. Unit tests pass.
3. Production build passes.
4. CodeQL passes.
5. Home, Learn, Lesson, Practice, Speak, Review, Twin Chat and Profile remain usable at 360px and 430px widths.
6. Arabic RTL and English LTR target content are both checked.
7. No rejected mascot asset is referenced.
