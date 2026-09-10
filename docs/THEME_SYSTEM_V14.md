# English Twin Theme System v14

The approved visual concept is implemented as five real runtime themes, not as marketing artwork.

Themes:
- Minimal — clean white/blue learning UI.
- Nature — green calm learning UI.
- Neon — dark violet/cyan high-contrast UI.
- Cozy — warm cream/orange UI.
- Royal — dark navy/gold premium UI.

The theme chooser is mounted by `LearningShell`, so it is available throughout the authenticated learning experience. Selection is persisted under `english-twin-theme-v1` and restored before React renders to avoid a visible flash to the default theme.

This changes presentation only. Curriculum, progress, Firebase, FSRS, assessment, AI Twin, lesson IDs and CEFR logic remain unchanged.
