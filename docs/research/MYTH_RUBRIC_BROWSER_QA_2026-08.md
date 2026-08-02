# Myth rubric — Browser QA contract

**Component:** source-backed `note.variant = myth`  
**Scope:** desktop, Android Chrome, iPhone Safari, reduced motion and print-like reading conditions

## Semantic contract

- The card renders as an `aside`, because it supplements the main argument without replacing it.
- The circulated claim is visible as a quotation, not restated by the project as a fact.
- The verdict is readable as text; colour is never the only carrier of meaning.
- The section `Что показывают документы` follows the claim and origin.
- Inline source markers remain keyboard-accessible and use the shared citation implementation.
- The card does not add a table-of-contents entry or a duplicate heading anchor.

## Verdict labels

| Internal value | Reader label |
|---|---|
| `false` | Не подтверждается |
| `partly-true` | Частично верно |
| `disputed` | Спорно |
| `unproven` | Не доказано |

The label must never be replaced with an icon-only verdict.

## Desktop checks

- [ ] claim line wraps without an isolated closing quote;
- [ ] verdict badge does not overlap the eyebrow at 1024–1440 px;
- [ ] long origin text remains subordinate to the claim;
- [ ] source markers follow the final documentary paragraph;
- [ ] four consecutive cards remain visually distinguishable but not garish;
- [ ] card width does not exceed the prose measure unexpectedly;
- [ ] card clears a preceding floated image;
- [ ] a following section heading starts below the card.

## Android Chrome

Target widths: 360, 393 and 412 CSS px.

- [ ] claim is not smaller than surrounding body text in perceived hierarchy;
- [ ] verdict badge wraps to a separate line rather than shrinking below legibility;
- [ ] 24 px minimum side padding remains after device safe-area effects;
- [ ] there is no horizontal overflow from quotation punctuation or long compounds;
- [ ] inline citations have a touch target consistent with the shared citation component;
- [ ] colour contrast remains adequate under low screen brightness.

## iPhone Safari

Target widths: 375 and 430 CSS px.

- [ ] dynamic font scaling does not overlap claim, verdict or origin;
- [ ] the left status rule remains inside the rounded frame;
- [ ] quoted claim does not trigger accidental smart-link styling;
- [ ] source popover/dialog remains within the visual viewport;
- [ ] returning from a source link preserves the article position where possible;
- [ ] no clipped descenders in Russian text at large accessibility font size.

## Reduced motion

The myth card itself has no looping or attention-seeking animation. It may enter through the shared `Reveal` wrapper, which must respect reduced-motion settings. Verdict colour is static; no pulsing, shaking or celebratory transition is permitted.

## Content stress cases

Test at least:

1. a short false claim;
2. a two-line unproven claim;
3. an origin longer than 180 characters;
4. two documentary paragraphs;
5. three inline citations;
6. four cards in one article;
7. a card immediately after an image floated left and right;
8. a card before the final biblical reflection.

## Failure conditions

- verdict understandable only through colour;
- claim visually indistinguishable from the project’s own assertion;
- card published without stable source IDs;
- origin presented as the proof;
- `unproven` styled as a softer synonym for `false`;
- the card dominates the article more strongly than a section heading;
- mobile overflow or source popover clipping;
- myth wording reappears uncorrected in SEO, cover text or VK announcement.

## Current first implementation target

Article: `vykhozhu-odin-ya-na-dorogu-lermontov`

Cards:

- alleged night-before-duel prophecy — `unproven`;
- direct wish for death — `false`;
- religious line as proof of full Christian confession — `unproven`.
