// Source-led route ownership: existing painted cases and the full canonical
// extension are separate CI contours sharing one fail-closed inventory.
export const BASELINE_PAINTED_ROUTES = [
  { path: '/ratings', heading: 'читателей', minimumNodes: 159 },
  { path: '/poets/alexander-pushkin', heading: 'Пушкин', minimumNodes: 441 },
  { path: '/music', heading: 'Музыкой', minimumNodes: 66 },
  { path: '/articles', heading: 'Исследования', minimumNodes: 81 },
  { path: '/', heading: 'LEGENDARY', minimumNodes: 90 },
  { path: '/archive', heading: 'Архив', minimumNodes: 24 },
  { path: '/poets', heading: 'Лица', minimumNodes: 134 },
  { path: '/about', heading: 'О Проекте', minimumNodes: 44 },
  { path: '/editorial-policy', heading: 'Редакционная политика', minimumNodes: 39 },
  { path: '/privacy', heading: 'Политика конфиденциальности', minimumNodes: 41 },
  { path: '/hall', heading: 'Зал Поэтов', minimumNodes: 27 },
  { path: '/music/pushkin-tucha', heading: 'Туча', minimumNodes: 105 },
  { path: '/music/blok-rossiya', heading: 'Россия', minimumNodes: 105 },
  // Certified with the immersive player open. The player repaints the viewport,
  // so nothing of it was scored until the sweep understood dialogs — and it
  // carries the faintest ink in the music library. `open` is the accessible name
  // of the control that opens it; the guard is the dialog's own copy alone.
  { path: '/music/pushkin-tucha', heading: 'Туча', minimumNodes: 7, open: 'Погружение', dialog: true },
  { path: '/music/blok-rossiya', heading: 'Россия', minimumNodes: 7, open: 'Погружение', dialog: true },
  { path: '/poets/sergei-yesenin', heading: 'Сергей Есенин', minimumNodes: 527 },
  { path: '/poets/vladimir-mayakovsky', heading: 'Владимир Маяковский', minimumNodes: 412 },
  { path: '/essays/brik-case', heading: 'Маяковский и Брики', minimumNodes: 226 },
  { path: '/essays/sergei-yesenin-1921-1925', heading: 'Часть II', minimumNodes: 654 },
  { path: '/essays/vykhozhu-odin-ya-na-dorogu-lermontov', heading: 'Выхожу Один Я', minimumNodes: 166 },
  { path: '/route-audit-page-that-must-not-exist', heading: 'Страница Не Найдена', minimumNodes: 26 },
];

// Each minimumNodes is 90% of the smallest completed four-mode pixel census
// on exact Product main 63492c2 (2026-11-04), never a guessed fallback.
export const EXTENDED_PAINTED_ROUTES = [
  // Two-Prophets exact-head pixel census at 2f71771 (2026-11-05):
  // dark desktop 221, dark mobile 195, light desktop 228, light mobile 202.
  // 175 is floor(0.9 * 195), preserving the same measured render guard as all
  // other routes. All four cells had zero text and gradient contrast offenders.
  { path: "/essays/pushkin-lermontov-dva-proroka", heading: "Пушкин и Лермонтов", minimumNodes: 175 },
  { path: "/essays/simonov-syn-artillerista-realnaya-istoriya", heading: "\u041e\u0433\u043e\u043d\u044c", minimumNodes: 231 },
  { path: "/essays/galina-benislavskaya-yesenin-manuscripts-publishing-archive", heading: "\u0411\u0435\u043d\u0438\u0441\u043b\u0430\u0432\u0441\u043a\u0430\u044f", minimumNodes: 241 },
  { path: "/essays/yesenin-kutezhi", heading: "\u0415\u0441\u0435\u043d\u0438\u043d", minimumNodes: 306 },
  { path: "/essays/sergei-yesenin-1895-1921", heading: "\u0427\u0430\u0441\u0442\u044c I", minimumNodes: 529 },
  { path: "/essays/yesenin-duncan-first-meeting-documents", heading: "\u0410\u0439\u0441\u0435\u0434\u043e\u0440\u0430 \u0414\u0443\u043d\u043a\u0430\u043d", minimumNodes: 206 },
  { path: "/essays/mayakovsky-before-revolution", heading: "\u0427\u0430\u0441\u0442\u044c I", minimumNodes: 210 },
  { path: "/essays/mayakovsky-gromovoy", heading: "\u0427\u0430\u0441\u0442\u044c II", minimumNodes: 224 },
  { path: "/music/yesenin-ya-ustalym-takim-eshche-ne-byl", heading: "\u0443\u0441\u0442\u0430\u043b\u044b\u043c", minimumNodes: 106 },
  { path: "/poets/fyodor-tyutchev", heading: "\u0422\u044e\u0442\u0447\u0435\u0432", minimumNodes: 513 },
  { path: "/poets/mikhail-lermontov", heading: "\u041b\u0435\u0440\u043c\u043e\u043d\u0442\u043e\u0432", minimumNodes: 499 },
  { path: "/poets/boris-pasternak", heading: "\u041f\u0430\u0441\u0442\u0435\u0440\u043d\u0430\u043a", minimumNodes: 357 },
  { path: "/poets/afanasy-fet", heading: "\u0424\u0435\u0442", minimumNodes: 373 },
  { path: "/poets/nikolay-gumilev", heading: "\u0413\u0443\u043c\u0438\u043b\u0451\u0432", minimumNodes: 555 },
  { path: "/poets/anna-akhmatova", heading: "\u0410\u0445\u043c\u0430\u0442\u043e\u0432\u0430", minimumNodes: 330 },
  { path: "/poets/alexander-blok", heading: "\u0411\u043b\u043e\u043a", minimumNodes: 530 },
  // New canonical author pixel census 2026-11-07: four independent theme x viewport
  // cells per route (1440x1000 and 390x844, dark and light), min90=floor(0.9*min).
  { path: "/poets/marina-tsvetaeva", heading: "\u041c\u0430\u0440\u0438\u043d\u0430 \u0426\u0432\u0435\u0442\u0430\u0435\u0432\u0430", minimumNodes: 169 },
  { path: "/poets/osip-mandelstam", heading: "\u041e\u0441\u0438\u043f \u041c\u0430\u043d\u0434\u0435\u043b\u044c\u0448\u0442\u0430\u043c", minimumNodes: 162 },
  { path: "/poets/valery-bryusov", heading: "\u0412\u0430\u043b\u0435\u0440\u0438\u0439 \u0411\u0440\u044e\u0441\u043e\u0432", minimumNodes: 160 },
  { path: "/poets/nikolay-nekrasov", heading: "\u041d\u0438\u043a\u043e\u043b\u0430\u0439 \u041d\u0435\u043a\u0440\u0430\u0441\u043e\u0432", minimumNodes: 158 },
  { path: "/poets/konstantin-simonov", heading: "\u041a\u043e\u043d\u0441\u0442\u0430\u043d\u0442\u0438\u043d \u0421\u0438\u043c\u043e\u043d\u043e\u0432", minimumNodes: 164 },
  { path: "/poets/aleksey-konstantinovich-tolstoy", heading: "\u0410\u043b\u0435\u043a\u0441\u0435\u0439 \u041a. \u0422\u043e\u043b\u0441\u0442\u043e\u0439", minimumNodes: 153 },

];
