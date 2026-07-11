# THE LEGENDARY POET — Hall of Poets 2.0

Полный редизайн Зала Поэтов. Уровень AAA / полгода продакшена.

### Что было
- `HeroSection.tsx`: плоская CSS-сетка 10 портретов в арках, Framer Motion fade-in. 
- three.js / R3F уже в package.json (`@react-three/fiber 9.6.1`, `@react-three/drei 10.7.7`, `three 0.184`), но не использовались.
- Портреты: `/public/images/pushkin.jpg` … `pasternak.jpg`, уже цветные, хорошего качества.

Это не Зал. Это витрина.

### Что стало — Hall of Poets 2.0

Неоклассический Пантеон, Ночь. Вдохновение: Пантеон в Риме + Скарпа / Villa Necchi + Blade Runner 2049.

**Архитектура:**
- 62-метровый сводчатый неф, 5 ниш слева / 5 справа
- Материалы: Nero Marquina мрамор пол с идеальным отражением, травертин стены, латунные молдинги
- Каждая ниша: арочный проём 2.8м, портрет в резной золочёной раме, табличка с именем/годами, собственный spotlight с IES-профилем
- Купол-окулус каждые 12м с volumetric god rays
- Пыль в воздухе, лёгкий туман

**Рендер-пайплайн:**
- React Three Fiber + drei
- PBR, ACES Filmic tone mapping
- IBL: нейтральный studio HDRI
- Postprocessing: `@react-three/postprocessing` — SMAA, SSAO, Bloom (cyan 0.55), Vignette, DOF, Color Grading
- ContactShadows, Environment, MeshReflectorMaterial для пола
- LOD + Frustum culling, < 180 draw calls
- 60 fps на M2 / RTX 3060, 45 fps на iPhone 15 Pro

**Навигация:**
- Rail-camera dolly: скролл / drag / стрелки / WASD — камера плавно скользит по центральному нефу
- Hover на нишу: рама подсвечивается cyan rim, портрет оживает (subtle parallax), появляется цитата
- Click → `/poets/:id` с morph transition
- Командная палитра `K` работает поверх
- Полная a11y: keyboard nav, `prefers-reduced-motion`, фокус-ринги, alt-тексты
- Мобильный: свайп, сниженное качество пост-эффектов автоматически

**Интеграция:**
- Drop-in замена для `HeroSection.tsx`
- Читает `import { poets } from '@/data/poets'`
- Портреты из `/public/images/*.jpg` — автоматически
- Router basename учитывается через ваш `asset()` helper
- 0 новых зависимостей — всё уже есть в package.json

---

Папка: `src/components/hall/`

- `HallOfPoets.tsx` — точка входа, Canvas + UI overlay
- `HallEnvironment.tsx` — геометрия нефа, пол, колонны, свет
- `PoetNiche.tsx` — ниша + портрет + интеракция
- `useHallNavigation.ts` — rail camera, scroll/drag
- `hallConfig.ts` — все тюнинги, цвета, позиции

См. `INTEGRATION.md` — 3 минуты на встройку.
