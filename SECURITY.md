# Security Policy

## Supported scope

Security fixes are handled against the current `main` branch. Historical branches, preview snapshots and retired prototypes are not supported release lines. A historical credential exposure still requires provider-side revocation or rotation.

Security-sensitive areas include:
- GitHub Actions, dependency updates and release workflows;
- credentials used by the Cloudflare community Worker, Turnstile and D1;
- reader comments, ratings, moderation and other community data boundaries;
- publication, indexing and protected editorial content.

## Reporting a vulnerability

Do not publish exploitable details, credentials, access tokens, private URLs or proof-of-concept payloads in public issues, pull requests or discussions.

Use GitHub's private vulnerability reporting from the repository Security tab when it is enabled. If private reporting is unavailable, contact the repository maintainer through a private channel before public disclosure. Include the affected component, impact, the smallest reproducible description and the affected commit, but never include a live secret value.

## Credentials and exposure response

Never commit API keys, OAuth tokens, HMAC secrets, Turnstile secrets, database credentials, session tokens, private keys or production environment files.

When a credential may have been exposed:
1. identify its type and provider without copying the value into the report;
2. revoke or rotate it at the provider;
3. verify the replacement through the existing owner-controlled operational process;
4. remove the exposed value from reachable Git history where appropriate, but do not treat history rewriting as revocation.

## Automated controls

- Gitleaks scans the full Git history on pull requests, pushes to `main`, and a weekly schedule.
- Dependabot monitors npm dependencies and GitHub Actions. It opens reviewable pull requests; dependency updates are not configured for automatic merging.
- GitHub Actions must remain pinned to full immutable commit SHAs and use explicit least-privilege permissions.

## Responsible testing

Test only systems, accounts and data that you are authorized to access. Do not use exposed credentials, access another person's data, perform destructive provider operations or run denial-of-service tests. Live production mutation requires separate, explicit owner authorization for the exact operation.
