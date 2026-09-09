# English Twin — physical Android release QA

Run this matrix from a Google Play Internal testing install, not a browser shortcut.

## Install / shell
- App installs and launches from Play.
- No browser chrome is visible after Digital Asset Links verification.
- Deep link to `/learn`, `/checkpoint`, and one B1 lesson returns to the installed app.
- Android back navigation behaves predictably.
- 360px and large-screen layouts remain usable.

## Authentication
- Email sign-in / sign-out.
- Google sign-in and return to English Twin.
- Existing learner resumes without onboarding reset.
- New learner completes onboarding and placement.

## Curriculum progression
- A0 foundation remains available for beginners.
- A1 and A2 historical progress remains intact.
- B1, B2 and C1 tabs/routes open when enabled.
- One B1, B2 and C1 lesson can be completed and restored after relaunch.
- Level checkpoint writes evidence without corrupting legacy progress.

## Advanced learning
- Critical reading renders long source text without horizontal overflow.
- Writing draft autosaves, survives process/app restart and can be submitted.
- Paragraph synthesis accepts multiple source references.
- Structured evaluation returns validated dimensions and deterministic aggregate.
- Failure/retry states preserve learner text.

## Voice
- Pronunciation starts only after learner action.
- Microphone permission denial has a recoverable state.
- Live speaking connects, produces audio and closes cleanly.
- Speech transcript is not presented as acoustic/prosody evidence when only text is available.

## AI Twin
- Twin receives current level/Can-Do context.
- Tutor reply is preserved if optional memory persistence fails.
- Quota/rate-limit errors are recoverable and do not duplicate learner messages.

## Privacy / deletion
- Privacy page is reachable before sensitive practice.
- Delete-account flow removes advanced attempts, writing responses, evaluations and learning state documented by the product.
- Sign-out returns to auth gateway.

## Network resilience
- Launch on slow network.
- Lose network during lesson load.
- Lose network during draft autosave.
- Lose network during AI evaluation.
- Restore network and retry without duplicate completion or lost draft.

## Release acceptance
No P0/P1 issue may remain. Any authentication, data-loss, microphone, account-deletion, broken progression, or crash issue is a release blocker.
