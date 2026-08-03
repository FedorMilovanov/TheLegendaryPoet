# Сергей Есенин. Часть II — канонический индекс рабочих черновиков

**Updated:** 3 August 2026  
**Status:** `14 CHAPTERS AUDITED + LITERARY COMPRESSION PASS COMPLETE / НЕ ПУБЛИКОВАТЬ`  
**Canonical branch:** `editorial/longform-marathon-2026-08`  
**Canonical PR:** `#271`  
**Update rule:** обновлять этот файл на месте; не создавать новые `FINAL/LATEST/PASS-07` индексы.

## 1. Текущее состояние

```yaml
planned_chapters: 16
working_prose_chapters: 14
paragraph_claim_source_audited: 14
first_literary_compression_pass: 14
chapter_15_forensic_prose_created: false
chapter_16_final_prose_created: false
public_essay_module_created: false
public_route_created: false
ready_for_publication: false
```

Файлы сохраняют исторические имена `V01`/`V02`, потому что переименование породило бы лишние пути и ломало бы валидаторы. Фактическая версия указана внутри каждого документа.

## 2. Рабочие главы

| Глава | Файл | Текущий внутренний статус | Главный незакрытый gate |
|---:|---|---|---|
| 1 | `YESENIN_PART_II_DRAFT_CH01_1921_V01_2026-08.md` | V02 compression | страницы `Летописи`, программа 6 августа, листовка/развод/права |
| 2 | `YESENIN_PART_II_DRAFT_CH02_DUNCAN_MEETING_V01_2026-08.md` | V02 compression | registry/passport/transport binaries, reuse IDs, visual rights |
| 3 | `YESENIN_PART_II_DRAFT_CH03_MARRIAGE_PASSPORT_PUBLIC_COUPLE_V01_2026-08.md` | V02 compression | регистрационная запись, паспорт, транспорт, немецкая полоса |
| 4 | `YESENIN_PART_II_DRAFT_CH04_BERLIN_V01_2026-08.md` | V02 compression | берлинские газетные полосы, программа, том, переводной ledger |
| 5 | `YESENIN_PART_II_DRAFT_CH05_EUROPE_ROUTE_V01_2026-08.md` | V02 compression | passenger manifest, NARA rows, фото/издание/права |
| 6 | `YESENIN_PART_II_DRAFT_CH06_US_PARTIAL_V02_2026-08.md` | partial V03 compression | immigration file, programmes, city route, manifests, press |
| 7 | `YESENIN_PART_II_DRAFT_CH07_FOREIGN_WORK_V01_2026-08.md` | V02 compression | физические издания, translation ledger, Yarmolinsky object |
| 8 | `YESENIN_PART_II_DRAFT_CH08_RETURN_1923_V01_2026-08.md` | V02 compression | 3/21 August objects, legal files, accounts, rights |
| 9 | `YESENIN_PART_II_DRAFT_CH09_MOSKVA_KABATSKAYA_V01_2026-08.md` | V02 compression | July 1924 book, correcture, legal binaries, quotations |
| 10 | `YESENIN_PART_II_DRAFT_CH10_IMAGISM_V01_2026-08.md` | V02 compression | `Советская страна`, `Сирена`, `Правда`, `Новый зритель`, leaflet binaries |
| 11 | `YESENIN_PART_II_DRAFT_CH11_BENISLAVSKAYA_V01_2026-08.md` | V02 compression | 14 reverse letters, diary chain, power-of-attorney/visuals |
| 12 | `YESENIN_PART_II_DRAFT_CH12_CAUCASUS_V01_2026-08.md` | V02 compression | city-day route, medical evidence, first editions, visual rights |
| 13 | `YESENIN_PART_II_DRAFT_CH13_LATE_POETRY_V01_2026-08.md` | V02 compression | exact quotation pass, manuscript/edition binaries, theological review |
| 14 | `YESENIN_PART_II_DRAFT_CH14_SOFIA_CLINIC_PARTIAL_V01_2026-08.md` | partial V02 compression | marriage record, full medical file, treatment end, document binaries |
| 15 | — | `FORENSIC ACQUISITION ONLY` | 12 documentary objects, 10 witness rows, 0 item-verified objects |
| 16 | — | `WRITE LAST` | chapters 1–15 closed, moral/theological synthesis approved |

## 3. Что проверено во всех 14 главах

- явная метка `НЕ ПУБЛИКОВАТЬ`;
- контролирующий research/source документ;
- source IDs не удалены до typed-citation migration;
- квалификаторы не сглажены ради ритма;
- мемуар, академический комментарий, автограф, фотокопия, газетная полоса, афиша и юридический документ не смешаны;
- план поездки не превращён в посещённый город;
- публикация не превращена в место написания;
- художественный текст не превращён в диагноз, протокол или предсмертную записку;
- нравственная ответственность не стёрта болезнью или зависимостью;
- художественная исповедь не объявлена покаянием;
- реконструкция не используется как архивное доказательство;
- отдельные статьи не продублированы большими повторными расследованиями;
- главы 15–16 и публичный route не созданы преждевременно.

## 4. Следующий редакционный проход

Compression не является финальной редактурой. Следующий проход выполняется только по проверенным источникам:

1. точные короткие цитаты и пунктуация из controlling texts;
2. item/page/leaf references для каждого сильного утверждения;
3. удаление оставшейся служебной англизации из будущего reader text;
4. проверка переходов между главами и общего ритма без удаления квалификаторов;
5. отдельный нравственный и богословский review;
6. typed Essay authoring только после закрытия source/rights/visual gates;
7. chapter 15 — только после forensic readiness validator;
8. chapter 16 — последней.

## 5. PDF и архивные зависимости

- `PDF_ACQUISITION_PASS_03_YESENIN_1921_1925_2026-08.md` — общий shortlist и фактические binary statuses;
- `YESENIN_DECEMBER_1925_ACQUISITION_REGISTRY_2026-08.md` — 12 forensic objects;
- `YESENIN_ARCHIVE_REQUEST_PACK_2026-08.md` — официальные запросы;
- Drive‑загрузка считается состоявшейся только после real file ID и manifest/SHA update;
- текущий connector bridge принимает runtime files, но отклоняет объекты свыше 100 МБ;
- крупные или rights-unclear файлы не ужимаются и не дробятся ради обхода лимита без отдельного derivative/rights решения.

## 6. Publication boundary

Ни одна глава не переносится в `src/data/essays`, не регистрируется как route и не получает дату публикации до закрытия источников, прав, визуалов, точных цитат, content/type/build/SEO/browser gates на одном final head.
