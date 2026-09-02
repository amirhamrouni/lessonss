# English Twin UI source notes

This file records external design/pattern references used while polishing English Twin. The product does **not** blindly copy third-party applications or ship their code unless explicitly noted.

## Canva visual direction

- Design: **English Twin Learn Journey Visual Direction**
- Purpose: mobile composition, hierarchy, spacing, milestone emphasis and bright educational color direction.
- Integration: translated into English Twin's own React/CSS components; Canva output is not embedded as a runtime dependency.

## GitHub learning-product references

### rihaans/Duolingo
- Public React/TypeScript language-learning clone used as a pattern reference for learning-path emphasis and gamified progression.
- We use the product pattern, not source-code copying.
- Repository: https://github.com/rihaans/Duolingo

### canvas-confetti pattern
- Reference pattern: short completion celebrations that do not interfere with learning flow.
- English Twin uses an internal CSS celebration instead of adding a runtime dependency.
- Reduced-motion preferences are respected.
- Repository: https://github.com/catdad/canvas-confetti

## Existing illustration source

See `docs/OPEN_SOURCE_ASSETS.md` for the verified unDraw SVG collection already used by English Twin.

## Implementation rule

External sources are used for interaction/design ideas only unless a compatible license and exact asset/source path have been verified. English Twin keeps its own brand, learner logic, Firebase ownership model, FSRS review system, voice pipeline and Twin memory model.
