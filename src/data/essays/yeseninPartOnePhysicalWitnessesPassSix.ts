export type YeseninPartOnePassSixWitnessState =
  | 'academic-basis-identified'
  | 'exact-object-located'
  | 'serial-parent-located'
  | 'archive-collection-located'
  | 'request-required'
  | 'still-unresolved';

export type YeseninPartOnePassSixEvidenceLayer =
  | 'academic-commentary'
  | 'bibliographic-object'
  | 'digital-facsimile-route'
  | 'serial-catalogue'
  | 'archive-finding-aid'
  | 'civil-record-target';

export interface YeseninPartOnePhysicalWitnessPassSix {
  id: `PW6-YE1-${string}`;
  title: string;
  target: string;
  claimIds: readonly string[];
  state: YeseninPartOnePassSixWitnessState;
  layer: YeseninPartOnePassSixEvidenceLayer;
  institution: string;
  catalogueUrl?: string;
  exactLocator?: string;
  access:
    | 'open-web'
    | 'open-pdf-route'
    | 'open-viewer'
    | 'reading-room-or-copy-request'
    | 'not-yet-located';
  facsimileBytesAcquired: boolean;
  facsimileVisuallyInspected: boolean;
  archiveOriginalInspected: boolean;
  productionReuseAuthorized: false;
  articleUse: string;
  limitation: string;
}

/**
 * Physical-object queue after the 40+ deep-source pass.
 *
 * A catalogue card, academic transcription or archive finding aid never upgrades
 * itself to a visually inspected facsimile. Every record keeps those states
 * separate so public prose and documentary media cannot inherit false certainty.
 */
export const yeseninPartOnePhysicalWitnessesPassSix = [
  {
    id: 'PW6-YE1-MATERIALY-110',
    title: 'С. А. Есенин: Материалы к биографии, с. 110',
    target: 'Страница, на которую ПСС ссылается при реконструкции знакомства Есенина и Дункан',
    claimIds: ['YE1-027'],
    state: 'academic-basis-identified',
    layer: 'academic-commentary',
    institution: 'ФЭБ / ИМЛИ РАН',
    catalogueUrl: 'https://feb-web.ru/feb/esenin/critics/-g1992.html',
    exactLocator: 'Материалы к биографии, с. 110; издание 1992/1993, 446 с.',
    access: 'reading-room-or-copy-request',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Сохранять формулу ПСС «видимо, 3 октября», пока страница и её исходное свидетельство не проверены напрямую.',
    limitation: 'Библиографическая локализация не показывает текст страницы 110 и не доказывает синхронную запись о встрече.',
  },
  {
    id: 'PW6-YE1-BENISLAVSKAYA-DIARY-BASIS',
    title: 'Дневниковая запись Г. А. Бениславской от 3 октября 1922 года',
    target: 'Фраза о годовщине первой встречи Есенина с Дункан как вероятное основание календарной реконструкции',
    claimIds: ['YE1-027'],
    state: 'academic-basis-identified',
    layer: 'academic-commentary',
    institution: 'ФЭБ / комментарии к мемуарному корпусу',
    catalogueUrl: 'https://feb-web.ru/feb/esenin/critics/ev1/ev1-445-.htm?cmd=p',
    exactLocator: 'Комментарий цитирует запись 3 октября 1922 года: «Сегодня год, как он увидел А.»',
    access: 'open-web',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Объяснять происхождение даты как ретроспективного годовщинного указания, а не как протокола встречи 1921 года.',
    limitation: 'Пока не просмотрен автограф или факсимиле дневниковой страницы; комментарий остаётся академической публикацией.',
  },
  {
    id: 'PW6-YE1-MARIENGOF-1927',
    title: 'А. Б. Мариенгоф. Роман без вранья. Первое издание',
    target: 'Первое печатное оформление сцены знакомства в мастерской Георгия Якулова',
    claimIds: ['YE1-027'],
    state: 'exact-object-located',
    layer: 'bibliographic-object',
    institution: 'Российская государственная библиотека',
    catalogueUrl: 'https://search.rsl.ru/ru/record/01009215492',
    exactLocator: 'Ленинград: Прибой, 1927. 154 с. Шифры: ФБ P 106/97; P 106/95.',
    access: 'open-viewer',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Коллировать Yakulov-сцену с первым изданием и сохранить авторство Мариенгофа у каждой живописной детали.',
    limitation: 'Точные страницы сцены ещё не извлечены; мемуар не является стенограммой первой встречи.',
  },
  {
    id: 'PW6-YE1-MARIENGOF-1928',
    title: 'А. Б. Мариенгоф. Роман без вранья. Второе издание',
    target: 'Контроль возможных редакционных изменений сцены между изданиями 1927 и 1928 годов',
    claimIds: ['YE1-027'],
    state: 'exact-object-located',
    layer: 'digital-facsimile-route',
    institution: 'Российская государственная библиотека',
    catalogueUrl: 'https://search.rsl.ru/ru/record/01009198586',
    exactLocator: 'Ленинград: Прибой, 1928. 157 с.; открытая цифровая копия указана в карточке.',
    access: 'open-pdf-route',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Сравнить формулировки и композицию сцены с первым изданием.',
    limitation: 'До прямого постраничного сравнения нельзя утверждать отсутствие редакционных вариантов.',
  },
  {
    id: 'PW6-YE1-TEATRALNAYA-MOSKVA-1921',
    title: 'Театральная Москва, 1921',
    target: 'Номера 2, 7, 8 и 11–12 с объявлениями, программой и рецепцией московских выступлений Айседоры Дункан',
    claimIds: ['YE1-027'],
    state: 'serial-parent-located',
    layer: 'serial-catalogue',
    institution: 'НЭБ / Российская государственная библиотека',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_007920703/',
    exactLocator: 'Еженедельник, Москва, 1921–1922; шифр РГБ XX 70/31. В открытом перечне присутствуют 1921 № 1, 2, 3, 7, 8, 9–10; родительская запись сообщает № 1–12.',
    access: 'open-viewer',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Проверить программу 7 ноября, объявления школы и современную театральную хронику.',
    limitation: 'Точные issue IDs и страницы № 2, 7, 8, 11–12 ещё не сохранены; № 11–12 может потребовать отдельного запроса.',
  },
  {
    id: 'PW6-YE1-IZVESTIA-1921-SERIAL',
    title: 'Известия ВЦИК, 1921: цифровой сериальный корпус',
    target: 'Выпуски от 24 августа, 9 ноября и 23 ноября 1921 года',
    claimIds: ['YE1-027'],
    state: 'serial-parent-located',
    layer: 'serial-catalogue',
    institution: 'НЭБ / Российская государственная библиотека',
    catalogueUrl: 'https://rusneb.ru/catalog/000199_000009_013348831/',
    exactLocator: 'Родительская запись 1921 года; НЭБ выдаёт отдельные issue cards и прямые PDF-копии для выпусков серии.',
    access: 'open-viewer',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Проверить статью Луначарского 24 августа, отклики 9 ноября и текст Дункан 23 ноября.',
    limitation: 'Три точных выпуска и страницы ещё не идентифицированы безошибочно; поисковая выдача серии не заменяет issue-level inspection.',
  },
  {
    id: 'PW6-YE1-PRAVDA-1921-11-09',
    title: 'Правда, 9 ноября 1921 года',
    target: 'Синхронный газетный отклик на выступление Дункан 7 ноября',
    claimIds: ['YE1-027'],
    state: 'still-unresolved',
    layer: 'serial-catalogue',
    institution: 'РГБ / РНБ / газетные фонды',
    access: 'not-yet-located',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Использовать только после обнаружения точного московского выпуска и страницы.',
    limitation: 'Обычный веб-поиск смешивает московскую «Правду» с одноимёнными изданиями; точный объект не принят.',
  },
  {
    id: 'PW6-YE1-NYPL-DUNCAN-PROGRAM',
    title: 'Isadora Duncan programs and announcements, 1898–1929',
    target: 'Русская программа московского выступления 7 ноября 1921 года',
    claimIds: ['YE1-027'],
    state: 'archive-collection-located',
    layer: 'archive-finding-aid',
    institution: 'New York Public Library, Jerome Robbins Dance Division',
    catalogueUrl: 'https://digitalcollections.nypl.org/collections/isadora-duncan-programs-and-announcements',
    exactLocator: 'Shelf locator *MGZB-Res. ++ 93-8695; 1 box, ca. 110 pieces; languages include Russian.',
    access: 'reading-room-or-copy-request',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Подтвердить точную программу, порядок номеров, печатную дату и московскую площадку.',
    limitation: 'В публичной Digital Collections видны только четыре оцифрованных предмета, и московская программа 1921 года среди них не установлена.',
  },
  {
    id: 'PW6-YE1-NYPL-IRMA-DUNCAN',
    title: 'Irma Duncan Collection of Isadora Duncan materials',
    target: 'Русские материалы 1921–1924 годов и возможные программы/объявления московской школы',
    claimIds: ['YE1-027'],
    state: 'archive-collection-located',
    layer: 'archive-finding-aid',
    institution: 'New York Public Library, Jerome Robbins Dance Division',
    catalogueUrl: 'https://archives.nypl.org/dan/19640',
    exactLocator: 'Call number (S) *MGZMC-Res. 23; около 300 единиц; Russia 1921–1924.',
    access: 'reading-room-or-copy-request',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Искать программу, организационные бумаги школы и синхронные материалы русского периода.',
    limitation: 'Finding aid локализован, но отдельный item-level объект и права на копирование требуют запроса.',
  },
  {
    id: 'PW6-YE1-ISPOVED-1921',
    title: 'С. А. Есенин. Исповедь хулигана. Прижизненное издание',
    target: 'Обложка, титул/выходные данные, полный состав двенадцатистраничного издания и порядок текстов',
    claimIds: ['YE1-026'],
    state: 'exact-object-located',
    layer: 'digital-facsimile-route',
    institution: 'НЭБ / Российская национальная библиотека',
    catalogueUrl: 'https://rusneb.ru/catalog/000200_000018_RU_NLR_A1SV_46698/',
    exactLocator: 'Москва, 1921. [12] с.; 22 см. Код НЭБ 000200_000018_RU_NLR_A1SV_46698. На обложке № издания 68. PDF около 3 МБ.',
    access: 'open-pdf-route',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Зафиксировать физическую структуру книги и отделить дату текста 1920 года от библиографического 1921 года.',
    limitation: 'Карточка и маршрут PDF проверены, но PDF-байты не прошли независимый render-and-inspect из-за недоступности загрузчика в текущем прогоне.',
  },
  {
    id: 'PW6-YE1-REICH-DIVORCE',
    title: 'Бракоразводное дело С. А. Есенина и З. Н. Райх',
    target: 'Физическая запись/дело, различающее процесс 19 февраля и итоговую дату 5 октября 1921 года',
    claimIds: ['YE1-020', 'YE1-027'],
    state: 'request-required',
    layer: 'civil-record-target',
    institution: 'Архивный источник, указанный в академическом ПСС',
    catalogueUrl: 'https://feb-web.ru/feb/esenin/texts/e72/e72-266-.htm?cmd=p',
    exactLocator: 'Академическая публикация документов и комментарий; controlling facsimile и архивный лист ещё не получены.',
    access: 'reading-room-or-copy-request',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Развести начало/ход дела и юридически завершённый развод; не сводить семейную историю к одной дате.',
    limitation: 'ПСС — надёжная академическая публикация, но для изображения, подписи и дипломатического анализа нужен сам лист.',
  },
  {
    id: 'PW6-YE1-DUNCAN-MARRIAGE',
    title: 'Регистрация брака Сергея Есенина и Айседоры Дункан, 2 мая 1922 года',
    target: 'Запись гражданского состояния и сведения о последующей регистрации за границей',
    claimIds: ['YE1-027'],
    state: 'request-required',
    layer: 'civil-record-target',
    institution: 'Московский актовый/архивный источник, цитируемый академическим ПСС',
    catalogueUrl: 'https://feb-web.ru/feb/esenin/texts/e77/e77-357-.htm?cmd=p',
    exactLocator: 'Академическая дата 2 мая 1922 года; отдельная регистрация в Германии подтверждается перепиской и комментариями.',
    access: 'reading-room-or-copy-request',
    facsimileBytesAcquired: false,
    facsimileVisuallyInspected: false,
    archiveOriginalInspected: false,
    productionReuseAuthorized: false,
    articleUse: 'Отделить знакомство 1921 года от формального брака 1922 года и от второй зарубежной регистрации.',
    limitation: 'Факсимиле актовой записи и точный архивный шифр ещё не включены в пакет.',
  },
] as const satisfies readonly YeseninPartOnePhysicalWitnessPassSix[];
