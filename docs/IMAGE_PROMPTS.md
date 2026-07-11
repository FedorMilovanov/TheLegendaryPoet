# Промты для генерации изображений (GPT Image / DALL·E 3 / Midjourney)

> **Статус:** все 10 портретов уже стоят в `public/images/` (набор GPT Image, присланный
> владельцем). Промты ниже сохранены как эталон стиля — для перегенерации или замены
> отдельного портрета. **Менять код не нужно** — компоненты читают файлы по этим путям.

Сеть этой сессии блокирует Wikimedia, поэтому реальные исторические портреты подтянуть
автоматически нельзя; ряд собран единым стилизованным набором.

## Как подставить (без правок кода)

1. Сгенерируйте изображение по промту ниже.
2. Сохраните в `public/images/<имя>.jpg` **с точно таким же именем**, как сейчас.
3. Рекомендованный размер портретов: **1000×1250 px (соотношение 4:5)**, JPG, до ~300 КБ.
4. Пересоберите проект (`npm run build`) — новые фото появятся автоматически.

> Историческая достоверность: все десять поэтов — реальные исторические лица. Для
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

**blok.jpg — Александр Блок (1880–1921)**
```
Portrait of Alexander Blok, 1900s–1910s. Man ~30, pale refined face, a halo of light
curly ash-brown hair, calm distant gaze, high collar and dark jacket. Aloof, tragic,
Symbolist "knight of the Beautiful Lady" bearing. [+ общий стиль]
```

---

## Опциональные брендовые ассеты

**Логотип (фигура в капюшоне) и og-image**
Сейчас логотип — векторный SVG (`src/components/BrandMark.tsx`, `public/favicon.svg`):
куколь-капюшон с острым верхом, покатые плечи плаща, тень вместо лица, складка-драпировка
по центру и голубой неоновый кант. og-image (`public/og-image.jpg`, 1200×630) генерируется
из него. Читается на всех размерах — от фавикона 32px до OG-обложки.

Если хотите СВОЙ логотип через GPT Image — вот детальный промт (сделайте квадрат
1024×1024 на прозрачном/чёрном фоне и пришлите, я вставлю его в шапку и пересоберу og-image):
```
A single mysterious hooded poet, front view, head and shoulders only, as a clean
minimal logo emblem. Deep cowl hood coming to a soft point; the face is a pure black
void — no features visible; broad draped cloak with a few elegant vertical folds
falling from the shoulders. Silhouette filled with a smooth gradient from icy white
at the top through cyan (#3fd4ff) to deep blue (#1858e6) at the hem, thin luminous
cyan rim-light along the left edge of the hood and shoulder, soft neon glow.
Centered on a pure near-black (#050810) background. Flat vector logo style, symmetrical,
timeless and premium, no text, no letters, no clutter, no realistic face. Square 1:1.
```
Отдельно, если хотите готовую **обложку 1200×630** (og/баннер) целиком из GPT Image:
```
Wide 1200x630 social banner, near-black cinematic background with a faint cyan glow
in the upper-right. On the left, a mysterious hooded cloaked poet emblem (face hidden
in shadow, cyan-to-blue gradient, neon rim light). To its right, elegant serif title
"THE LEGENDARY POET" in white with the word LEGENDARY glowing cyan, a small uppercase
tracked-out subtitle above it. Luxurious, editorial, dark-luxury aesthetic. Leave the
composition airy. Russian tagline space at the bottom. No watermark.
```

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
