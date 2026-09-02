# Open-source visual sources

English Twin uses open-source visual references and assets only where they improve the learning experience without changing product logic.

## unDraw SVG collection

Source: `balazser/undraw-svg-collection` on GitHub.

Repository README states the SVGs are sourced from unDraw and provided under the MIT License. English Twin currently references these SVGs in the visual layer:

- `svgs/online-learning.svg` — Learn / lesson headers
- `svgs/activity-tracker.svg` — Practice recommendation area
- `svgs/chatting.svg` — Guided Speech
- `svgs/about-me.svg` — Learner Profile

The application keeps Lucide React as the interactive icon system. The illustration layer is decorative (`pointer-events: none`) and is intentionally separate from Firebase, FSRS, speech, routing, and learner-state logic.

## Integration rules

- Decorative assets must never replace functional labels or controls.
- English learning targets remain English.
- RTL layout must move decorative art away from reading flow.
- Mobile art must stay compact and cannot cause text wrapping or overflow.
- Product behavior and learner data must remain unaffected by visual-only changes.
