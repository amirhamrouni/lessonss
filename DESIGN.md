---
version: alpha
name: "English Twin — Language Lab"
description: "A mobile-first adult language-learning product whose identity comes from bilingual signal rails, transcript geometry, and functional audio states rather than generic AI decoration."
colors:
  canvas: "#F4F7F8"
  surface: "#FFFFFF"
  surface-muted: "#E8EEF1"
  ink: "#132A36"
  ink-muted: "#5B6C74"
  line: "#B8C5CB"
  primary: "#2F5BFF"
  primary-strong: "#1739C7"
  voice: "#00A9A5"
  memory: "#F2B43A"
  success: "#2E7D5B"
  danger: "#D9574A"
  focus: "#2F5BFF"
typography:
  latin-display:
    fontFamily: "IBM Plex Sans, Segoe UI Variable Display, Segoe UI, system-ui, sans-serif"
  latin-body:
    fontFamily: "IBM Plex Sans, Segoe UI Variable Text, Segoe UI, system-ui, sans-serif"
  arabic:
    fontFamily: "Noto Sans Arabic, Noto Kufi Arabic, Tahoma, Arial, sans-serif"
  utility:
    fontFamily: "IBM Plex Mono, SFMono-Regular, Consolas, Liberation Mono, monospace"
rounded:
  DEFAULT: "0.5rem"
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
spacing:
  page-inline: "1.25rem"
  section-gap: "2rem"
  control-height: "3rem"
  dock-height: "4.25rem"
  content-max: "47.5rem"
components:
  twin-rail: { }
  button: { }
  bottom-nav: { }
  recommendation: { }
  lesson-row: { }
  progress-rail: { }
  audio-state: { }
---

# English Twin Design System

## Overview

### Creative North Star

English Twin should feel like a **modern language lab desk**: a learner is moving between two synchronized channels — the support language and the target English — while listening, repeating, reviewing and building sentences. The product borrows visual logic from subtitle timelines, transcript marks, phonetic workbooks and studio meters, not from AI dashboards or newspaper layouts.

### Product context and register

- **Audience and primary job:** adult and older-teen English learners, including Arabic-speaking beginners, who need one understandable next learning action rather than a dashboard of metrics.
- **Target market(s) and evidence:** multilingual consumer learning product; repository research establishes CEFR structure, Arabic RTL support, mobile primary navigation, FSRS review and dedicated speaking modes.
- **Locale(s) and language policy:** interface/support languages include Arabic, Dutch, French, German, Spanish and English. Arabic UI is RTL; target-language English content remains LTR inside lessons and practice.
- **Usage scene:** primarily phone, short repeat sessions, one-handed navigation, frequent mixed-script content, microphone and listening interactions.
- **Register:** product-first. Brand expression is concentrated in the shell, recommendation state and Twin Rail; lesson interactions stay quiet and predictable.
- **Memorable signature:** **Twin Rail** — two parallel signal tracks representing support-language guidance and English output. The rails appear as aligned paired strokes, split labels and progress markers across Home, Learn, Review and Speak. They are semantic, not decoration.
- **Restraint:** typography, controls, lesson responses, error states and long Arabic copy remain conventional, readable and stable.
- **Anti-references:** generic purple/blue AI gradient cards; glassmorphism; robot mascots; emoji decoration; cream-and-terracotta editorial templates; broadsheet/newspaper layouts; giant rounded SaaS cards; hidden icon columns; decorative waveforms that imply audio activity when none exists.
- **Token ownership/runtime mapping:** existing runtime CSS variables remain canonical (Model B). `DESIGN.md` mirrors approved values and rationale; `src/design-tokens.css` owns the runtime values consumed by the final application stylesheet and shared components.

## Colors

The palette comes from language-lab instrumentation rather than lifestyle branding. `canvas` is a cool neutral so Arabic and English text both remain crisp. `ink` is deep blue-green rather than black. `primary` cobalt marks the current learning action and navigation selection. `voice` teal is reserved for actual listening/recording/speaking state. `memory` amber marks recall/review state. `success` and `danger` are semantic only.

Do not use gradients for brand identity. Do not recolor entire cards by feature. Use color as a narrow signal: rail, status bar, focus ring, progress segment, active tab or one primary action.

## Typography

Latin display and body use an IBM Plex/Segoe system-capable stack to evoke language tooling without looking like a code editor. Arabic uses a dedicated Arabic-capable stack with increased line height. Utility metadata may use mono for CEFR labels, timers, percentages and transcription timestamps.

- Latin headings: 700–800 weight, compact but not hyper-compressed.
- Arabic headings: 700–800 weight, no negative tracking, line-height around 1.35–1.5 depending on size.
- Body: 16px minimum on mobile; Arabic body line-height approximately 1.75.
- English target phrases are explicitly `dir="ltr"` where mixed into RTL views.
- Do not uppercase Arabic labels or apply Latin tracking conventions to Arabic text.

## Layout

Mobile baseline: 360–430px. Content max: 760px. The page shell uses a stable full-width document flow and a fixed bottom navigation that respects safe-area insets.

The core layout device is the Twin Rail. On mobile it sits at the inline edge as two 2px parallel strokes separated by 4px; content begins after a fixed 14–18px rail gutter. Progress markers align to these rails. On wide screens the rail may become a narrow left/right metadata column, but text must never collapse into an artificially narrow lane.

Home order:
1. Brand/status line.
2. Learner greeting + one real daily meter.
3. One recommended next action anchored to Twin Rail.
4. Today plan as compact rows.

Learn uses numbered CEFR units and lesson rows attached to a progress rail. Practice uses a mode index, not large blank cards. Speak uses a real audio-state panel only when audio is available. Bottom navigation is a stable five-item dock with a narrow active signal bar, not a floating pill.

## Elevation & Depth

Hierarchy comes from tonal surfaces, rail position, border strength and spacing. Static content has no shadows. A modal or transient overlay may use one soft elevation layer. No glass blur, glow, halo, or colored shadow.

## Shapes

Default radius is 8px. Small controls may use 4px; major panels may use 12px only when the geometry needs separation. Pills are reserved for genuine compact statuses such as CEFR level or microphone state, never for every button or card.

The Twin Rail uses square line endings and small rectangular markers. Avoid ornamental circles unless the state itself is circular by meaning (for example, an audio record control).

## Components

### Foundational visual states

Every interactive control has default, hover, focus-visible, pressed, disabled and busy states. Focus uses a visible cobalt outline. Loading reserves final geometry; it does not replace whole screens with floating spinners. Reduced motion disables non-essential transitions.

### Buttons and actions

Primary: cobalt background, white text, 48px minimum height, 8px radius. Secondary: transparent surface with ink border. Ghost: text only for low-emphasis navigation. Voice actions use teal only while the function is explicitly audio-related. Danger uses red only for destructive/critical actions.

### Navigation and data display

Bottom navigation: five equal targets, 44px+ touch area, text labels always visible. Active state is a top signal bar plus stronger text, not an oversized dark tile. Progress bars are thin rails with explicit numeric text nearby so color is not the only signal.

### Forms and overlays

Fields use stable labels, visible focus and inline errors. Product forms own validation. Overlays stay within the visual viewport and restore focus. Long Arabic strings must wrap naturally without shrinking to unreadable sizes.

### Iconography

Icons are functional only. Use one consistent outlined family at 18–20px. Never hide icons globally with CSS while leaving layout columns behind. If an icon is removed, remove its geometry from component markup or layout. Important navigation/action icons keep visible text labels.

### Motion

120–180ms transitions for state changes, progress and pressed feedback. Audio visual motion is permitted only when driven by real microphone/playback data. No ambient floating animation, sparkles or confetti by default.

### Content and data visualization

Copy is direct and learner-centered. Home answers: "What should I do now?" Learn answers: "Where am I in the course?" Practice answers: "What skill am I training?" Speak answers: "What is the microphone doing?" Empty and error states explain the next action.

## Do's and Don'ts

- **Do:** make the support-language and English relationship visible through Twin Rail structure and mixed-script direction rules.
- **Do:** reuse cobalt, teal and amber as narrow semantic signals rather than flooding surfaces.
- **Do:** keep Home focused on one recommendation and one honest daily meter.
- **Don't:** return to cream editorial/newspaper styling; it is not specific to language learning and reads as a current AI-design default.
- **Don't:** use purple gradient cards, glass effects, fake AI glow, robot art, emoji decoration, or giant rounded containers.
- **Don't:** hide icon libraries globally as a visual fix; refactor the layout owner instead.
