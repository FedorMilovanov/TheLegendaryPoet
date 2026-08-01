# Эмблема THE LEGENDARY POET

## Канонический референс

Единственный художественный эталон:

`qa/reference/brand-emblem-canonical-reference.webp`

Reference id: `canonical-hooded-figure-v2-clean-base`.

Это квадратный крупный погрудный образ: высокий многослойный капюшон, огромная абсолютно чёрная пустота лица, широкие плечи, тяжёлый смятый клобук, три главные семьи складок, ледяной контур и электрическая синяя аура за головой и верхней частью фигуры. Нижний край тёмный и чистый — без обязательного дыма.

`Siluette dans la brume sombre.png` — только дополнительный mood reference. Он не влияет на production-геометрию, оптические пропорции или approval score.

## Текущий этап

- visual baseline: `canonical-reference-v2-black-monolith-v17-0`;
- interaction: `spring-awakening-v3`;
- awakening sequence: `aura-rim-cloth-v1`;
- release: `cloak-20260801-22`;
- decision: **NOT REFERENCE APPROVED**.

Production SVG, micro mark и Safari mask пока сохранены без художественной замены. Ранние geometry-reset кандидаты не доказали превосходство над v17, поэтому живой baseline не ухудшается. Геометрический score остаётся 0.86.

## Фазовое «оживание» v18.3

Новый hover построен не как один `scale()`, а как последовательность:

1. аура и внешняя энергия реагируют первыми;
2. затем поднимается и набирает массу фигура;
3. позже расходятся капюшон, контур, воротник и текстурные слои;
4. пустота лица получает обратный микропараллакс;
5. после ухода курсора система проходит `settling` и точно возвращается в `idle`.

Технический контракт:

- bounds читаются при входе и через `ResizeObserver`, не на каждом pointer move;
- работает один `requestAnimationFrame` loop только во время активности/возврата;
- React state не используется в hot loop;
- `will-change` включается временно;
- touch не запускает pointer depth;
- keyboard focus получает стационарное усиление света;
- `prefers-reduced-motion` полностью убирает геометрическое движение;
- вечной idle-анимации нет.

## Производственные поверхности

- `src/components/brandEmblemV18.svg` — сохранённый авторский SVG baseline;
- `src/components/BrandMark.tsx` — React wrapper и interaction ownership;
- `src/components/brandMotionV18.ts` — фазовая пружинная физика;
- `public/brand-emblem.svg` — автономный SVG;
- `public/brand-mark-micro.svg` — отдельная оптика 16–32 px;
- `public/brand-emblem-mask.svg` — Safari mask с настоящей пустотой лица.

Runtime не содержит `<image>`, Base64, canvas, raster plate или perpetual animation.

## Исследование и марафон

`docs/research/BRAND_EMBLEM_SVG_MOTION_MARATHON_2026.md` содержит 69 официальных/первичных источников, performance budget и 24-проходную программу.

Завершены проходы 1, 19, 20, 21, 22 и 23: provenance, pointer physics, layer depth, cloth awakening foundation, energy awakening и accessibility ownership. Художественные проходы 2–18 остаются активными. Проход 24 — exact-head Chromium/WebKit evidence и owner approval gate.

## Обязательные артефакты

- `brand-reference-comparison-matrix.png` — reference/baseline на 256–16 px;
- `brand-reference-live-site-comparison.png` — reference, idle, entry phase, full awakening;
- `brand-interaction-state-matrix.png` — idle, 120 ms entry, full state, четыре направления и settled return;
- `brand-live-site-home-first-viewport.png`;
- `brand-emblem-optical-size-matrix.png`;
- `brand-emblem-reduced-motion.png`.

Зелёный CI подтверждает только техническую целостность. Художественное принятие остаётся отдельным решением владельца.

## Запрещено

- работать без открытого квадратного референса;
- использовать длинный силуэт как источник пропорций;
- заменять baseline художественно худшим кандидатом;
- повышать visual score из-за улучшения анимации;
- скрывать слабую геометрию свечением;
- превращать лицо в узкую каплю, а клобук — в X/бант/галстук;
- использовать одинаковые радиальные клинья вместо ткани;
- добавлять нижний дым;
- встраивать растровый runtime;
- запускать perpetual idle loop;
- ослаблять проверки ради слияния.
