# Сергей Есенин. Часть II — paragraph/source audit, главы 1–2, closure pass 02

**Дата:** 3 августа 2026 года  
**Статус:** `THREE TEXT-LEVEL SOURCE GAPS CLOSED / BINARIES AND RIGHTS OPEN / НЕ ПУБЛИКОВАТЬ`  
**Исходный аудит:** `YESENIN_PART_II_PARAGRAPH_SOURCE_AUDIT_CH01_CH02_PASS_01_2026-08.md`  
**Focused source pass:** `YESENIN_PART_II_SOURCE_PASS_CH01_CH02_GAPS_2026-08.md`

## 1. Закрытые gaps

### CH01-P07 — сентябрьские документы

Прежняя vague-formula:

> `подписывал новые программные тексты`

Заменена на точную:

> `вместе с другими имажинистами подписывал коллективные полемические письма — И. И. Ионову и в редакцию «Печати и революции»`.

Назначены source IDs:

- `yes2-1921-ionov-polemic-letter-before-sep15`;
- `yes2-1921-pir-editor-letter-before-sep15`.

Разведены provenance:

- письмо Ионову известно по публикации 1962 года и свидетельству о рукописи Мариенгофа с подписью Есенина;
- письмо в `Печать и революцию` печатается по первой журнальной публикации; подлинник неизвестен;
- вариант для `Книги и революции` существует как отдельный photostat witness авторизованной машинописи.

```yaml
text_source_gap: CLOSED
physical_originals: PARTLY_UNKNOWN
visual_rights: OPEN
```

### CH01-P10 — афиша и дневник 17 октября

Blended ID retired:

- `yes2-1921-oct17-poster-correction`.

Новые distinct objects:

- `yes2-1921-oct17-poster` — original poster, GLM;
- `yes2-1921-oct17-machtet-diary` — contemporaneous diary, RO RGB.

Рабочая проза теперь прямо объясняет:

- афиша доказывает объявление и ожидание;
- дневник сообщает об отсутствии на этом вечере и чтении в другом месте;
- эти evidence classes нельзя сливать.

```yaml
source_pair_gap: CLOSED
poster_binary_and_rights: OPEN
full_diary_binary_and_rights: OPEN
exact_taganka_programme: OPEN
```

### CH02-P07 — мост 2/8/10 мая 1922 года

Назначены source IDs:

- `yes2-marriage-date-1922-05-02`;
- `yes2-foreign-passport-5072-1922-05-08`;
- `yes2-departure-moscow-germany-1922-05-10`.

Добавлена representation boundary:

- академически атрибутированная свадебная фотография подтверждает день события;
- фотография не заменяет юридическую регистрационную запись;
- паспортный и транспортный объекты остаются отдельными acquisition targets.

```yaml
legal_bridge_text_gap: CLOSED_AT_ACADEMIC_EVENT_LEVEL
marriage_registry_binary: OPEN
passport_binary: OPEN
transport_binary: OPEN
```

---

## 2. Chapter updates

Обновлены:

- `YESENIN_PART_II_DRAFT_CH01_1921_V01_2026-08.md`;
- `YESENIN_PART_II_DRAFT_CH02_DUNCAN_MEETING_V01_2026-08.md`.

Обе главы:

- сохраняют `НЕ ПУБЛИКОВАТЬ`;
- ссылаются на focused source pass;
- не открывают reader route;
- имеют видимые binary/rights gates.

---

## 3. Validator update

`scripts/validate-yesenin-part-two-research.ts` теперь ломает CI, если:

- возвращается vague phrase `подписывал новые программные тексты`;
- возвращается blended poster/diary source ID;
- исчезают два сентябрьских source IDs;
- исчезают два source IDs 17 октября;
- глава 2 теряет отдельные IDs 2/8/10 мая;
- свадебная фотография снова подменяет registration record.

---

## 4. Remaining V02 gates

### Chapter 1

- exact Chronicle pages;
- 6 August programme/report;
- 12 June leaflet binary/rights;
- divorce exact page and representation;
- binaries/rights for September letters and 17 October pair.

### Chapter 2

- exact reused source IDs from independent Duncan article;
- marriage registry;
- passport no. 5072 binary;
- transport object;
- internal article link;
- pair visual rights.

---

## 5. Closure verdict

```yaml
initial_source_gaps: 3
closed_at_text_provenance_level: 3
remaining_binary_rights_gates: true
validator_protection_added: true
ready_for_v02_source_edit: partially
ready_for_publication: false
```
