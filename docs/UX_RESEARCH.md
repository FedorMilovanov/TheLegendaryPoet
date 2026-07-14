# UX-исследование: паттерны топовых издательских/люкс-сайтов (2023–2026)

Свод из 36 источников, собранный для развития THE LEGENDARY POET. Принцип
отбора: **убирать UI, а не добавлять**; минимализм, премиальность, ноль
фичей-ради-фичей. Ниже — что уже внедрено, что в очереди, и полный список
ссылок.

## Внедрено (см. коммиты)

| Паттерн | Где | Источник-обоснование |
|---|---|---|
| Auto-hide хрома при чтении (скролл вниз — интерфейс прячется, вверх — возвращается) | `useAutoHideChrome` + CSS `chrome-hidden` (шапка, док, прогресс, кнопки) | NN/g Sticky Headers; CodyHouse Auto-Hiding Navigation; Motion.dev |
| Чип текущей главы + оглавление на мобилке (только в режиме чтения) | `essay/SectionChip.tsx`, Popover API | NN/g Table of Contents; web.dev Popover API |
| Прогресс чтения на CSS scroll-driven animations (без JS-листенера, с фолбэком) | `ReadingProgress.tsx` + `@supports (animation-timeline: scroll())` | MDN scroll-progress; Chrome/WebKit docs; scroll-driven-animations.style |
| `text-wrap: pretty` для прозы (убирает висячие слова) | глобально в `index.css` | Chrome blog text-wrap:pretty; WebKit 16547 |
| Настоящий drop-cap через `initial-letter` (+float-фолбэк) | `.essay-lead` | Chrome initial-letter |
| `hanging-punctuation: first` для стихов (Safari-прогрессив) | `.poetry-text` | Chris Coyier hanging-punctuation |
| Один поиск на мобилке (дубль в шапке убран — линза живёт в доке) | `Header.tsx` | Thumb-zone UX (Parachute) |
| Без tap-highlight на тач-устройствах | `index.css` | luxury-минимализм |

## Очередь (по мере роста сайта)

1. **View Transitions API** на смену framer-переходов между страницами +
   shared-element портрет поэта (карточка → страница). Baseline 2025. (M)
2. **Дисциплина шрифтов**: self-host сабсетов, срезать неиспользуемые веса
   3 семейств, `size-adjust` фолбэк — главный резерв perceived-perf. (M)
3. **«Поделиться строкой»**: ссылки с `#:~:text=` + золотой `::target-text`
   — подсветка конкретной строки стихотворения. Фирменная фича для поэзии. (S)
4. **Sidenotes по Тафти** для примечаний эссе (≥1280px на полях, на мобилке
   popover). Когда появятся сноски в контенте. (M)

## Анти-паттерны (не делать)

- Никаких колец прогресса, процентов, геймификации чтения — потолок: волосок 2px.
- Не скрывать скроллбар полностью; тонкий тонированный — люкс, невидимый — потеря юзабилити.
- Скелетоны при загрузке <800мс — шум; только blur-up для hero-изображений.
- Не смешивать Lenis со scroll-snap (документированный конфликт).
- Без третьей гарнитуры, без чистых #000/#fff пар, без второго насыщенного акцента кроме золота.
- Web-haptics для дока — мертвы на iOS Safari; не вкладываться.
- Тяжёлый film-grain через mix-blend-mode на скролл-контейнерах — paint-cost; только статичный SVG-noise data-URI.

## Источники (36)

1. Sticky Headers: 5 Ways to Make Them Better — NN/g — https://www.nngroup.com/articles/sticky-headers/
2. Auto-Hiding Navigation — CodyHouse — https://codyhouse.co/gem/auto-hiding-navigation
3. Scroll Direction: Hide Header — Motion.dev — https://motion.dev/tutorials/react-scroll-hide-header
4. Reading Position Indicator — CSS-Tricks — https://css-tricks.com/reading-position-indicator/
5. Progress indicator as scroll bar: pros/cons — UX Collective — https://uxdesign.cc/pros-and-cons-of-progress-indicator-as-a-scroll-bar-345f19967cb6
6. Estimated reading times increase engagement — MarTech — https://martech.org/estimated-reading-times-increase-engagement/
7. Distraction-free reading experiences — A. Zumbrunnen — https://azumbrunnen.me/blog/creating-distraction-free-reading-experiences/
8. Table of Contents: Design Guide — NN/g — https://www.nngroup.com/articles/table-of-contents/
9. Designing Sticky Menus — Smashing — https://www.smashingmagazine.com/2023/05/sticky-menus-ux-guidelines/
10. Scroll progress animations in CSS — MDN — https://developer.mozilla.org/en-US/blog/scroll-progress-animations-in-css/
11. Intro to CSS Scroll-Driven Animations — Smashing — https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/
12. Scroll-driven animations — Chrome — https://developer.chrome.com/docs/css-ui/scroll-driven-animations
13. Scroll-driven animations, just CSS — WebKit — https://webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/
14. Progress bar demo — scroll-driven-animations.style — https://scroll-driven-animations.style/demos/progress-bar/css/
15. Section-based scroll progress — Frontend Masters — https://frontendmasters.com/blog/using-css-scroll-driven-animations-for-section-based-scroll-progress-indicators/
16. caniuse: scroll-driven animations — https://caniuse.com/wf-scroll-driven-animations
17. View Transition API — MDN — https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
18. View transitions in 2025 — Chrome — https://developer.chrome.com/blog/view-transitions-in-2025
19. caniuse: View Transitions — https://caniuse.com/view-transitions
20. View Transitions SPA without framework — DebugBear — https://www.debugbear.com/blog/view-transitions-spa-without-framework
21. text-wrap: balance — Chrome — https://developer.chrome.com/docs/css-ui/css-text-wrap-balance
22. text-wrap: pretty — WebKit — https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/
23. text-wrap: pretty — Chrome — https://developer.chrome.com/blog/css-text-wrap-pretty
24. The Undeniable Utility of CSS :has — J. Comeau — https://www.joshwcomeau.com/css/has/
25. Popover API lands in Baseline — web.dev — https://web.dev/blog/popover-api
26. ::target-text — MDN — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::target-text
27. ::target-text for highlighting — T. Lasn — https://www.trevorlasn.com/blog/css-target-text
28. Scrollbars styling — MDN — https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scrollbars_styling
29. reading-flow ships in Chrome 137 — R. Andrew — https://rachelandrew.co.uk/archives/2025/05/02/reading-flow-ships-in-chrome-137/
30. C39 prefers-reduced-motion — W3C WAI — https://www.w3.org/WAI/WCAG22/Techniques/css/C39
31. Thumb Zone UX — Parachute — https://parachutedesign.ca/blog/thumb-zone-ux/
32. Safe Area Insets — M. Shehadeh — https://mohammadshehadeh.com/css/safe-area-insets/
33. Vibration API support — TestMu — https://www.testmuai.com/learning-hub/vibration-api-browser-support/
34. Drop caps via initial-letter — Chrome — https://developer.chrome.com/blog/control-your-drop-caps-with-css-initial-letter
35. Tufte CSS — https://edwardtufte.github.io/tufte-css/ ; Sidenotes — Gwern — https://gwern.net/sidenote
36. Optimal Line Length — Baymard — https://baymard.com/blog/line-length-readability ; webtypography.net 2.1.2 — http://webtypography.net/2.1.2

Доп.: hanging-punctuation (Coyier) — https://chriscoyier.net/2023/11/27/the-hanging-punctuation-property-in-css/ ;
Pull Quotes — Hoefler&Co — https://www.typography.com/blog/pull-quotes ;
Luxury principles — Soley — https://www.soleycreative.com/studio-notes/what-makes-a-website-luxury-design-principles-that-sell-premium-products ;
Feel expensive — IIAD — https://www.iiad.edu.in/the-circle/why-some-websites-just-feel-expensive/ ;
Inclusive Dark Mode — Smashing 2025 — https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/ ;
Skeleton Screens 101 — NN/g — https://www.nngroup.com/articles/skeleton-screens/ ;
Blurry placeholders — Mux — https://www.mux.com/blog/blurry-image-placeholders-on-the-web ;
Font best practices — web.dev — https://web.dev/articles/font-best-practices ;
Layout shifts from webfonts — S. Hearne — https://simonhearne.com/2021/layout-shifts-webfonts/ ;
Optimize LCP — web.dev — https://web.dev/articles/optimize-lcp ;
fetchpriority — A. Osmani — https://addyosmani.com/blog/fetch-priority/ ;
Font size guidelines — learnui.design — https://www.learnui.design/blog/mobile-desktop-website-font-size-guidelines.html
