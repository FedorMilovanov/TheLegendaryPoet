# К. М. Симонов, Собрание сочинений, т. 8 (1982) — public scan gate

Дата прохода: 2026-08-19  
Статус: **exact public PDF/DjVu scan files located / same-edition OCR collated / relevant pages not yet visually inspected in current toolchain**

## Почему это важно

Приморская краевая детская библиотека в библиографии к материалу `Кто он, Лёнька Петров?` указывает конкретный печатный источник авторского рассказа Симонова:

> Симонов Константин. [О поэме `Сын артиллериста` и прототипе главного героя] // Собрание сочинений в 10 т. Т. 8. `Разные дни войны. Дневник писателя`. Т. 1. 1941 год. — М.: Художественная литература, 1982. — С. **393, 430–433**.

Исследование уже локализовало точный public scan package самого тома 8. Дополнительно 19 августа выполнена **same-edition OCR collation** по Militera: сайт прямо атрибутирует OCR изданию М.: Художественная литература, 1982, т. I, 479 с. Это позволяет заранее зафиксировать textual variants, но **не заменяет visual page inspection**.

---

## 1. Exact scan locator

**Public Library / publ.lib.ru — страница К. М. Симонова**  
HTML index:
https://publ.lib.ru/ARCHIVES/S/SIMONOV_Konstantin_Mihaylovich/_Simonov_K.M..html

Страница прямо описывает:

**Симонов К. М. Собрание сочинений в 10 томах. Том 08. Разные дни войны. Том 1.**  
Москва: `Художественная литература`, **1982**.

На странице доступны два scan package:

- `Simonov_K.M.__Sobranie_sochineniy_v_10_tt._T.08.(1982).[djv].zip` — **13.8 MB**;
- `Simonov_K.M.__Sobranie_sochineniy_v_10_tt._T.08.(1982).[pdf].zip` — **10.4 MB**.

Страница также фиксирует происхождение цифровой копии:

> `Скан, OCR, обработка, формат Djv, Pdf: vmakhankov, предоставил: Alexandr, 2018`.

### Exact PDF ZIP URL

`https://publ.lib.ru/ARCHIVES/S/SIMONOV_Konstantin_Mihaylovich/Simonov_K.M.__Sobranie_sochineniy_v_10_tt._T.08.%281982%29.%5Bpdf%5D.zip`

### Exact DjVu ZIP URL

`https://publ.lib.ru/ARCHIVES/S/SIMONOV_Konstantin_Mihaylovich/Simonov_K.M.__Sobranie_sochineniy_v_10_tt._T.08.%281982%29.%5Bdjv%5D.zip`

---

## 2. Библиографическое совпадение объекта

Независимые библиотечные каталоги подтверждают том:

- `Собрание сочинений : в 10 т. Т. 8. Разные дни войны: дневник писателя. Т. 1. 1941 год`;
- Москва: `Художественная литература`, **1982**;
- **479 с.**

То есть public scan locator и Militera OCR относятся к тому же edition-level объекту, на который ссылается ПКДБ.

---

## 3. Same-edition OCR collation

Militera chapter 19 в OCR того же издания передаёт:

- история рассказана Рыклисом в последний день на **полуострове Среднем**;
- `Лёнька` — вымышленное имя;
- `Деев` и `Петров` — тоже вымышленные фамилии;
- письмо И. А. Лоскутова от `3.III.1966`;
- вариант: **`командир полка посчитал, что это ошибка, и переспросил`**;
- авторский комментарий об отце с именем **`Иван Михайлович`**.

Подробный boundary записан отдельно в `SIMONOV_T8_SAME_EDITION_OCR_COLLATION_2026-08.md`.

### Что это меняет

Раньше `Иван Михайлович` можно было считать потенциальной ошибкой поздней web-передачи. Теперь это **strong same-edition textual witness**: OCR заявлен как текст издания 1982 года.

Но OCR не закрывает printed-page identity. Конфликт `Иван Михайлович / Алексей Михайлович` остаётся открытым до visual scan и competing print/family objects.

---

## 4. Какие страницы нужны для direct collation

Приоритетные печатные страницы:

- **с. 393**;
- **с. 430–433**.

На них нужно визуально проверить:

- формулу о том, что реальную фамилию лейтенанта Симонов тогда не записал;
- `Лёнька`, `Деев`, `Петров` как литературные имена;
- chronology 1964 → встреча → письмо 1966;
- вариант `командир полка`;
- судьбу отца прототипа;
- **точное имя отца в печатном тексте**.

---

## 5. Почему pages пока не считаются inspected

В текущем toolchain:

- web index видит HTML-страницу и exact file links;
- direct click по PDF/DjVu package surfaced реальные URL;
- web fetch возвращает `Cache miss`;
- container download получает DNS/network failure для `publ.lib.ru`.

Следовательно, **это access limitation текущего инструмента, а не отсутствие scan**.

Текущий статус:

**exact scan located / same-edition OCR collated / bytes not acquired / relevant pages visually uninspected.**

---

## 6. Evidence boundary

Можно утверждать:

- exact public scan package существует;
- это нужное издание 1982 года;
- target loci — p.393 и pp.430–433;
- same-edition OCR поддерживает `Лёнька / Деев / Петров`, `командир полка` и `Иван Михайлович`.

Нельзя утверждать:

- что p.393 или pp.430–433 визуально проверены;
- что PDF SHA-256 verified;
- что printed typography/page breaks установлены;
- что `Иван Михайлович` окончательно установлен как имя отца;
- что scan package разрешено перепубликовывать как facsimile.

---

## 7. Closure

- [ ] получить bytes PDF/DjVu;
- [ ] записать ZIP/PDF SHA-256;
- [ ] определить PDF/DjVu offset относительно printed pagination;
- [ ] visual screenshot p.393;
- [ ] visual screenshots pp.430–433;
- [ ] collate `Лёнька / Деев / Петров`;
- [ ] collate `командир полка`;
- [ ] collate `Иван Михайлович`;
- [ ] обновить author/father reconciliation;
- [ ] reuse/facsimile rights решать отдельно.

## Итог

Один source gap теперь разделён корректно: **scan object локализован, same-edition OCR уже collated, но direct printed pages всё ещё не просмотрены. OCR ≠ visual scan.**