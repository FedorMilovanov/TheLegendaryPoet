export type YeseninBenislavskayaProvenanceCategory =
  "autograph"
  | "autograph-draft"
  | "chronicle-from-lost-volpin-lists"
  | "chronicle-linked-to-lost-volpin-lists"
  | "named-hand-copy"
  | "photocopy-of-autograph"
  | "prior-publication"
  | "prior-publication-from-lost-volpin-list-and-original"
  | "telegram-draft"
  | "telegram-original"
  | "typescript-copy-original-unknown";

export interface YeseninBenislavskayaProvenanceRecord {
  sequence: number;
  documentNumber: number;
  dateLabel: string;
  printedPage: number;
  coRecipient: string | null;
  category: YeseninBenislavskayaProvenanceCategory;
  sourceFormula: string;
  sectionHtmlBytes: number;
  sectionVisibleSha256: string;
}

export const yeseninBenislavskayaProvenanceEnvelopePassTwentyThree = {
  "runId": 30174202283,
  "exactHead": "ec4392ce5b8e02f1a4daf9be3172723de10a73c5",
  "artifactId": 8623752441,
  "artifactDigest": "df2b5b4b32feb8ccf7a8dbfe4ec9196980e37d0cce58b39656b88fccc5b42aa6",
  "commentsUrl": "https://feb-web.ru/feb/esenin/texts/es6/es6-233-.htm?cmd=p",
  "commentsHtmlBytes": 1132285,
  "commentsHtmlSha256": "aeb225d31c35ae52a9d44e06fd37d070bbd547b2c0f9c432b69bb51640ae4124",
  "commentsVisibleTextSha256": "efc2cb78b2cc83acdd6e0468e321a64d0b3859dcdfff6425fa133673249ec383",
  "mainSectionCount": 257,
  "selectedSectionCount": 35,
  "recordMatrixDigest": "546354f99e937e8f3da38192fe689c18529c27f3994c8228f3a0127ce7f18c13"
} as const;

export const yeseninBenislavskayaProvenanceCategoryCountsPassTwentyThree = {
  "autograph": 1,
  "autograph-draft": 1,
  "chronicle-from-lost-volpin-lists": 1,
  "chronicle-linked-to-lost-volpin-lists": 1,
  "named-hand-copy": 1,
  "photocopy-of-autograph": 22,
  "prior-publication": 4,
  "prior-publication-from-lost-volpin-list-and-original": 1,
  "telegram-draft": 1,
  "telegram-original": 1,
  "typescript-copy-original-unknown": 1
} as const;

export const yeseninBenislavskayaProvenanceRecordsPassTwentyThree: readonly YeseninBenislavskayaProvenanceRecord[] = [
  {
    "sequence": 1,
    "documentNumber": 109,
    "dateLabel": "5 октября 1921 г.",
    "printedPage": 127,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 4496,
    "sectionVisibleSha256": "c2e076f3de2553208559d84b17f4b09ab0a4b954d541326827fb37ade2c9748d"
  },
  {
    "sequence": 2,
    "documentNumber": 119,
    "dateLabel": "8 мая 1922 г.",
    "printedPage": 136,
    "coRecipient": null,
    "category": "named-hand-copy",
    "sourceFormula": "Печатается по копии рукой С. А. Толстой-Есениной (ГЛМ).",
    "sectionHtmlBytes": 2778,
    "sectionVisibleSha256": "8985c4359fe7d8e9341daba409922e5a3c578243f7d744f3e9dde332322feaba"
  },
  {
    "sequence": 3,
    "documentNumber": 139,
    "dateLabel": "8 сентября 1923 г.",
    "printedPage": 159,
    "coRecipient": null,
    "category": "autograph",
    "sourceFormula": "Печатается по автографу (ИМЛИ).",
    "sectionHtmlBytes": 453,
    "sectionVisibleSha256": "d5fb4628772b45d082490046ccd1495903cfd54b4014bb22b4f9c479f3785f35"
  },
  {
    "sequence": 4,
    "documentNumber": 141,
    "dateLabel": "Сентябрь 1923 г.",
    "printedPage": 160,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 2522,
    "sectionVisibleSha256": "ad4b655f0f54b63cb2c74a24b0ea56a805a0cd572b4e490da15d72d0cd421360"
  },
  {
    "sequence": 5,
    "documentNumber": 142,
    "dateLabel": "Сентябрь 1923 г.",
    "printedPage": 160,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 2058,
    "sectionVisibleSha256": "c10d95a7f99dd768eda1244babc8736efe095b1a5ab37ec6bfade3d0453a53ff"
  },
  {
    "sequence": 6,
    "documentNumber": 156,
    "dateLabel": "15 апреля 1924 г.",
    "printedPage": 166,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 9342,
    "sectionVisibleSha256": "d7aeaa5ea368a7826ca9958f58ed961de7e4bbe11eaffc311d50afa1cbd1c922"
  },
  {
    "sequence": 7,
    "documentNumber": 157,
    "dateLabel": "26 апреля 1924 г.",
    "printedPage": 167,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 2282,
    "sectionVisibleSha256": "d03b5a6cee599583485c9a5c5a59a8361c4c6f9549ca6935c6a1cabf71ca72bb"
  },
  {
    "sequence": 8,
    "documentNumber": 158,
    "dateLabel": "Начало мая 1924 г.",
    "printedPage": 167,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 4773,
    "sectionVisibleSha256": "fef6c8402a006b40c7bfb8abfc1c582070c5ae547a69ba3a5da59f5f7a8662c2"
  },
  {
    "sequence": 9,
    "documentNumber": 162,
    "dateLabel": "15 июля 1924 г.",
    "printedPage": 170,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 2012,
    "sectionVisibleSha256": "edb4234354530f1da0d1d7d3a547bbf6b7877c77f9eff6528e0d50bb8ca1719c"
  },
  {
    "sequence": 10,
    "documentNumber": 163,
    "dateLabel": "26 июля 1924 г.",
    "printedPage": 170,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 2024,
    "sectionVisibleSha256": "4c48559360f536c333f869c8deaf417690f10fcce16e5c98d9d1d01f2e0a2c48"
  },
  {
    "sequence": 11,
    "documentNumber": 169,
    "dateLabel": "Август 1924 г. — 1925 г.",
    "printedPage": 175,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 1612,
    "sectionVisibleSha256": "3024e7c852d37daf8dfcc25818179d51364f495fff2b5f0a547ca7ab3c01e33f"
  },
  {
    "sequence": 12,
    "documentNumber": 179,
    "dateLabel": "17 октября 1924 г.",
    "printedPage": 179,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 20012,
    "sectionVisibleSha256": "fa29e5efaded8e52dada575417b83f079cc45c3f887028531c91d447ab0330b8"
  },
  {
    "sequence": 13,
    "documentNumber": 180,
    "dateLabel": "20 октября 1924 г.",
    "printedPage": 180,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 8102,
    "sectionVisibleSha256": "e59ffda5dc34f54087101d75290ee7131d74893032569f7b224e54d7389cc947"
  },
  {
    "sequence": 14,
    "documentNumber": 183,
    "dateLabel": "29 октября 1924 г.",
    "printedPage": 183,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 5520,
    "sectionVisibleSha256": "1767544e11cc98dee3263cf08d201770c587eb7159724a10513d58eaa019a204"
  },
  {
    "sequence": 15,
    "documentNumber": 184,
    "dateLabel": "После 2 ноября 1924 г.",
    "printedPage": 184,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 8190,
    "sectionVisibleSha256": "eeec79339c1c6fe023386fdcfd576d7fb72e99f2044a893ed4acfcfeb5102b7e"
  },
  {
    "sequence": 16,
    "documentNumber": 186,
    "dateLabel": "Между 3 и 6 декабря 1924 г.",
    "printedPage": 186,
    "coRecipient": null,
    "category": "telegram-draft",
    "sourceFormula": "Печатается по черновику телеграммы (РГАЛИ, ф. Г. В. Бебутова).",
    "sectionHtmlBytes": 4067,
    "sectionVisibleSha256": "4d9b6e66fd4320cc65580df36bcce09a4208d7d347d1427aeb17ef7e6c7a7ca1"
  },
  {
    "sequence": 17,
    "documentNumber": 187,
    "dateLabel": "12 декабря 1924 г.",
    "printedPage": 186,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 21081,
    "sectionVisibleSha256": "899e484a64167814190d61a95c0cd4873d393d8f13dd23072d754502a4ab32a9"
  },
  {
    "sequence": 18,
    "documentNumber": 188,
    "dateLabel": "Между 13 и 15 декабря 1924 г.",
    "printedPage": 187,
    "coRecipient": null,
    "category": "typescript-copy-original-unknown",
    "sourceFormula": "Печатается по машинописной копии (РГАЛИ); в текст введены конъектуры, необходимые для его понимания. Подлинник телеграммы неизвестен.",
    "sectionHtmlBytes": 5980,
    "sectionVisibleSha256": "33cfeb6b3a105926e8b9c846eae742574ebfa32ba20341f74c4bb77a7c19c479"
  },
  {
    "sequence": 19,
    "documentNumber": 191,
    "dateLabel": "17 декабря 1924 г.",
    "printedPage": 189,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 9993,
    "sectionVisibleSha256": "dc4681a97c7193681a3573f1db4dbed62c316a82d28d9c7b5a6dbe1bd5784207"
  },
  {
    "sequence": 20,
    "documentNumber": 192,
    "dateLabel": "20 декабря 1924 г.",
    "printedPage": 191,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 21181,
    "sectionVisibleSha256": "18b7c6caaf1a2dee9c7ae8c80fdbeb6f9bc5464e49a159556f8c41f3bd5206ed"
  },
  {
    "sequence": 21,
    "documentNumber": 197,
    "dateLabel": "20 января 1925 г.",
    "printedPage": 197,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 9548,
    "sectionVisibleSha256": "d6f13dd7f222e3d6c4b51736afbadea0c6c0140f8ac1cba11af32b01f394f6b9"
  },
  {
    "sequence": 22,
    "documentNumber": 200,
    "dateLabel": "До 12 (?) или 13 (?) февраля 1925 г.",
    "printedPage": 201,
    "coRecipient": null,
    "category": "chronicle-from-lost-volpin-lists",
    "sourceFormula": "Печатается по Хронике, 2, 170, где воспроизведены как текст, так и адрес. Согласно Хронике (2, 333—336), источниками текстов данной и последующих пяти телеграмм (пп. 200—205) были их списки, выполненные В. И. Вольпиным. Местонахождение этих списков (и подлинников телеграмм) ныне неизвестно.",
    "sectionHtmlBytes": 2606,
    "sectionVisibleSha256": "96f1f293930981dee24711d240a589f0f61acdaf0b08301ecd5ee04badad70fd"
  },
  {
    "sequence": 23,
    "documentNumber": 202,
    "dateLabel": "Между 12 (13?) и 17 (18?) февраля 1925 г.",
    "printedPage": 201,
    "coRecipient": null,
    "category": "prior-publication",
    "sourceFormula": "Печатается по первой публикации. Об источнике текста см. коммент. к п. 200.",
    "sectionHtmlBytes": 3970,
    "sectionVisibleSha256": "00670389c03e01470e7ccac4ebde4d9e81a7023fe2b76af519e4dfa2f568136c"
  },
  {
    "sequence": 24,
    "documentNumber": 203,
    "dateLabel": "17 или 18 февраля 1925 г.",
    "printedPage": 202,
    "coRecipient": null,
    "category": "prior-publication",
    "sourceFormula": "Печатается по публикации полного текста. О его источнике см. коммент. к п. 200.",
    "sectionHtmlBytes": 1916,
    "sectionVisibleSha256": "e8cb88a0b13f2505f1d27555e835e2dafb16cf72afe4659bf8ebc182bbf79118"
  },
  {
    "sequence": 25,
    "documentNumber": 204,
    "dateLabel": "21 февраля 1925 г.",
    "printedPage": 202,
    "coRecipient": null,
    "category": "chronicle-linked-to-lost-volpin-lists",
    "sourceFormula": "Печатается по Хронике, 2, 171, с расстановкой знаков препинания. Об источнике текста см. коммент. к п. 200.",
    "sectionHtmlBytes": 2567,
    "sectionVisibleSha256": "d7d7dc267ce6fbdd0e300902065f3500e24df4931e1452ba60b4636a615bcc92"
  },
  {
    "sequence": 26,
    "documentNumber": 205,
    "dateLabel": "26 февраля 1925 г.",
    "printedPage": 202,
    "coRecipient": null,
    "category": "prior-publication",
    "sourceFormula": "Печатается по первой публикации. Об источнике текста см. коммент. к п. 200.",
    "sectionHtmlBytes": 851,
    "sectionVisibleSha256": "a3f0129425ef9c41aa2bf146163985d5fa63154c61bd3c17f99f1dc9b853a8b1"
  },
  {
    "sequence": 27,
    "documentNumber": 209,
    "dateLabel": "21 марта 1925 г.",
    "printedPage": 207,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 6449,
    "sectionVisibleSha256": "b1a02c1655436caf77b0fbaca0e5c5acc8c83f30f1832e7db1a506c321d0186b"
  },
  {
    "sequence": 28,
    "documentNumber": 212,
    "dateLabel": "До 8 апреля 1925 г.",
    "printedPage": 208,
    "coRecipient": null,
    "category": "prior-publication",
    "sourceFormula": "Печатается и датируется по первой публикации (с расстановкой знаков препинания). По свидетельству В. Г. Белоусова, ее источником был список, сделанный В. И. Вольпиным (Хроника, 2, 342). Местонахождение этого списка неизвестно.",
    "sectionHtmlBytes": 1039,
    "sectionVisibleSha256": "eb0822c214821ae4482842a4f29eb520c667ff6df02391458720a9b57ef81288"
  },
  {
    "sequence": 29,
    "documentNumber": 213,
    "dateLabel": "8 апреля 1925 г.",
    "printedPage": 209,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ). Письмо написано на служебных бланках «Редактор газеты &bdquo;Бакинский рабочий&ldquo;».",
    "sectionHtmlBytes": 10702,
    "sectionVisibleSha256": "7ecb5893af4ee7693689f73940f7d2e0f0f39e5c8928adce0ed7d5ae284630d8"
  },
  {
    "sequence": 30,
    "documentNumber": 215,
    "dateLabel": "22 апреля 1925 г.",
    "printedPage": 211,
    "coRecipient": "Е. А. Есениной",
    "category": "prior-publication-from-lost-volpin-list-and-original",
    "sourceFormula": "Печатается по первой публикации (с расстановкой знаков препинания, частично указанных там словами «точка» или «двоеточие»). Источником текста был список, сделанный В. И. Вольпиным с подлинника телеграммы (Хроника, 2, 183). Ни подлинник, ни список В. И. Вольпина с него ныне неизвестны.",
    "sectionHtmlBytes": 2280,
    "sectionVisibleSha256": "7a8f7b60b52624f333d351d7f35eef6da0c895858b01484835f8a31d03d50553"
  },
  {
    "sequence": 31,
    "documentNumber": 217,
    "dateLabel": "Конец апреля — начало мая 1925 г.",
    "printedPage": 211,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ). Письмо не полное: известна лишь пятая страница по есенинской пагинации — «5», написанная на служебном бланке «Редактор газеты &bdquo;Бакинский рабочий&ldquo;».",
    "sectionHtmlBytes": 2525,
    "sectionVisibleSha256": "d5bc0becfaa930f69118ad381aea161be260f958adf270b25e2f8030472cac21"
  },
  {
    "sequence": 32,
    "documentNumber": 218,
    "dateLabel": "5 мая 1925 г.",
    "printedPage": 212,
    "coRecipient": null,
    "category": "telegram-original",
    "sourceFormula": "Печатается по подлиннику телеграммы (ГЛМ).",
    "sectionHtmlBytes": 799,
    "sectionVisibleSha256": "eb42f935542daf5fae0584670de26daf229ce1a914731098d8511ef339c121e1"
  },
  {
    "sequence": 33,
    "documentNumber": 219,
    "dateLabel": "11—12 мая 1925 г.",
    "printedPage": 212,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 10493,
    "sectionVisibleSha256": "a36d034df10ef4c150963dec1523d4d9ec71c59907eeefb7ccb1988da14fd4db"
  },
  {
    "sequence": 34,
    "documentNumber": 220,
    "dateLabel": "12 мая 1925 г.",
    "printedPage": 214,
    "coRecipient": null,
    "category": "photocopy-of-autograph",
    "sourceFormula": "Печатается по фотокопии автографа (ИМЛИ).",
    "sectionHtmlBytes": 865,
    "sectionVisibleSha256": "5e1928b78236606ce85c836e3097f25b26688f6c34e60073997ece3630ed7e41"
  },
  {
    "sequence": 35,
    "documentNumber": 222,
    "dateLabel": "25 мая 1925 г.",
    "printedPage": 215,
    "coRecipient": null,
    "category": "autograph-draft",
    "sourceFormula": "Печатается по автографу — черновику телеграммы (РГАЛИ, ф. П. И. Чагина).",
    "sectionHtmlBytes": 1776,
    "sectionVisibleSha256": "7151cef36e064d28350903d4501f7e793ef4999c82d169506384f1cc575a2e92"
  }
] as const;

export const yeseninBenislavskayaProvenanceBoundariesPassTwentyThree = {
  formulasAreAcademicCommentary: true,
  archiveOriginalsInspected: false,
  facsimilesAcquired: false,
  inboundFourteenTextsAcquired: false,
  diplomaticTranscriptionMade: false,
  ocrUsed: false,
  syntheticContentUsed: false,
  productionAuthorized: false,
  articlePublished: false,
  articleRegistered: false,
  wikipediaUsedAsEvidence: false,
} as const;
