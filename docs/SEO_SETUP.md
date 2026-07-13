# SEO — подключение к Google и Яндексу

Сайт уже отдаёт всё, что нужно поисковикам: у каждой страницы свои `title`,
`description`, canonical, Open Graph и структурированные данные (JSON-LD —
`Organization`, `WebSite` с поиском, `Article` для статей, `ProfilePage/Person`
для поэтов), есть `sitemap.xml` и `robots.txt`. Оба поисковика (Google и Яндекс)
исполняют JavaScript, поэтому клиентовый рендеринг индексируется.

Осталось три ручных шага — их делает владелец сайта один раз.

## 1. Google Search Console

1. Зайти на https://search.google.com/search-console , добавить ресурс типа
   **«Ресурс с префиксом URL»**: `https://fedormilovanov.github.io/TheLegendaryPoet/`
2. Способ подтверждения — **HTML-тег**. Google даст строку вида
   `<meta name="google-site-verification" content="XX␣...">`.
3. В файле `index.html` раскомментировать строку и вставить свой код:
   ```html
   <meta name="google-site-verification" content="ВАШ_КОД_GOOGLE" />
   ```
4. Задеплоить (смёржить в `main`), затем нажать «Подтвердить».
5. В разделе **Файлы Sitemap** добавить: `sitemap.xml`.

## 2. Яндекс.Вебмастер

1. https://webmaster.yandex.ru — добавить сайт
   `https://fedormilovanov.github.io/TheLegendaryPoet/`
2. Подтверждение — **Мета-тег**. Раскомментировать в `index.html`:
   ```html
   <meta name="yandex-verification" content="ВАШ_КОД_ЯНДЕКС" />
   ```
3. Задеплоить, подтвердить.
4. В разделе **Индексирование → Файлы Sitemap** добавить
   `https://fedormilovanov.github.io/TheLegendaryPoet/sitemap.xml`.

## 3. Аналитика (необязательно)

Счётчики выключены, пока не заданы переменные сборки. Добавьте их как
**Variables** репозитория (Settings → Secrets and variables → Actions →
Variables), как сделано для Supabase, и они включатся сами:

| Переменная | Пример | Что это |
|---|---|---|
| `VITE_YANDEX_METRIKA_ID` | `99999999` | Номер счётчика Яндекс.Метрики |
| `VITE_GA_ID` | `G-XXXXXXX` | Google Analytics 4 |

## Важное про GitHub Pages и `robots.txt`

Поисковые роботы читают `robots.txt` из корня домена
(`fedormilovanov.github.io/robots.txt`), а наш файл лежит по адресу проекта
(`/TheLegendaryPoet/robots.txt`). Поэтому **sitemap лучше добавлять в вебмастерах
вручную** (шаги 1.5 и 2.4 выше) — это работает независимо от расположения
`robots.txt`.

**Рекомендация на будущее:** для «настоящего» SEO подключите собственный домен
(например, тот `thelegendarypoet.ru`, что уже упоминался). Тогда `robots.txt` и
canonical встанут в корень, а ссылки станут короче и авторитетнее. После
подключения домена нужно поменять `url` в `src/config/site.ts`, `loc` в
`public/sitemap.xml`, `Sitemap:` в `public/robots.txt` и canonical/OG в
`index.html`, а также `VITE_BASE=/` в сборке.
