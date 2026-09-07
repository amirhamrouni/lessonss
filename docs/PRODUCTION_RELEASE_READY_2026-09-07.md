# English Twin — Production Release Ready

**Status:** Production Release Ready  
**Declaration date:** 2026-09-07  
**Release baseline:** `f39d549cac4d703d03b8158d84257e6d27f8bbff`  
**Repository:** `amirhamrouni/lessonss`

## Official release decision

English Twin is formally declared **Production Release Ready** for publication from the release baseline above.

At the time of this declaration, there are **no known release-blocking issues** in the verified release path.

## Release-readiness evidence

The release decision is based on the following completed controls and owner verification:

- English Twin CI passed on the release baseline, including locked dependency installation, type checking, unit tests, production build, and production dependency audit.
- CodeQL security scanning passed for the release baseline.
- The production deployment pipeline is configured to require the verified CI result and matching CodeQL success for the exact deployment SHA.
- GitHub Actions used in the release path are pinned to exact commit SHAs.
- The npm dependency graph is locked with `package-lock.json`, and CI/deployment use deterministic `npm ci` installs.
- Production dependency auditing blocks High/Critical dependency vulnerabilities from passing the release gate.
- The Vercel CLI version used by the production deployment workflow is pinned rather than floating on `latest`.
- Dependabot is configured for controlled dependency maintenance, with automatic major-version upgrades excluded from the normal update policy.
- Production response hardening includes HSTS, MIME sniffing protection, frame denial, referrer policy, permissions policy, and `no-store` handling for API responses.
- Firestore access remains owner-scoped, and protected AI endpoints require authenticated Firebase identity with quota/abuse controls.
- Account deletion, privacy handling, microphone consent, learner-memory behavior, FSRS review behavior, and existing English Twin product functionality remain preserved.

## Owner-confirmed infrastructure checks

Amir confirmed on 2026-09-07 that:

- Branch Protection is enabled for the protected release flow.
- Required status checks include CI and CodeQL before merge.
- Branches must be up to date before merge.
- The Vercel production deployment was verified successfully.
- `/api/health` was verified successfully in production.
- Persistent quota protection is healthy and operating correctly.

These owner-confirmed infrastructure checks remove the final previously identified release blockers.

## Release interpretation

`Production Release Ready` means the current release baseline has passed the defined engineering, security, build, deployment, and production-readiness gates and is approved for publication.

It does **not** mean that future defects are impossible. Any later production candidate must pass the same required CI, security, deployment, and runtime-health gates before it replaces this baseline.

## Post-release rule

Every subsequent production release must continue to satisfy, at minimum:

1. Required CI success.
2. Required CodeQL success.
3. Up-to-date protected branch requirements.
4. Deterministic dependency installation and production dependency audit.
5. Successful production build/deployment for the exact verified SHA.
6. Healthy production runtime and quota/auth controls.

---

**Release authority:** Amir Hamrouni  
**Engineering status:** Production Release Ready  
**Baseline:** `f39d549cac4d703d03b8158d84257e6d27f8bbff`
