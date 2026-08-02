# Visual metadata corrections — pass 01

## YES-E06: Commons title/description is materially misleading

### File

`006__manuscript-yesenin__Автограф Сергея Есенина.png`

Commons landing page:

`https://commons.wikimedia.org/wiki/File:Автограф_Сергея_Есенина.png`

SHA-256:

`ce42d353f522cc9aeb56b79f950932fb80312576bacd6ecc3759cb8955d8900c`

### Metadata conflict

The Commons description says in Russian: `Автограф последнего стихотворения Есенина` and dates it only as before 1925. Visual inspection of the actual page shows the opening line:

> «Отчего луна так светит тускло…»

The manuscript is therefore not the separate final poem «До свиданья, друг мой, до свиданья…». It is a draft/autograph witness of «Отчего луна так светит тускло…» from the `Персидские мотивы` corpus.

### Academic control

The academic commentary to «Отчего луна так светит тускло…» records:

- first publication in `Бакинский рабочий`, 14 August 1925, no. 183;
- another publication in `Прожектор`, 30 September 1925, no. 18, p. 15;
- an incomplete draft autograph covering lines 1–20;
- a fair-copy autograph;
- both autograph witnesses held in RGALI and undated;
- the date August 1925 retained from the collected edition.

The visible Drive/Commons image contains twenty lines and corrections and is consistent with the academic description of the incomplete draft autograph, not with the last poem.

### Corrected internal identity

```yaml
internal_id: YES-E06
safe_title: "Черновой автограф «Отчего луна так светит тускло…», строки 1–20"
author: "Сергей Есенин"
date: "август 1925 — date of work retained by the academic edition; autograph itself undated"
work: "Отчего луна так светит тускло…"
cycle: "Персидские мотивы"
source_kind: "draft autograph reproduction"
archive_note: "academic commentary states draft and fair-copy autographs are in RGALI; exact object identifier must still be pinned"
commons_metadata_status: "MISIDENTIFIED-DESCRIPTION"
production_status: "HOLD-UNTIL-ARCHIVE-OBJECT-AND-RIGHTS-RECONFIRMED"
```

### Article assignment

- **Not Part I.** The text belongs to August 1925.
- Potentially Part II, chapter on the Caucasus / late poetry / `Персидские мотивы`.
- It may become a strong `right` portrait-document block or a restrained `full` document because corrections visibly show the writing process.
- Caption must not call it the final poem.
- The Commons description must not be copied into alt, caption, source library, SEO or VK text.

### Why the gate matters

This correction demonstrates why `APPROVED` archive packages remain subject to object-level fact checking. The license and hash were correctly preserved, but the descriptive identity inherited from Commons was wrong. Rights metadata and historical identification are independent verification tasks.
