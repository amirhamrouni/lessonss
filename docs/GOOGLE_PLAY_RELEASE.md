# English Twin — Google Play release gate

## Android packaging decision
English Twin uses a Trusted Web Activity (TWA) wrapper around the production PWA rather than an embedded arbitrary WebView. This preserves the production web runtime, Firebase web authentication, microphone/browser permission model and fast rollback path while producing a real Android App Bundle.

- Application ID: `com.amirhamrouni.englishtwin`
- Production origin: `https://english-twin-native-preview.vercel.app`
- minSdk: 23
- compileSdk / targetSdk: 36
- Android Gradle Plugin: 8.13.2
- Gradle: 8.13
- JDK: 17

Google Play requires new mobile apps and updates submitted after 31 August 2026 to target Android 16 / API 36 or higher, so the project intentionally targets API 36.

## Automated build
`.github/workflows/android-release.yml` runs Android lint and `bundleRelease`. Without signing secrets it produces an unsigned QA bundle. With the four upload-key secrets it produces the Play upload bundle:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The keystore itself must never be committed.

## One-time Play Console steps that cannot be inferred from source code
1. Create the Play Console application using package `com.amirhamrouni.englishtwin`.
2. Enable Google Play App Signing.
3. Copy the **App signing certificate SHA-256 fingerprint** from Play Console.
4. Copy `docs/assetlinks.template.json` to `public/.well-known/assetlinks.json`, replace the placeholder with that fingerprint, deploy the website, and verify `https://english-twin-native-preview.vercel.app/.well-known/assetlinks.json` returns HTTP 200.
5. Configure the four GitHub upload-key secrets and rerun `Android Play Bundle`.
6. Upload the resulting signed `.aab` to Internal testing first.
7. Install from the Play internal-test link on a physical Android device and run the QA matrix before production rollout.

The app-signing fingerprint is assigned by Google Play and therefore cannot be correctly hard-coded before the Play application exists.

## Play Console declarations — draft based on current app behavior
Confirm these against the final Play Console questionnaire before submission.

### Data used by the app
- Account/authentication identifiers through Firebase Authentication.
- Learning profile, lesson progress, review state, mistakes and CEFR skill evidence in Firestore.
- Optional writing drafts and assessment attempts.
- Optional speech transcripts / writing responses sent to the configured AI service for tutoring or structured evaluation.
- Microphone access occurs only when the learner starts speaking/live-practice features; the TWA/browser owns the runtime permission prompt.

### Security / controls
- HTTPS only.
- Owner-scoped Firebase data.
- Account/data deletion is available from the app profile.
- AI endpoints require Firebase authentication and quota protection.
- No Android cleartext traffic.

## Store listing draft
**Title:** English Twin

**Short description:** Adaptive English lessons, speaking practice and an AI coach from A0 to C1.

**Full-description positioning:** English Twin combines structured CEFR-aligned learning paths, intelligent review, speaking/pronunciation practice, advanced B1-C1 reading and writing tasks, and an adaptive AI Twin coach. Do not describe the app as issuing an official CEFR certificate; use `CEFR-aligned` and `Estimated CEFR profile`.

## Release blockers
The source tree is Play-build capable once the Android workflow passes. A public release remains blocked until:
- Play App Signing SHA-256 is published in Digital Asset Links.
- Upload signing secrets are configured and a signed AAB is produced.
- Internal-test install passes the physical-device QA matrix.
- Play Data Safety, App access, Content rating and Privacy Policy forms are completed in Play Console.
