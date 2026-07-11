# Hall of Poets 2.0 — v1.2 FPS Walk — Установка в Windows / PowerShell

Фёдор, ты ни разу не делал pull — ок, вот пошагово, 5 минут.

Референс: `reference/hall_target_v2.jpg` — чёрный мрамор, золотые рамы, циановая подсветка, «ВЕЛИКИЕ РУССКИЕ ПОЭТЫ». Зал в коде уже подогнан под него. Есть режим ходьбы как в игре: F — toggle FPS / Rail.

---

### 1. Первый раз клонируем репо

Открой PowerShell (Win+R → `powershell`)

```powershell
cd C:\Users\Fedor\Projects
git clone https://github.com/FedorMilovanov/TheLegendaryPoet.git
cd TheLegendaryPoet
```

Если git не установлен: https://git-scm.com/download/win

Логин для push: первый `git push` попросит войти через браузер (GitHub Credential Manager) — это нормально. Никаких токенов руками вставлять не нужно.

### 2. Распакуй Зал

Скачанный архив `hall-v2.zip` лежит в `C:\Users\Fedor\Downloads`

Распакуй папку `hall` в:
```
C:\Users\Fedor\Projects\TheLegendaryPoet\src\components\hall\
```

Должно получиться:
```
TheLegendaryPoet\src\components\hall\
  HallOfPoets.tsx
  PoetNiche.tsx
  HallEnvironment.tsx
  useHallNavigation.ts
  hallConfig.ts
```

### 3. Установка зависимостей

```powershell
cd C:\Users\Fedor\Projects\TheLegendaryPoet
npm install
```

Post-processing — опционально, для киношной картинки:
```powershell
npm i @react-three/postprocessing postprocessing
```
После этого открой `src/components/hall/HallOfPoets.tsx` и поставь:
```ts
const USE_POSTPROCESSING = true
```
Если не ставить — зал работает и без этого, просто чуть проще свет.

### 4. Подключаем Зал вместо HeroSection

Файл: `src/pages/HomePage.tsx`

Было:
```tsx
import HeroSection from '@/components/home/HeroSection'
...
<HeroSection />
```

Стало:
```tsx
import HallOfPoets from '@/components/hall/HallOfPoets'
...
<HallOfPoets />
```

Остальной контент страницы (StatsSection и т.д.) можно оставить ниже Зала — будет скролл дальше.

### 5. Локальный запуск

```powershell
npm run dev
```
Открой http://localhost:5173/TheLegendaryPoet/

Управление:
- Rail режим: Скролл / drag / ← → — идти по нефу
- **F — включить FPS Walk как в игре**, WASD + мышь, Shift бег, Esc отпустить мышь
- 1 … 0 — прыжок к поэту
- Клик по портрету — открыть досье
- K — поиск

### 6. Коммит и пуш

```powershell
cd C:\Users\Fedor\Projects\TheLegendaryPoet
git add .
git commit -m "feat: Hall of Poets 2.0 — R3F Pantheon v1.1"
git push origin main
```

Первый push откроет браузер для авторизации GitHub — разреши.

Через 2-3 минуты сайт обновится на:
https://fedormilovanov.github.io/TheLegendaryPoet/

Готово.

---

### Частые вопросы

**Q: Ошибка TypeScript про postprocessing?**
A: Значит `USE_POSTPROCESSING = false` — это нормально. Поставь true только после `npm i @react-three/postprocessing postprocessing`.

**Q: Lenis дергает скролл?**
A: В v1.1 уже стоит `data-lenis-prevent` на секции — всё ок.

**Q: Как вернуть старый Hero?**
A: Просто верни импорт `HeroSection` в `HomePage.tsx`. Файлы Зала ничему не мешают.

**Q: Портреты не грузятся?**
A: Они берутся из `/public/images/*.jpg` через твой `asset()` — всё как в текущем репо. Ничего переносить не надо.

---

Дальше — см. `HALL_ROADMAP_6_MONTHS.md`
