# English Twin — Google Play release gate

## Current Android architecture
English Twin 1.1.4 uses a native Android `ComponentActivity` with a hardened WebView shell for the production web app, plus Android Credential Manager for Google Sign-In. The former Trusted Web Activity path is retired and must not be reintroduced unless a new architecture decision explicitly replaces the verified baseline.

- Application ID: `com.amirhamrouni.englishtwin`
- Production origin: `https://english-twin-native-preview.vercel.app`
- Native Google auth: Android Credential Manager -> Google ID token -> Firebase `signInWithCredential`
- minSdk: 23
- compileSdk / targetSdk: 36
- Android Gradle Plugin: 8.13.2
- Gradle: 8.13
- JDK: 17

Google Sign-In has been verified on a physical Android device with version 1.1.4 after registering the Android OAuth client for the debug signing certificate.

## ECC-style release policy
The release path is fail-closed. A release is not considered Play-ready because an AAB merely exists.

The gate is:

`Plan -> Preflight -> Lint -> Build -> Signature verification -> Artifact classification -> Physical-device verification -> Release`

The workflow fails when critical architecture markers drift, legacy TWA code returns, the Web OAuth client is invalid, or Android signing secrets are only partially configured.

## Automated build
`.github/workflows/android-release.yml` now performs:

1. Architecture preflight for package, API level, HTTPS-only manifest, Credential Manager bridge, production host, and absence of the retired TWA path.
2. Validation of the Web OAuth client ID used by Credential Manager.
3. Strict all-or-none validation of Android upload-signing secrets.
4. Android release lint.
5. Debug APK build and `apksigner --print-certs` verification so the actual SHA-1/SHA-256 certificate is visible in CI.
6. Release AAB build.
7. `jarsigner -verify -strict` when a signed release AAB is produced.
8. Different artifact names for signed Play AABs and unsigned QA AABs so an unsigned bundle cannot be mistaken for a Play-ready build.

Required upload-key secrets for a Play-ready bundle:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

The upload keystore must never be committed.

## Google OAuth / Firebase signing model
There are separate signing identities that must not be mixed:

### Local / GitHub debug APK
The installed QA APK is signed by the Android debug key. Its SHA-1 must have a corresponding Android OAuth client for package `com.amirhamrouni.englishtwin` if Google Sign-In is tested with that build.

### Upload key
The AAB uploaded to Play is signed with the developer upload key. This proves upload ownership but is not the certificate users receive after Play App Signing.

### Google Play App Signing key
For Play-distributed installs, Google Play signs the delivered APKs with the **App signing certificate**. Its SHA-1 must be registered for Android Google Sign-In, and its SHA-256 is the certificate fingerprint used for any Digital Asset Links configuration that depends on the Play-distributed identity.

Do not reuse the debug SHA as the Play signing SHA.

## One-time Play Console steps
1. Create the Play Console application using package `com.amirhamrouni.englishtwin`.
2. Enable Google Play App Signing.
3. In **Setup -> App integrity**, copy both the App signing certificate SHA-1 and SHA-256 fingerprints.
4. Add the Play App Signing SHA-1 to the Android OAuth/Firebase configuration for `com.amirhamrouni.englishtwin`.
5. If Digital Asset Links are used for verified app links, publish the Play App Signing SHA-256 in `public/.well-known/assetlinks.json`, deploy, and verify the file returns HTTP 200.
6. Configure all four GitHub upload-signing secrets and rerun `Android Play Bundle`.
7. Confirm the workflow uploads an artifact named `english-twin-play-signed-aab-*`, not `english-twin-qa-unsigned-aab-*`.
8. Upload the signed AAB to Play Internal testing first.
9. Install from the Play internal-test link on a physical Android device and run the QA matrix below.

## Physical-device QA matrix
A Play candidate is blocked until all of these pass on a Play-installed build:

- App launches without crash or cache-reset dialog.
- Existing Firebase session restores after closing/reopening the app.
- Google Sign-In opens the native account selector and completes successfully.
- Email/password sign-in and password reset still work.
- First-time Google user reaches onboarding/profile creation correctly.
- Returning user reaches the saved learner state without profile duplication.
- External links open outside the WebView; English Twin links remain inside the app.
- Microphone permission is requested only when a speaking feature starts.
- Camera permission is requested only when a camera-dependent feature starts.
- Denying microphone/camera does not crash the app.
- Back navigation behaves correctly.
- No cleartext HTTP request is allowed.
- Sign-out followed by Google Sign-In works again.

## Play Console declarations — draft based on current behavior
Confirm these against the final Play Console questionnaire before submission.

### Data used by the app
- Account/authentication identifiers through Firebase Authentication.
- Learning profile, lesson progress, review state, mistakes and CEFR skill evidence in Firestore.
- Optional writing drafts and assessment attempts.
- Optional speech transcripts / writing responses sent to the configured AI service for tutoring or structured evaluation.
- Microphone access occurs only when the learner starts speaking/live-practice features.
- Camera access is optional and only used by camera-dependent learning features.

### Security / controls
- HTTPS only.
- Owner-scoped Firebase data.
- Account/data deletion is available from the app profile.
- AI endpoints require Firebase authentication and quota protection.
- Android cleartext traffic is disabled.
- Google Sign-In uses Android Credential Manager rather than a WebView OAuth redirect.

## Store listing draft
**Title:** English Twin

**Short description:** Adaptive English lessons, speaking practice and an AI coach from A0 to C1.

**Full-description positioning:** English Twin combines structured CEFR-aligned learning paths, intelligent review, speaking/pronunciation practice, advanced B1-C1 reading and writing tasks, and an adaptive AI Twin coach. Do not describe the app as issuing an official CEFR certificate; use `CEFR-aligned` and `Estimated CEFR profile`.

## Remaining release blockers
The verified 1.1.4 debug baseline is functional, including native Google Sign-In. Public release is still blocked until:

- Upload signing secrets are configured and CI produces `english-twin-play-signed-aab-*`.
- The Google Play App Signing SHA-1 is registered for Android Google Sign-In.
- Play Internal testing passes the physical-device QA matrix.
- Play Data Safety, App access, Content rating and Privacy Policy forms are completed.
