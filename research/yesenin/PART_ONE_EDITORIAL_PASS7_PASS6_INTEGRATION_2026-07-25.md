# Сергей Есенин, часть I: интеграция редакционного pass 7 поверх source pass 6

Дата: 2026-07-25

Issue: #76

Статус: `71/71 LATE-SECTION-BLOCKS-EDITED / 146 EVIDENCE-NODES-PRESERVED / 64 RENDERED-SOURCES-PRESERVED / UNPUBLISHED / UNREGISTERED / MEDIA-HOLD`

## Основание интеграции

Первый редакционный pass 7 был подготовлен на прежней 137-узловой topology и содержал 68 литературно и богословски отредактированных reader-facing блоков разделов 9–12. После него canonical research принял source pass 6: девять новых source-anchored абзацев, 48 новых source records, 146 evidence-bearing nodes и 64 реально отображаемых библиографических источника.

Эта интеграция не откатывает ни одну сторону. Исходный 68-блочный реестр сохранён побайтно; поверх новой pass-6 topology добавлены и отредактированы три новых абзаца, попавшие в позднюю половину статьи.

## Три новых редакционных блока

### Раздел 10

`yesenin-p1-pass6-poems-book-materiality`

Прижизненные издания религиозно-революционных произведений теперь описаны как материальная история книг: состав, соседство текстов, оформление и библиографический контекст. Каталог не выдаётся за богословское истолкование, а книжная форма — за доказательство единой мгновенно завершённой системы.

### Раздел 11

`yesenin-p1-pass6-imaginism-publishing-practice`

«Плавильня слов» введена как свидетельство совместной издательской практики имажинистов. Книжный объект, конфликтующие мемуары участников и академическая хронология разведены по жанру и доказательной силе.

### Раздел 12

`yesenin-p1-pass6-duncan-archive-program`

Архивные описания NYPL использованы как точная карта дальнейшего поиска программ, рецензий, школьных документов и дневниковых единиц. Finding aid не превращён в прочитанный дневник, а item-level свидетельство не объявлено полученным.

## Сохранённые инварианты

- 146 evidence-bearing nodes;
- 12 section blocks и 158 render blocks всего;
- 71 из 71 блоков разделов 9–12 получают reviewed reader-facing text;
- исходные 68 pass-7 overrides сохранены без изменения;
- три новых late pass-6 blocks добавлены отдельным typed companion registry;
- 64 canonical bibliography rows остаются реально подключёнными;
- 27 из 27 claim ID сохранены;
- 10 supplemental source ID сохранены во внутреннем evidence-layer;
- 24 McVay/user research ID сохранены во внутреннем evidence-layer;
- семь FEB acquisition records сохранены;
- 12 physical witness targets сохраняют facsimile/archive HOLD;
- восемь real-only visual records остаются production-blocked;
- topology SHA-256 остаётся `49354adab3d14bbe03ca48b3fb6c4f1795601d7101c82694a5f7fa5cfec1b838`;
- route, sitemap, navigation и public essay registry не изменяются.

## Редакционная граница

Pass 7 завершает sentence-level литературную редактуру разделов 9–12 и богословскую sentence-level редактуру раздела 10. Лид и разделы 1–8 ещё не прошли такой же полный проход. Поэтому whole-article completion остаётся `false`.

Ни количество источников, ни литературная готовность поздней половины не снимают физические, правовые и provenance-ограничения. Статья остаётся `UNPUBLISHED / UNREGISTERED / MEDIA-HOLD` до отдельного publication decision.

## Merge gate

Интеграция может войти только в canonical research после success на одном exact head для:

1. focused unpublished-article validator;
2. Authoring workflow;
3. Citation Topology workflow;
4. полного CI;
5. Manual Browser QA с Chromium, Pixel 7 и iPhone Safari;
6. независимой проверки QA-артефакта.

`main` не является целью этого изменения.
