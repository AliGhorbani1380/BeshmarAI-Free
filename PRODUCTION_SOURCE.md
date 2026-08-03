# Production source lineage

The refreshed public application is based on the production UI lineage identified from the private GitHub repository while retaining the sanitized, public-only runtime and chunked model architecture.

- Private repository: `AliGhorbani1380/beshmarai-platform`
- Successful production workflow run: `30628852003`
- Workflow: `Deploy BeshmarAI public site`
- Production commit: `e5b25d299390f67ab802da272f8cd23a148c771a`
- Production app root: `apps/web`
- Package: `beshmaraiweb`

The public repository does **not** import private Git history, credentials, backend code, database code, OTP, payment, administration, or private telemetry. The public application adds a visible CPU/GPU strategy selector and bilingual English/Persian presentation while preserving the validated public model package and safe runtime fallbacks.
