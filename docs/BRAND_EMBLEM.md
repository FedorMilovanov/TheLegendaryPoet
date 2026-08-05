# Эмблема THE LEGENDARY POET

## Production authority

Текущая production-эмблема основана на одном выбранном владельцем прозрачном референсе. Его байты хранятся частями в:

`qa/reference/approved-brand/final-reference.part*.b64`

`scripts/materialize-brand-art.mjs` собирает WebP, проверяет SHA-256 `898cf6bd0321f6f48ed12971f49803f7ed6758961f51e06628f0da2ffd50ff17` и детерминированно создаёт production-ассеты. Текущий release id: `approved-single-reference-20260804-1`.

## Живая архитектура

- `src/components/SpectralBrandMark.tsx` — единственный production React-компонент;
- `src/components/brandMotionFrameInvariant.ts` — ограниченная по времени pointer-физика;
- `scripts/materialize-brand-art.mjs` — источник всех растровых производных;
- `public/brand-emblem.png` — основной сгенерированный runtime-ассет;
- `public/favicon-16.png`, `public/favicon-32.png`, platform icons и `public/og-image.jpg` — производные;
- `public/brand-release.txt` — release/source marker.

Компонент использует базовый RGBA-слой и очень слабый depth/aura дубль. Touch-параллакс отключён; `prefers-reduced-motion` убирает геометрическое движение.

## Запрещённые откаты

Следующие поверхности относятся к прежней SVG-архитектуре и не должны восстанавливаться по старым документам:

- `src/components/BrandMark.tsx`;
- `public/brand-emblem.svg`;
- `public/brand-mark-micro.svg`;
- `public/brand-emblem-mask.svg`;
- ручное редактирование сгенерированных PNG/иконок;
- параллельные header/primary/simplified/micro источники.

Файлы `brandEmblemV17.svg`, `brandMotionV17.ts` и `brandMotionV18.ts`, пока они остаются в дереве, являются только кандидатами на отдельный retirement review, а не production authority.

## Обязательная проверка

1. `npm run brand:materialize`;
2. `npm run validate:brand`;
3. `node scripts/validate-project-contracts.mjs`;
4. production build;
5. exact-head Browser QA на реальных header/footer/intro поверхностях;
6. визуальное решение владельца для художественной замены.

Нельзя менять SHA, источник или визуальный baseline ради зелёного теста. Нельзя вручную исправлять производные файлы вместо materializer.
