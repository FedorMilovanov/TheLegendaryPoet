# Маяковский и Брики — редакционная визуальная волна

**Дата:** 3 августа 2026 года  
**Ветка:** `editorial/longform-marathon-2026-08`  
**PR:** `#271`  
**Статус:** implementation ledger / exact-head QA required

## Что внедряется

В статьи «Маяковский. Часть II» и «Маяковский и Брики» добавляются пять предоставленных владельцем редакционных реконструкций и два подлинных печатных объекта из Google Drive.

Каждая реконструкция получает `kind: reconstruction`, подпись «редакционная реконструкция по историческим референсам» и прямую оговорку, что это не подлинная фотография эпохи и не доказательство конкретной сцены. Реальные документы получают `kind: document`, автора, дату, права и item-level source URL.

## Производственные файлы

| Файл | Функция | Размер | SHA-256 | Класс |
|---|---|---:|---|---|
| `brik-reading-circle-reconstruction.webp` | чтение в кругу Бриков | 720×405 | `67d201a28ec9481a2e675df2c72a25c5acb3751096394614588895ce2b7c158a` | reconstruction |
| `brik-triad-interior-reconstruction.webp` | меняющийся союз трёх участников | 720×405 | `e47e4e916e7d1cdb364079f6abe186d4c683b2a4b7dc3d56439673e1fe9e9177` | reconstruction |
| `mayakovsky-rosta-workshop-reconstruction.webp` | плакатная мастерская | 520×293 | `cda598891eaf934e76562f205a37bf574e15bda82b8d5b8e38b2b16f9639dbc3` | reconstruction |
| `mayakovsky-public-reading-reconstruction.webp` | публичное чтение | 293×520 | `fc7c1244e65e1d9f57e973fe0fc5df4e2d2f6a7007b334f227ac66e0cc695a7d` | reconstruction |
| `mayakovsky-late-desk-reconstruction.webp` | поздняя рабочая пауза | 520×293 | `f0f64b7f2b069f46697a36dc90711947d59c78b960448da439e1975fb575e569` | reconstruction |
| `mayakovsky-dlya-golosa-1923.webp` | разворот книги «Для голоса» | 420×293 | `d3dd3426b7b930866d7f597f29b0c82f1420d4276ca8d09cbf9f566adc58b1c6` | public-domain document |
| `mayakovsky-kruchenykh-stikhi-cover.webp` | обложка «Стихи В. Маяковского» | 220×371 | `277941306257879ea4b225dda873128c314f070d09332008f44282ead1659296` | public-domain document |

Полный machine-readable provenance находится в `public/images/essays/mayakovsky/editorial-wave/PROVENANCE.yml`.

## Подлинные объекты из Google Drive

### «Для голоса», 1923

- Drive ID: `11VuZIqX58rJlyvUS5E62h52bj2MD47Zi`
- Автор оформления: Эль Лисицкий
- Item source: `https://commons.wikimedia.org/wiki/File:Dlja_golosa._1923-100.jpg`
- Права: public domain
- Функция: показать реальный конструктивистский язык книги и редакционного дома ЛЕФ.

### «Стихи В. Маяковского», 1915

- Drive ID: `1Awqv3cftJ8luqsjET0b3P-6YqZXaV1Gx`
- Автор оформления: Алексей Кручёных
- Item source: `https://commons.wikimedia.org/wiki/File:Mayakovsky_books_kruchyonyx_stixi.png`
- Права: public domain
- Функция: показать подлинный футуристический печатный образ Маяковского в издательской среде.

## Расстановка

### Маяковский. Часть II

1. `РОСТА: рисунок, ритм и ежедневная работа` — общая оговорка и мастерская РОСТА;
2. `ЛЕФ и редакционный дом` — разворот «Для голоса» и портретная реконструкция публичного чтения;
3. `1930: несколько кризисов сразу` — поздняя рабочая сцена у стола.

### Маяковский и Брики

1. `Жуковского, июль 1915-го` — общая оговорка и чтение в кругу Бриков;
2. `Не треугольник, а меняющийся союз` — кабинетная композиция трёх участников;
3. `Осип: издатель, теоретик и сотрудник органов` — реальная футуристическая обложка.

## Отвергнутые кандидаты

Не используются contact sheets, современные фотографии мест с неясными правами, неидентифицированные файлы, общий ранний автограф без функции для этих статей и предсмертные документы ради драматического эффекта.

## Exact-head acceptance

Текущий head должен пройти content/type/build/SEO, article catalogue acceptance, desktop и mobile browser QA. Все семь изображений должны загрузиться без fallback; `reconstruction` не должен отображаться как `archive`; документ должен целиком открываться в lightbox; подписи обязаны оставаться читаемыми на iPhone Safari и Android Chrome.
