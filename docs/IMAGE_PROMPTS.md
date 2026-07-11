# Промты для генерации изображений (GPT Image / DALL·E 3 / Midjourney)

Сеть этой сессии блокирует Wikimedia, поэтому реальные портреты подтянуть автоматически
нельзя. Ниже — готовые промты, чтобы сгенерировать аутентичные по духу изображения, и
инструкция, куда их класть. **Менять код не нужно** — компоненты уже читают файлы по этим путям.

## Как подставить (без правок кода)

1. Сгенерируйте изображение по промту ниже.
2. Сохраните в `public/images/<имя>.jpg` **с точно таким же именем**, как сейчас.
3. Рекомендованный размер портретов: **1000×1250 px (соотношение 4:5)**, JPG, до ~300 КБ.
4. Пересоберите проект (`npm run build`) — новые фото появятся автоматически.

> Историческая достоверность: все девять поэтов — реальные исторические лица. Для
> максимальной аутентичности лучше использовать **реальные общественно‑достояние портреты**
> (Wikimedia Commons: репродукции Кипренского, Тропинина, Альтмана и историческую
> фотографию — все в PD). Промты ниже нужны, если вы хотите единый стилизованный ряд.

## Общий стиль (добавляйте к каждому промту)

```
Dark, cinematic editorial portrait, museum-quality. Deep near-black background (#050505)
with a subtle cyan-blue rim light and faint warm gold key light. Painterly realism,
period-accurate clothing and hairstyle, dignified expression, head-and-shoulders,
looking slightly off-camera. Muted desaturated palette, fine film grain, 4:5 vertical.
No text, no watermark, no modern objects.
```

---

## Портреты поэтов → `public/images/<файл>.jpg`

**pushkin.jpg — Александр Пушкин (1799–1837)**
```
Portrait of Alexander Pushkin, early 1830s. Man ~32, olive complexion, curly dark
auburn side-whiskers, high forehead, expressive dark eyes, Romantic-era dark tailcoat
with a high white cravat. Based on the Kiprensky/Tropinin likeness. [+ общий стиль]
```

**lermontov.jpg — Михаил Лермонтов (1814–1841)**
```
Portrait of Mikhail Lermontov, late 1830s. Young man ~25, dark hair, prominent dark
eyes, small moustache, wearing a hussar/officer uniform of the Imperial Russian army
with epaulettes. Melancholic, intense gaze. [+ общий стиль]
```

**tyutchev.jpg — Фёдор Тютчев (1803–1873)**
```
Portrait of Fyodor Tyutchev, 1860s. Refined older man, thinning grey hair swept back,
clean-shaven gaunt face, round thin-rimmed spectacles, dark diplomat's frock coat and
cravat. Intellectual, contemplative. [+ общий стиль]
```

**fet.jpg — Афанасий Фет (1820–1892)**
```
Portrait of Afanasy Fet, 1880s. Elderly man with a full broad grey beard, balding,
heavy brows, dark buttoned coat. Solid, earthbound presence of a country landowner-poet.
[+ общий стиль]
```

**yesenin.jpg — Сергей Есенин (1895–1925)**
```
Portrait of Sergei Yesenin, early 1920s. Young man ~27, wavy light golden-blond hair,
blue eyes, soft boyish face, light shirt or a simple jacket. Fresh, lyrical, faintly
melancholic. [+ общий стиль]
```

**mayakovsky.jpg — Владимир Маяковский (1893–1930)**
```
Portrait of Vladimir Mayakovsky, 1920s. Powerful man ~30, very short cropped dark hair,
strong square jaw, clean-shaven, stern determined expression, dark jacket. Bold,
monumental, avant-garde energy. [+ общий стиль]
```

**akhmatova.jpg — Анна Ахматова (1889–1966)**
```
Portrait of Anna Akhmatova, 1910s. Elegant woman with dark hair with a fringe/bangs,
a distinctive aquiline profile, slender neck, draped shawl. Aristocratic, composed,
Silver-Age poetess. Based on the Altman/Modigliani-era likeness. [+ общий стиль]
```

**gumilev.jpg — Николай Гумилёв (1886–1921)**
```
Portrait of Nikolay Gumilyov, 1910s. Man ~30, elongated face, short-cropped light-brown
hair, thin lips, slightly asymmetric confident gaze, dark officer's or traveller's
jacket. Poised, adventurous, aristocratic-officer bearing. [+ общий стиль]
```

**pasternak.jpg — Борис Пастернак (1890–1960)**
```
Portrait of Boris Pasternak, 1920s–30s. Man ~40, thick dark hair, long expressive face,
full lips, large soulful eyes, open collar. Warm, intense, sensitive. [+ общий стиль]
```

---

## Опциональные брендовые ассеты

**og-image.jpg (1200×630)** — уже сгенерирован (`public/og-image.jpg`). Пересоздать:
`node scripts/gen-sitemap.mjs`? нет — см. `scratchpad/gen-assets.mjs` в сессии, или сверстайте заново.

**hero-bg.jpg (опционально, 2400×1400, для фона главной)**
```
Wide atmospheric header for a Russian poetry channel. Near-black scene, a dim study
with old leather-bound books and candlelight, faint cyan-blue haze, deep shadows,
cinematic, no people, no text. Moody, luxurious, editorial.
```

**Иконки статей (опционально, 1200×800) → `public/images/articles/<file>.jpg`**
Сейчас карточки статей используют аккуратную иконку-книгу (это не заглушка, а осознанное
оформление). Если захотите картинки — верните поле `image` в данные статьи и положите файлы:
`russian-soul.jpg`, `poetry-music.jpg`, `pushkin-bible.jpg`, `yesenin-tragedy.jpg`, `akhmatova-faith.jpg`.
```
Dark editorial illustration for an article about <тема>: symbolic, painterly, muted
palette with a single cyan-blue accent, no text, no faces of real people. 3:2.
```
