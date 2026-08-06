# THE LEGENDARY POET

Тёмный редакторский сайт о русской поэзии: профили поэтов, стихотворения, большие документированные эссе, музыка и читательские функции.

**Production:** `https://thelegendarypoet.ru`  
**Stack:** React 19 · TypeScript · direct React Router · Vite 7 · Tailwind CSS 4 · Framer Motion

## Быстрый старт

Используйте Node 24 из `.nvmrc`, совпадающий с CI. React Router 8 требует Node не ниже 22.22.0; Node 24 является единым рекомендуемым baseline проекта.

```bash
nvm use
npm ci
npm run dev
npm run check
npm run build
npm run preview
```

Workflow `Project contracts` без установки зависимостей проверяет машинный контракт проекта и UTC-ротацию. `npm run check` продолжает проверять контент, бренд, маршруты, взаимодействия и TypeScript; финальные production/prerender/browser-гейты запускаются отдельными workflow GitHub Actions.

## Каноническая архитектура

- `docs/CURRENT_STATE.md` — текущая архитектурная правда и открытые системные долги.
- `docs/project-contract.json` — машинно-проверяемые пути и роли.
- `src/routes/route-contract.json` — единый машинный манифест маршрутов, redirects, sitemap, QA и бюджетов; `src/routes/routeModules.ts` — его lazy runtime.
- `src/data/essays/index.ts` — публичный каталог больших эссе (`/essays/:slug`).
- `src/data/library/index.ts` — библиотека поэтов.
- `src/config/site.ts` — домен, каналы и контакты.
- `src/components/SpectralBrandMark.tsx` + `scripts/materialize-brand-art.mjs` — production-бренд.
- `src/assets/fonts/` — локальные WOFF2; внешние Google Fonts не используются.
- `docs/community-schema.sql` — серверный контракт общей системы оценок и комментариев.

## Публикация

Production обслуживается с корня кастомного домена (`VITE_BASE=/`). `.github/workflows/deploy.yml` собирает multi-file Vite build, проверяет точный SHA и публикует GitHub Pages. Deep links защищены статическим fallback и prerender/SEO-гейтами.

## Контент и доказательность

Новые биографические и богословские утверждения проходят правила из:

- `PROJECT_CHARTER.md`;
- `docs/EDITORIAL_JUDGMENT_AND_SOURCE_POLICY.md`;
- `docs/HISTORICAL_NARRATIVE_STANDARD.md`;
- `src/docs/THEOLOGICAL_GUIDELINES.md`.

Точные verified SHA, закрытые repair-волны и evidence-пакеты хранятся в `FedorMilovanov/AuditRepo/projects/the-legendary-poet/`, а не дублируются в нескольких документах этого репозитория.

## Исторические материалы

`audit/index.html`, `COMPONENT_BLUEPRINTS.md`, `TRANSFER.md` и `docs/INTEGRATION_STATUS.md` сохраняются только как история прежних этапов. Они не являются инструкцией для текущего кода.
