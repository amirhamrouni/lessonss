---
version: alpha
name: "English Twin — Reference UI"
description: "The approved mobile-first English Twin interface: bright white learning surfaces, cobalt primary actions, soft blue hierarchy, teal speech feedback, rounded cards and clear bilingual Arabic/English composition."
colors:
  canvas: "#F7F8FC"
  surface: "#FFFFFF"
  surface-muted: "#F1F3F9"
  surface-blue: "#EEF3FF"
  ink: "#14213D"
  ink-muted: "#6B7280"
  line: "#E2E6EF"
  primary: "#2F5BFF"
  primary-strong: "#2149DF"
  voice: "#00A9A5"
  memory: "#F2B43A"
  success: "#16A34A"
  danger: "#E04436"
  focus: "#2F5BFF"
typography:
  latin:
    fontFamily: "Inter, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
  arabic:
    fontFamily: "Tajawal, Noto Sans Arabic, Tahoma, Arial, sans-serif"
  utility:
    fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace"
rounded:
  DEFAULT: "0.75rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.35rem"
  xl: "1.75rem"
spacing:
  page-inline: "1.125rem"
  section-gap: "1.5rem"
  control-height: "3.25rem"
  dock-height: "4.65rem"
  content-max: "32.5rem"
components:
  button:
    radius: "0.75rem"
  card:
    radius: "1.35rem"
  bottom-nav:
    height: "4.65rem"
  progress:
    height: "0.4375rem"
---

# English Twin Design System

## Overview

### Creative North Star

The owner-approved multi-screen mockup is the visual source of truth. English Twin should look like a polished consumer language-learning application: bright, friendly, highly legible and immediately understandable on a phone. It is not a newspaper/editorial interface, an AI dashboard, or a developer tool.

### Product context and register

- **Audience:** adult and older-teen English learners, including Arabic-speaking beginners.
- **Primary job:** make the next learning action obvious, then keep the learner inside a consistent Learn → Lesson → Review → Speak loop.
- **Locales:** Arabic, Dutch, French, German, Spanish and English support. Arabic UI is RTL; English target phrases remain LTR.
- **Register:** consumer learning product with restrained brand expression.
- **Approved signature:** white rounded learning cards, cobalt primary action, soft blue active states, teal real speech feedback, small warm achievement accents, and a stable five-item icon + label bottom navigation.
- **Anti-references:** Swiss/broadsheet layouts, cream editorial themes, empty whitespace as decoration, floating percentage blocks, arbitrary vertical rails, glassmorphism, fake AI glow, inconsistent button shapes, and oversized dark navigation tiles.
- **Runtime ownership:** `src/design-tokens.css` is canonical. `src/language-lab-system.css` is the final visual authority layer. This file mirrors those accepted runtime values.

## Colors

Use white cards on the very light cool canvas. Cobalt is the main learning/action color. Teal is reserved for actual listening/speaking feedback. Green means verified success, amber is memory/achievement, and red is error/destructive feedback. Light blue supports active learning surfaces. Gradients are allowed only in the main branded lesson/recommendation hero and must stay within the cobalt family.

## Typography

Use a contemporary sans-serif feel matching the approved mockup. Latin uses Inter-compatible metrics. Arabic uses Tajawal/Noto Sans Arabic-compatible metrics with greater line-height. Heading weight is 700–800; body is 400–600. English target text inside RTL pages is explicitly LTR. Arabic never receives Latin letter-spacing or uppercase transformations.

## Layout

Primary baseline is 360–430px phone width, with a 520px maximum application column. Page padding is approximately 14–18px on phones. Content is grouped into purposeful rounded cards rather than large empty regions.

Home hierarchy:
1. Compact English Twin brand header + profile control.
2. Learner greeting card.
3. Honest weekly learning progress.
4. One strong cobalt recommendation card with one primary action.
5. Compact Today task list.
6. Fixed five-item bottom navigation.

Learn hierarchy:
1. Short title.
2. A0/A1/A2/B1/B2 CEFR tabs.
3. Compact level progress card.
4. Vertical numbered unit/lesson path with complete/current/locked states.

Lesson hierarchy:
1. Exit/back control + honest step counter.
2. Thin cobalt progress bar.
3. One main activity card.
4. English target prominent, native-language support secondary.
5. One clear primary action at the bottom of the activity.

Speak hierarchy follows the same shell but uses teal for real speech/pronunciation feedback.

## Elevation & Depth

Cards use a soft, low-opacity shadow only to separate white surfaces from the cool canvas. The branded hero may use a slightly stronger cobalt shadow. No glow, glass blur, or decorative shadow effects.

## Shapes

Cards are intentionally rounded as in the approved reference: roughly 16–22px. Controls use 10–14px. Avatar/audio controls may be circular when their function benefits from it. Pills are for compact metadata only.

## Components

### Foundational visual states

Every interactive control requires default, focus-visible, pressed, disabled and busy behavior. Selected answers and active CEFR tabs use soft/cobalt states. Success and error feedback preserve layout rather than replacing the screen.

### Buttons and actions

Primary buttons: cobalt fill, white text, ~52px height, 12px radius. Secondary: white or soft-blue surface with cobalt text/border. Low-emphasis text actions have no filled container. Within a screen there is normally one dominant primary action.

### Navigation and data display

Bottom navigation has five equal targets with functional outline icons plus visible text labels. The active item is cobalt with a small active dot; it is not a dark rectangular tile. Progress bars are 6–8px rounded rails and include numeric context nearby.

### Forms and overlays

Fields use white/light-neutral surfaces, 10–12px radius, visible labels and inline error states. Overlays remain accessible within the visual viewport and restore focus.

### Iconography

Use the existing Lucide outline family consistently. Icons are functional, generally 18–20px. Do not globally hide icon libraries. Text remains visible for main navigation and primary actions.

### Motion

Use short 120–180ms pressed/selection transitions. Real audio may animate from actual input/playback data. Respect reduced-motion preferences.

### Content and data visualization

Home answers “What do I do next?”. Learn answers “Where am I in the course?”. Review answers “What is due now?”. Speak answers “What did I say and how can I improve it?”. No fake progress, fake streaks or fake AI insight.

## Do's and Don'ts

- **Do:** follow the approved reference composition before inventing new UI patterns.
- **Do:** keep Arabic support visually secondary to English targets inside exercises.
- **Do:** reuse the same card, button, progress, spacing and navigation grammar across every route.
- **Do:** use real saved progress and FSRS/speech data in visual indicators.
- **Don't:** reintroduce Swiss/editorial rails, giant whitespace or floating metric typography.
- **Don't:** make every card a different style or every feature a different color.
- **Don't:** use generic AI gradients, glassmorphism, decorative sparkles or non-functional waveforms.
