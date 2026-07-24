# Сергей Есенин, часть I — NEB serial discovery pass 10

Дата прохода: 2026-07-25

Статус: `ISSUE-ID-DISCOVERY / SERVER-HTML-PRESERVED / NO-OCR / NO-SNIPPET-INFERENCE / RESEARCH-ONLY`

## Задача

Предыдущий physical-witness registry локализовал родительские записи двух сериальных корпусов, но не получил точные child catalogue IDs нужных выпусков:

1. `Театральная Москва`, 1921 — № 2, 7, 8 и 11–12;
2. `Известия ВЦИК`, 1921 — выпуски от 24 августа, 9 ноября и 23 ноября.

Родительская карточка доказывает существование серии и публично перечисленных выпусков, но не заменяет просмотр конкретного номера. Поисковый сниппет также не принимается как issue-level объект.

## Метод

Workflow:

- получает реальные HTML-байты родительской страницы НЭБ;
- сохраняет их без изменения и фиксирует SHA-256;
- извлекает все ссылки `/catalog/<child-id>/`;
- связывает child ID с подписью выпуска по anchor text либо ближайшему HTML-контексту;
- сохраняет raw HTML, JSON-карту и Markdown-отчёт как краткоживущий GitHub Actions artifact;
- не применяет OCR;
- не выводит номер выпуска из поискового сниппета;
- не создаёт PDF URL до получения точного child catalogue code.

## Принимаемые результаты

### `Театральная Москва`

Зелёный gate требует три разных child catalogue ID для:

- 1921, № 2;
- 1921, № 7;
- 1921, № 8.

Номер 11–12 может честно получить статус `NOT-EXPOSED-IN-PUBLIC-PARENT`; это означает отдельный библиотечный запрос, а не разрешение угадать ID.

### `Известия ВЦИК`

Три даты пока являются exploratory targets. Первый проход обязан сохранить реальный HTML и показать, выставлены ли issue-level links публично. Если даты отсутствуют, следующий проход должен искать официальный API/child route, а не ослаблять требование до родительской записи.

## Границы

- `parent record != issue record`;
- `issue record != inspected PDF`;
- `catalogue link != page-level evidence`;
- `search snippet != source object`;
- `open access != reproduction permission`;
- `ocrUsed=false`;
- `syntheticContentUsed=false`;
- `productionAuthorized=false`.
