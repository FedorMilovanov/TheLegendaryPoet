# Сергей Есенин. Часть II — аудит корпуса рабочих глав, pass 01

**Дата:** 3 августа 2026 года  
**Базовый SHA аудита до фиксации отчёта:** `041a47c5cd8946c2a2b2cb0e578b27e212cf3dfa`  
**Каноническая ветка:** `editorial/longform-marathon-2026-08`  
**Канонический PR:** `#271`  
**Статус:** `RESEARCH CORPUS AUDITED / НЕ ПУБЛИКОВАТЬ`

## 1. Объём аудита

Проверены текущие рабочие тексты глав 1–14.

### Полный структурный контроль

Для каждой главы проверены:

- явная маркировка `НЕ ПУБЛИКОВАТЬ` или эквивалентный запрет;
- версия `V01 / partial V01 / partial V02`;
- наличие controlling source pass, authoring packet или явно названного research basis;
- сохранение открытых source / rights / visual / medical / forensic gates;
- отсутствие заявленной публичной даты;
- расположение только в `docs/research`;
- отсутствие отдельного публичного Part II route/data module в changed-file corpus.

### Углублённый содержательный контроль

Особенно проверены главы и формулы с повышенным риском:

- глава 2 — вероятностная дата первой встречи;
- главы 5–6 — планируемый/совершённый маршрут, immigration inspection и депортация;
- глава 10 — первый манифест, разрыв и продолжение имажинистской сети;
- глава 11 — счёт переписки, встречные письма и copy-based `Дневник`;
- глава 13 — стихотворение как текст, а не диагноз или автоматическое покаяние;
- глава 14 — справка № 1037, типы рукописей, деньги и планы как документы действий, а не медицинские выводы.

Этот pass не объявляет завершённым финальный литературный, богословский или постраничный source review. Он проверяет, что рабочий корпус не нарушает уже принятые hard stops.

---

## 2. Таблица результатов

| Глава | Структурный статус | High-risk boundary | Результат pass 01 |
|---:|---|---|---|
| 1 | explicit non-public V01 | афиша ≠ присутствие; план ≠ поездка | `PASS / source IDs need migration` |
| 2 | explicit non-public compact V01 | точная дата встречи остаётся вероятной | `CORRECTED` |
| 3 | explicit non-public partial V01 | оригинал ≠ копия с копии; мотив брака не единственный | `PASS / source IDs need migration` |
| 4 | explicit non-public partial V01 | синхронная пресса ≠ стенограмма; Берлин не только скандал | `PASS / source IDs need migration` |
| 5 | explicit non-public V01 | Гаага/Рим/Лондон не превращены в остановки | `PASS` |
| 6 | explicit non-public partial V02 | inspection/admission ≠ deportation; города имеют разные статусы | `PASS` |
| 7 | explicit non-public V01 | написано ≠ издано ≠ переведено ≠ задумано | `PASS / source IDs need migration` |
| 8 | explicit non-public V01 | возвращение ≠ мгновенный финал; два юридических дела разделены | `PASS / source IDs need migration` |
| 9 | explicit non-public V01 | счёт ≠ личное употребление каждой позиции; роль ≠ вся реальность | `PASS / source IDs need migration` |
| 10 | explicit non-public compact V01 | full 1919 article remains separate; роспуск был оспорен | `PASS` |
| 11 | explicit non-public compact V01 | 35 mixed documents; 14 letters not acquired; diary copy-based | `PASS` |
| 12 | explicit non-public partial V01 | поэтическая Персия ≠ доказанный иранский маршрут | `PASS / source IDs need migration` |
| 13 | explicit non-public V01 | поэзия ≠ диагноз; исповедальность ≠ доказанное покаяние | `PASS / source IDs need migration` |
| 14 | explicit non-public partial V01 | certificate ≠ diagnosis; list/photostat ≠ autograph | `PASS` |

---

## 3. Исправленная регрессия

### Chapter 2 closing sentence

До исправления основной текст сохранял осторожную формулу, но заключение неожиданно утверждало:

> `в начале октября 1921 года...`

Это создавало внутреннее противоречие с:

- самостоятельным расследованием первой встречи;
- академической формулой `видимо, 3 октября`;
- competing memoir chronology;
- claim matrix `PROBABLE / NOT SYNCHRONOUSLY PROVEN`.

Исправленная формула:

> `осенью 1921 года, вероятнее всего в начале октября...`

Файл:

- `YESENIN_PART_II_DRAFT_CH02_DUNCAN_MEETING_V01_2026-08.md`.

Gate-list главы также дополнен пунктом, что вероятностная квалификация должна сохраняться во всём тексте.

---

## 4. Проверенные hard stops

### Route and travel

- plan/petition/future tense не превращаются в completed stop;
- advertisement не превращается в attendance;
- Brussels повышен до completed только после письма из города;
- Hague, Rome and London остаются unproven plans;
- 3 February departure отделён от conflicting 4 February period endpoint.

### Immigration

- `deportation` не используется как установленный исторический факт;
- arrival detention/inspection и admission отделены от removal/deportation;
- Cable Act используется только как legal-history context, не как установленное case ground;
- exact immigration reasoning остаётся case-file pending.

### Medicine and psychology

- certificate № 1037 не называется полной медицинской картой;
- опубликованное содержание справки не превращается в диагноз;
- практические планы, банковские операции и издательская работа не объявляются доказательством благополучия;
- clinic/legal motives показаны как сосуществующие линии, а не как одна доказанная причина.

### Representation type

- autograph, authorised copy, copy, photostat, telegram form and academic transcription различаются;
- copy-based Benislavskaya diary не называется непосредственно проверенным автографом;
- FÉB photo reproduction с неизвестным оригиналом не объявляется production-safe visual;
- physical witness и academic commentary остаются разными source objects.

### Poetry and moral interpretation

- художественный текст не используется как единственный биографический диагноз;
- признание вины в стихотворении не приравнивается автоматически к исправлению отношений или христианскому покаянию;
- destructive conduct не романтизируется как источник дара;
- нравственная ответственность не заменяет документальный анализ мотивов.

---

## 5. Public-surface check

На момент базового SHA:

- все новые chapter drafts находятся в `docs/research`;
- отдельного `yeseninPartTwo` reader data module в PR corpus нет;
- глава/источник не зарегистрированы как новый публичный Part II route;
- chapter files не имеют production publication date;
- research file date обозначает дату версии research artifact, а не дату публикации статьи;
- chapter 15 остаётся `FORENSIC HOLD`;
- chapter 16 остаётся последним синтетическим этапом.

Этот check не является deployment check и не доказывает состояние live production.

---

## 6. Найденный технический долг: source-ID generations

В корпусе одновременно существуют:

- ранние зарезервированные IDs вида `yes2-*`;
- новые focused IDs вида `ye2-*`.

Это не означает автоматически, что каждый `yes2-*` устарел. Часть ранних IDs является стабильными библиографическими объектами, а новые focused IDs иногда обозначают:

- более узкий документ;
- отдельную representation;
- конкретную дату/событие;
- institutional event вместо общего academic root.

Поэтому запрещена глобальная замена `yes2-` → `ye2-`.

Контролируемая миграция вынесена в:

- `YESENIN_PART_II_SOURCE_ID_MIGRATION_AUDIT_PASS_01_2026-08.md`.

---

## 7. Что pass 01 не закрывает

- line-by-line source citation audit каждого абзаца;
- точность каждой будущей цитаты и переводной формулы;
- все physical binaries, SHA and rights;
- полный US city ledger;
- 14 reverse Benislavskaya letters;
- two physical first Imagist witnesses;
- full clinic file;
- December forensic acquisition;
- literary compression and repetition review;
- theological review chapter by chapter;
- public data modelling, typecheck, build and final browser QA.

---

## 8. Следующий аудит

### Pass 02 — paragraph/source audit

Для каждой главы:

1. выделить фактические предложения;
2. назначить stable claim IDs;
3. связать с exact source IDs;
4. отметить unsupported inference;
5. проверить quotation basis;
6. проверить duplicate exposition;
7. определить documentary visual slot;
8. только после этого готовить V02.

### Pass 03 — literary/theological audit

- единый голос большой биографии;
- отсутствие повторяющихся методологических вступлений;
- нравственный вывод после фактов, а не вместо них;
- библейские категории без выдуманной исповедальности героя;
- вывод не сводит жизнь к смерти.

---

## 9. Verdict

```yaml
chapters_structurally_audited: 14
structural_failures: 0
factual_uncertainty_regressions_found: 1
factual_uncertainty_regressions_fixed: 1
public_route_created: false
part_ii_data_module_created: false
chapter_15_status: FORENSIC_HOLD
chapter_16_status: WRITE_LAST
source_id_migration_required: true
ready_for_publication: false
```
