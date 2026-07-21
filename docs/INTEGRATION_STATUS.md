# Integration status

This branch consolidates the unmerged editorial work from PR #29 with the custom-domain work from PR #30.

## Included

- Long-form essays about Vladimir Mayakovsky and the Briks.
- The expanded Yesenin essay and the verified poet-library changes.
- Moral-portrait data and the accompanying reusable component.
- Custom-domain canonical URLs for `https://thelegendarypoet.ru`.
- Generated sitemap coverage for static pages, poets, essays, and legacy articles.
- Pull-request CI, library validation, essay validation, type checking, build, and OG prerendering.
- A defensive engine guard against adjacent duplicate section headings.
- Safe default Open Graph artwork whenever an essay image is intentionally absent.

## Editorial policy now enforced

- `docs/EDITORIAL_JUDGMENT_AND_SOURCE_POLICY.md` defines righteous judgment by confession and fruits, strong but compassionate spiritual conclusions, the difference between possible and documented deathbed repentance, and the source hierarchy.
- `docs/HISTORICAL_NARRATIVE_STANDARD.md` requires history before conclusion: primary documents, chronology, literary analysis and humanly intelligible causation form the article body; biblical evaluation appears only where the evidence naturally requires it.
- `PROJECT_CHARTER.md` gives both policies priority over the authoring guide.
- Museums and memorial institutions may supply valuable documents but their commentary is treated as an interested interpretation, not as an automatically neutral authority.
- The project formula is: **accuracy without whitewashing, directness without sensationalism, compassion without sentimental falsehood**.

## Primary-source deepening completed so far

### Yesenin

- The romanticizing title “drunken angel” was removed.
- The duplicate “Moscow of Taverns” section was removed.
- Police history now uses the signed interrogation protocol of 21 November 1923 and the January 1924 detention papers instead of the late story about a special order to detain and release him.
- The final clinic stay is dated from academic commentary: 26 November to 21 December 1925.
- “The Black Man” is treated as a work developed from 1923 to 14 November 1925, not as a one-night hallucination or a medical chart.
- The full context of “I Have One Diversion Left” includes the request to die beneath icons and the admission of “unbelief in grace”; religious memory is distinguished from repentance.
- The imagist public campaign is documented through Yesenin’s own autobiographical statement and the chronicle of the painting of the Strastnoy Monastery walls.
- The “Stall of Pegasus” passage now uses the exact academic record of 52 signed café bills and Yesenin’s documented status as a co-owner.
- The conclusion remains direct about the rejection of the Cross, unbelief, absence of documented repentance and the spiritually terrible end, but it is built from the history rather than repeated throughout every section.

### Mayakovsky

- Museum commentary was removed from the role of a neutral historian.
- The reception of “The Bathhouse” is shown through Mayakovsky’s own letter: the audience “split almost comically”.
- The legend of a completely empty or universally boycotted “20 Years of Work” exhibition was corrected: the opening hall was crowded with young people and the exhibition later moved to the House of Komsomol in Krasnaya Presnya.
- Mayakovsky’s own exhibition declarations document that he voluntarily presented himself as a poet-agitator and poet-propagandist.
- The tension between the formula “the individual is zero” and his enormous lyrical “I” is shown through his own texts, not through a ready-made psychological verdict.
- The final letter now cites the academic Complete Works publication rather than a museum retelling.
- The funeral and the 1935 state canonization are described from the documentary chronicle and academic reference works.
- The spiritual conclusion identifies Revolution and the titanic self as false final hopes without reducing the suicide to a single historical or medical cause.

### The Briks

- The two-month separation is described from the published correspondence and letter-diary.
- Mayakovsky’s own words, “It has never been so hard for me,” are included.
- “Voluntary confinement” is neither turned into a literal arrest nor softened into a calm literary experiment; prison imagery is documented in his own letters and poem.
- The unsupported claim that he worked sixteen to twenty hours every day was removed.
- Osip Brik’s state-security service is stated directly from archival research: 8 June 1920 to 1 January 1924, investigator and authorized officer of the secret department, dismissed “as a deserter”.
- Letters document payments, household support and the 1928 automobile negotiations; they do not by themselves prove a secret financial motive.
- Creative collaboration and archive preservation are separated from moral justification: usefulness is not righteousness.
- Adultery is named directly; Osip’s consent did not turn the relationship into marriage.
- The late Voznesensky kitchen story remains explicitly marked as late, singly transmitted testimony rather than a contemporary transcript.

## Content regression protection

The essay validator now checks more than compilation:

- required documentary facts and quotations must remain in the rendered essay data;
- superseded legends and romanticizing formulations are forbidden from returning;
- museum or institutional material cannot be presented as a neutral historian voice;
- an essay cannot rely only on museum, exhibition or film sources;
- repeated section headings fail validation;
- excessive Scripture references outside the final reflection are flagged for possible mechanical insertion;
- source URLs, essay structure, TypeScript, sitemap generation, production build and social prerendering are checked in CI.

## Deliberately excluded

The unfinished Mayakovsky and Brik artwork from PR #29 is not present on this branch. The following paths remain reserved for final approved files:

- `public/images/essays/mayakovsky-gromovoy.jpg`
- `public/images/essays/mayakovsky-gromovoy-card.jpg`
- `public/images/essays/brik-case.jpg`
- `public/images/essays/brik-case-card.jpg`

Their absence is reported as a warning, not a build failure. Until final artwork is added, pages and social metadata use the site's existing graceful fallback.

## Merge status

PR #31 remains a draft. Do not merge it into `main` until the final images are prepared and the rendered pages receive a separate visual and editorial inspection.
