# SUNO EXPERIENCE — рабочая память музыкального отдела

Справочник данных и примеров к [WORKBENCH](WORKBENCH.md), не дополнительный
нормативный документ. Расширять при появлении новых подтверждённых результатов,
а не по числу жанров. Все поля, которых нет в источнике, остаются unknown.

## 1. Стартовые музыкальные карточки

Ниже собственные повторно используемые промты из согласованного задания
на мощную электронную аранжировку, без ссылок на приватные исполнения.
Точный Style readback проверен для этого задания; на аудио-приёмку
это не претендует. Параметры относятся только к данному эксперименту,
не к будущим песням. BPM в Style — пожелание, не измерение.

### MIDNIGHT BASS GOD V2 — GENERATED / audio-QA unknown

Назначение: массивный полутемповый фестивальный бас, контраст камерного breakdown и дропов.
Style: 576 UTF-16. Модель v6-wild; style influence 0.96, weirdness 0.37, variety 0.
Не переносить эти controls вслепую. Дикция, фактический BPM, финал и сведение требуют слуховой проверки.

```text
Epic melodic dubstep meets festival brostep, 150 BPM with crushing 75 BPM halftime drops. Triumphant major-key anthem, seismic clean mono sub, enormous modulated growl bass, metallic synth fills, explosive drums, orchestral brass impacts and crystalline Christmas bells. Natural Russian male baritone, distinct radiant female answers, chopped vocal hooks, ping-pong delays, reverse swells, glitch cuts, abrupt silence. Intimate piano breakdown, two colossal contrasting bass drops, euphoric symphonic finale. Wide dynamic club master, pristine vocals, deep controlled low end.
```

### ELECTRO TITAN V2 — GENERATED / audio-QA unknown

Назначение: сложный танцевальный электро-грув, разные басовые тембры и синтезаторные ответы.
Style: 571 UTF-16. Модель v6-wild; style influence 0.96, weirdness 0.37, variety 0.
Не переносить эти controls вслепую. Дикция, фактический BPM, финал и сведение требуют слуховой проверки.

```text
Explosive complextro, big-room electro house and festival bass, 138 BPM. Huge punchy four-on-floor kick, seismic mono sub, rapidly alternating talking bass, distorted FM stabs, elastic wobble bass and intricate synth call-response. Triumphant major-key hook, crystalline sleigh bells, electric cello and orchestral impacts. Natural Russian male baritone, bright female replies, rhythmic vocal chops, gated stutters, ping-pong echo, tape stops, reverse FX and laser sweeps. Two extended high-impact instrumental drops, dramatic piano break and gigantic celebratory finale.
```

Общий Exclude исходного эксперимента (268 UTF-16), только как пример:
```text
Generic radio pop, soft lounge, weak bass, thin kick, muddy low end, clipping, excessive compression, nursery rhymes, children's choir, chanson, monotone vocals, excessive autotune, slurred Russian diction, invented lyrics, sung instructions, abrupt unfinished ending.
```

Этот Exclude не является запретом на мягкий бас, поп, детский хор, шансон,
лаунж или любые другие художественные решения в последующих задачах.
Использовать только релевантные ограничения. Для мягкого DJ можно выбрать
другой groove, плотность, тембры и вокальную режиссуру, в том числе без дропов.

### TRAGIC POST-ROCK NOIR — GENERATED / owner preference / audio-QA open

Контекст: Лермонтов, «1-е января» (новогодняя трилогия); прежние dub rock, cello rock и gothic waltz не удовлетворили владельца. Переход от красивой баллады к трагической психологической драме опирался на сохранённые профили «Чёрного человека» (post-rock, noir, cinematic). По сообщению владельца предпочтительна версия Б, А также неплоха. Аудиоанализ сообщил все семь строф, исправленное чтение «бестре́петные», полное «злостью»; возможный обрыв последнего эха «маски» остаётся открытым. Это художественный выбор, не RELEASE-READY. Приватные идентификаторы остаются в Suno.

Style 736 UTF-16, v6, influence 0.92, weirdness 0.32, variety 0; темп задан, не измерен. Авторские 42 строки + 5 повторных строк, холодное forward echo, контраст воспоминаний, пауза перед последней строфой, надрыв и тихий неразрешённый исход. Профиль — пример, не универсальный рецепт.

```text
Post-rock, noir, cinematic, bleak, depressive, nocturnal. Slow grave pulse around 76 BPM, deep solitary male baritone, close weary half-spoken melodic delivery, clear Russian diction and complete word endings. Cold low guitar arpeggios, exposed cello, sustained bass drone, distant toms, descending minor motifs, dissonant suspended harmony. Stark pauses and isolated self-echoes. Childhood memories briefly soften the texture before the cold ballroom returns. Nervous crescendos, huge distorted guitar and drum impact reserved for the final stanza, raw anguished vocal climax. Sudden collapse into bare voice and cold unresolved cello resonance. Compact instrumental passages, all supplied lines fully sung, respect stress marks and ё.
```

Урок: при повторяющейся неудовлетворённости менять музыкальную логику и референс, а не бесконечно заменять тембры; проверять ранее принятые записи до запуска, особенно при прямой ссылке владельца на прежнюю работу. Успех здесь не доказывает, что такой стиль предпочтителен для всех новогодних песен.

## 2. Антибиблиотека — проверенные наблюдения и открытые вопросы

| ID | Наблюдение | Доказательность | Как использовать |
| --- | --- | --- | --- |
| D01 | Ошибка произношения «стенах» в вокале | Сообщение владельца, без независимого аудио | Сверить словоформу и контекст, рассмотреть «стена́х»; CASES §6 |
| D02 | Е/Ё в «звёзды/звёздами», «все звёзды» | Текстовая проверка, сообщение об ошибке | Контекстная редакция; исторические варианты отдельно; слух не подтверждён |
| D03 | Style ровно 800 с незавершённым словом | Readback конкретного эксперимента | Сравнить payload; компактный промт при повторении, не глобальный лимит |
| D04 | Одинаковые названия с разными Style | Проверено на библиотечном инвентаре | Сравнить каждый clip ID; не считать все дублями одного payload |
| D05 | Лайк и полная аудиоприёмка — разные сигналы | Статусы библиотеки и отдельный QA | Не публиковать автоматически, не объявлять слуховой дефект исправленным |
| D06 | Сохранённый Style бывает длиннее 800 | Проверено на библиотечном инвентаре | Порог зависит от пути; отсутствие truncation устанавливается сравнением, не длиной |

Добавлять отрицательный музыкальный опыт только с контекстом: что хотели,
что действительно услышали, кто сообщил, что изменили и стало ли лучше.
Отсутствие лайка — не доказательство плохого звука. Одиночный неудачный дубль
не делает стиль или инструмент непригодным для остальных песен.

## 3. Стартовый литературный индекс

Это указатель на уже задействованные источники, не полный SOURCE LOCK всех
созданных песен. Перед новой компиляцией восстановить конкретную редакцию,
точные строки, локатор, разрешённые изменения и статус прав.

| Автор / произведение | Ссылка | Статус |
| --- | --- | --- |
| А. А. Фет, «Дифирамб на Новый год» | [РВБ, текст](https://rvb.ru/19vek/fet/bp/text/537.html) | Проверенный в прежней работе источник отдельных слов; полный ledger конкретного MASTER не восстановлен |
| А. А. Фет, «Скрип шагов вдоль улиц белых…» | [Текст, зафиксированный в CASES](https://ru.wikisource.org/w/index.php?title=Скрип_шагов_вдоль_улиц_белых_(Фет)&oldid=5618505) | Контрольный пример дикции; академическую редакцию и локатор перепроверить при новом выпуске |

Для остальных поэтов не создавать фиктивно заполненные пакеты по заголовкам Suno.
Добавлять реальные проверенные произведения в индекс или ссылаться на существующий
source ledger, не хранить несколько конкурирующих копий текста.

## 4. Открытый тематический каталог

Темы — многозначные метки поэтического материала, не правила музыки и не
обязательные новые workspace. Набор расширяем. Существующая новогодняя
серия — [NEW_YEAR_SERIES](NEW_YEAR_SERIES.md). Прочие темы ниже —
предложенные категории, не утверждение, что отдельные папки или релизы существуют.

- Новый год, зима, Рождество (сохранять различие светского и духовного смысла).
- Весна и возрождение; природа и времена года.
- Любовь, разлука, память; философская лирика.
- Родина, Россия; история и эпос.
- Юмор, кутёж, хулиганская поэзия.
- Трагедия, драма; духовная поэзия.
- Экспериментальные циклы и новые темы по запросу.

Один автор, произведение или трек может иметь несколько меток. Не
дублировать материал и не менять его фактическое размещение ради классификации.

## 5. Как продолжить работу с реальными приватными записями

Suno — доступный источник фактических идентификаторов и сохранённых промтов.
Для задачи по конкретному автору/серии сначала читать workspace/library,
проверять пагинацию и получить exact clip metadata. Не переносить весь
каталог в публичный Git. Если утверждено закрытое рабочее хранилище, сохранять
там карточки по схеме WORKBENCH: clip ID, parent ID, payload, SOURCE/MASTER,
модель/controls, состояние, выбор владельца, дефекты/таймкоды, аудио-QA и права.
Не выдумывать закрытый реестр или заполнять его приватными данными без
соответствующего места. Для ручного handoff допустим точечный экспорт
в закрытый пользовательский файл по запросу.
