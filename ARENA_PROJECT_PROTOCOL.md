# ARENA_PROJECT_PROTOCOL.md

## Arena Rules For This Project

- Do not treat `150 lines` or `12 KB` as hard architecture laws. They are transfer/readability safeguards for LM Arena, not design rules.
- Write clean, logical modules first. Split files when a file has multiple responsibilities, becomes hard to review, or risks Arena truncation.
- Prefer small UI components, but do not create artificial fragmentation that makes the project harder to maintain.
- For transfer to a new Arena chat, prepare large files through summaries or a text mirror if exact restoration is needed.
- Avoid large JSX files with long Cyrillic prose. Put long texts and poetry data into `src/data/`.
- Poet data must stay modular in `src/data/library/*.ts`; do not rebuild one huge `poets.ts` file.
- New poets must be added as separate files in `src/data/library/` and exported through `src/data/library/index.ts`.
- Do not use emoji in UI. Use SVG icons via Lucide or custom SVG.
- Do not use weak placeholder 3D sections. Remove unfinished gimmicks rather than shipping them.
- Always run `build_project` before final response.

## Arena Sandbox browser fallback (optional)

For browser QA in a restricted **Arena Sandbox** (not standard local development or GitHub Actions), Chromium 153.0.8010.0 was verified on Debian 12/x86_64 using `@sparticuz/chromium@153.0.0` and Playwright:

```bash
npm install --prefix /tmp/arena-browser --no-audit --no-fund @sparticuz/chromium@153.0.0 playwright@1.64.1
```

Call `Chromium.executablePath()`. If the sandbox lacks NSS libraries, Brotli-decompress `@sparticuz/chromium/bin/al2023.tar.br`, extract the tar into `/tmp/arena-browser/libs`, and prepend `/tmp/arena-browser/libs/lib` to `LD_LIBRARY_PATH` without discarding its prior value. Launch Playwright using the returned `executablePath`, `headless: true`, and `args: ['--no-sandbox', '--disable-dev-shm-usage']`. Do not pass all of `Chromium.args`: it contains `--disable-web-security`. NSS patches and `LD_PRELOAD` were not needed in the verified setup.

Treat `/tmp` as ephemeral; run a launch-and-page smoke test. A blocked Playwright CDN is not evidence that browser QA is impossible. Log narrowly scoped network stubs; never silently stub all external requests. Chromium does not replace WebKit, Firefox or physical-device testing. Other working methods are welcome.

## Design Rules

- Dark luxury first.
- Brand title cyan-blue neon.
- Gold is secondary and restrained.
- Avoid clutter: no unnecessary chips, badges, labels, or weak decorative modules in hero.
- Motion must support hierarchy, not distract.
- If a feature does not meet the requested visual standard, remove it instead of leaving a weak prototype visible.

## Editorial Rules

- Poetry texts must be verified from reliable sources before use.
- Christian analysis must follow `src/docs/THEOLOGICAL_GUIDELINES.md`.
- Never invent poems, biographies, or spiritual claims.

## Package Rules

- Do not manually edit `package.json` in Arena.
- If dependencies must be removed, do it outside Arena or with an approved package command.

## Transfer Packaging Rules

- Original source files may exceed 150 lines when justified.
- If a file exceeds about 150 lines or 12 KB and must be copied into a future chat, export it in chunks or a TEXT_MIRROR format.
- The preferred long-term solution is modular source code plus a transfer mirror, not distorted source code.
- Current known large-ish files are individual poet modules and `src/index.css`; split only when responsibility or transfer safety requires it.
- Community rating/review logic is split into hooks, utils, and small components. Keep it modular.