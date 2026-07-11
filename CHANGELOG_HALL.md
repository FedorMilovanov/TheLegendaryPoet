# Hall of Poets — Changelog

## v1.2 — 11.07.2026 — "Reference Match + FPS Walk"
- Зал приведён к референсу `reference/hall_target_v2.jpg`
  - Nero Marquina пол — mirror 0.82, roughness 0.06
  - Мраморные пьедесталы с гравировкой имени/лет/цитаты
  - Циановые uplights под каждой нишей
  - End-wall «ВЕЛИКИЕ РУССКИЕ ПОЭТЫ»
  - Золочёные рамы, двойной молдинг
  - Колонны-пилястры между нишами
  - Oculus с латунным кольцом
- **FPS Walk mode**: F — toggle Rail / FPS
  - WASD + мышь, Shift бег
  - PointerLock, clamp к границам зала
  - UI бейдж Rail / FPS
- PBR Materials Library: `materials.ts`, готовы слоты под KTX2 сканы
- `FirstPersonControls.tsx` — отдельный, чистый

## v1.1 — 11.07.2026
- `data-lenis-prevent`
- сохранение позиции камеры sessionStorage
- кураторские цитаты POET_QUOTES
- `USE_POSTPROCESSING = false` по умолчанию — 0 новых npm-зависимостей для старта
- keyboard 1…0, a11y
- `INSTALL_HALL.ps1`, `README_INSTALL_RU.md`

## v1.0 — 11.07.2026
- Initial R3F Pantheon
- PBR, SSAO/Bloom/DOF, rail dolly, 10 niches
