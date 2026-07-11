# THE LEGENDARY POET — Hall of Poets 2.0
## Production Roadmap, 6 месяцев

Статус на 11.07.2026: `HallOfPoets.tsx v1.0` — рабочий R3F неф, PBR, постпроцессинг, rail-камера. Drop-in замена HeroSection.

Цель: AAA музейный уровень, 60fps везде, 0 костылей.

---

### Phase 0 — Интеграция, неделя 1
**Цель: зал в проде, без регрессий**

- [ ] `npm i @react-three/postprocessing postprocessing`
- [ ] скопировать `src/components/hall/*` в репо
- [ ] `HomePage.tsx`: `<HallOfPoets />` вместо `<HeroSection />`
- [ ] Lenis: добавить `data-lenis-prevent` на Canvas wrapper, чтобы smooth-scroll не ел wheel
- [ ] `asset()` для портретов — уже сделано
- [ ] Проверка роутов: click niche → `/poets/:id`, back → позиция камеры сохраняется (sessionStorage)
- [ ] SEO: `<h1>Зал Поэтов</h1>` оставить в DOM overlay, `useSeo({ title: 'Зал Поэтов — THE LEGENDARY POET' })`
- [ ] a11y audit: keyboard nav, focus ring, `prefers-reduced-motion`
- [ ] Lighthouse / PageSpeed CI

Критерий выхода: зал на fedormilovanov.github.io/TheLegendaryPoet, LCP < 2.5s

---

### Phase 1 — Картинка. Месяц 1-2
**Фотореализм**

1. **PBR материалы — реальные сканы**
   - Пол: Nero Marquina 4K — albedo / normal / roughness / AO, KTX2 Basis Universal
   - Стены: Roman travertine
   - Латунь: brushed brass, clearcoat
   - Pipeline: `gltf-transform etc1s` → `/public/textures/hall/*.ktx2`

2. **Lightmapping**
   - Запечь GI в Blender: неф, ниши, колонны → 2× 4K lightmaps
   - В рантайме: `material.lightMap = baked`, отключаем SSAO на mobile
   - Выигрыш: -40% GPU, iPhone 60fps

3. **Портреты 2.5D**
   - Из ваших `/images/*.jpg` → Depth map via MiDaS
   - Shader: parallax + subsurface rim, лёгкое дыхание
   - Fallback: обычный plane

4. **Post FX lock**
   - ACES Filmic, фиксированная экспозиция
   - Bloom cyan 0.55 только на латуни/рамах — через selective bloom / emissive threshold
   - SMAA, Temporal AA
   - Color grading LUT: холодный cyan/teal, тёплая латунь

Критерий: скриншот неотличим от UE5 Path Tracing референса.

---

### Phase 2 — Режиссура. Месяц 2-3

1. **Morph transition Poet → Detail**
   - `layoutId={`poet-${id}`}` — Framer Motion shared element
   - Click niche: портрет расширяется в Hero на `/poets/:id`, камера dolly-in 380ms
   - Back: reverse

2. **Звук**
   - У вас уже есть `/public/audio/`
   - Hover 1.2s → fade-in шёпот строки, 3D positional audio, HRTF
   - Ambient: далёкий зал, 32 dB, loop
   - WebAudio unlock на first click, mute toggle в UI

3. **Микро-интеракции**
   - Автограф под портретом — SVG, emissive pulse
   - Пылинки реагируют на проход камеры
   - Имена на табличках — каллиграфия, золотое тиснение
   - Command Palette K — работает поверх Canvas, уже совместимо

4. **Нарратив**
   - Вступительный пролёт камеры при первом заходе, 6с, skip по Esc
   - Цитаты в нишах — ручной кураторский набор, не автопарсинг
   - End-wall: BrandMark с volumetric glow

---

### Phase 3 — Перфоманс и доступность. Месяц 3-4

- LOD: ниши >12м — low-poly frame, 256px portrait
- Instancing: колонны, молдинги, светильники
- Texture streaming: KTX2 + `THREE.LoadingManager`, прогресс-бар
- Occlusion culling: ниши за спиной не рендерятся
- Mobile tier:
  - Tier A: full PBR + SSAO
  - Tier B: baked lightmap, no post
  - Tier C: static cubemap fallback + CSS cards
  - Авто-детект по `navigator.deviceMemory / hardwareConcurrency`
- `prefers-reduced-motion`: отключаем parallax, dolly, bloom pulse
- Клавиатура: Tab по нишам, Enter открыть, Esc сброс
- Screen reader: live-region «Ниша 3 из 10, Анна Ахматова, 1889—1966»
- Budget: < 2.8 MB initial (textures stream), TTI < 1.8s, 60fps desktop / 45fps mid-mobile

---

### Phase 4 — Контент-пайплайн. Месяц 4-5

1. **Poets CMS**
   - `src/data/library/poets/*.ts` остаются источником правды
   - Добавить поля:
     ```ts
     hall: {
       quote: string
       accent: '#00d4ff' // per-poet rim
       voiceClip?: '/audio/poet-id-line.mp3'
       signatureSvg?: string
     }
     ```
   - Валидация через Zod на build

2. **Скульптурные бюсты (опционально)**
   - Слот в `PoetNiche.tsx` уже готов: заменить `<planeGeometry map={texture}>` на `<primitive object={bust}>`
   - 10× scan-based бюстов, 40k tris, Draco
   - Портреты остаются fallback

3. **Статьи в зале**
   - Между нишами — мраморные стелы со статьями, клик → `/articles/:id`

---

### Phase 5 — Social / Live. Месяц 5-6

- **Призраки читателей**: Supabase Realtime, уже подключен у вас для comments
  - channel `hall_presence`, показываем 3-5 светлячков где сейчас другие
  - 0 персональных данных
- **Закладки / маршрут**: «мой тур по залу», share URL с позицией камеры
- **Скриншот-режим**: P — hide UI, 4K render to PNG
- **OG для каждого поэта**: рендер ниши в headless-gl на build, для `/poets/:id` OG-image
- **Аналитика**: posthog, события `hall_niche_hover`, `hall_poet_open`, без cookies

---

### Техдолг — 0

- TypeScript strict, no `any`
- Все материалы dispose, текстуры KTX2
- ESLint + knip — 0 dead exports
- Visual regression: Playwright screenshots `/hall` в CI
- docs: `docs/HALL_AUTHORING.md` — как добавить 11-го поэта за 4 минуты

---

### Зависимости — минимум

Сейчас есть:
```
react, three, @react-three/fiber, @react-three/drei, framer-motion, tailwind
```
Добавляем только:
```
@react-three/postprocessing, postprocessing
```
Всё. Никаких "движков на движках".

Опционально позже: `meshopt_decoder` для busts, `ktx2-loader` — уже в three.

---

### Milestones

| Неделя | Доставка |
|---|---|
| 1 | Hall v1 в проде, заменяет HeroSection |
| 4 | PBR сканы + lightmaps |
| 8 | Morph transition + звук |
| 12 | Mobile Tier B/C, a11y AA |
| 16 | CMS поля, подписи, статьи-стелы |
| 20 | Realtime призраки, скриншот-режим |
| 24 | v2.0 freeze, аудит, релиз |

Весь код в `src/components/hall/`, изолирован, тестируем, типизирован. Никаких костылей в глобальных стилях.

— THE LEGENDARY POET / Hall Team
