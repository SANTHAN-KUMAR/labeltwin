// Approved phrase library (controlled statements x language). Placeholders are locked: {t}.
export interface Phrase { id: string; key: string; version: string; source: string; text: Record<string, string> }

export const LANG_NAMES: Record<string, string> = {
  en: 'English', bg: 'Български', cs: 'Čeština', da: 'Dansk', de: 'Deutsch', el: 'Ελληνικά', es: 'Español', et: 'Eesti', fi: 'Suomi', fr: 'Français',
  hr: 'Hrvatski', hu: 'Magyar', it: 'Italiano', lt: 'Lietuvių', lv: 'Latviešu', mt: 'Malti', nl: 'Nederlands', pl: 'Polski', pt: 'Português', ro: 'Română',
  sk: 'Slovenčina', sl: 'Slovenščina', sv: 'Svenska', ja: '日本語', zh: '中文', ar: 'العربية',
}

export const PHRASES: Record<string, Phrase> = {
  desc_cf: {
    id: 'PHR-0012', key: 'desc_cf', version: 'v4', source: 'RA-approved 2025-06-10',
    text: {
      en: 'Drug-eluting coronary stent system',
      bg: 'Система с коронарен стент, отделящ лекарство',
      cs: 'Systém koronárního stentu uvolňujícího léčivo',
      da: 'Lægemiddeleluerende koronarstentsystem',
      de: 'Medikamentenfreisetzendes Koronarstentsystem',
      el: 'Σύστημα στεφανιαίου stent έκλυσης φαρμάκου',
      es: 'Sistema de stent coronario liberador de fármaco',
      et: 'Ravimit vabastav koronaarstendi süsteem',
      fi: 'Lääkeainetta vapauttava sepelvaltimostenttijärjestelmä',
      fr: 'Système de stent coronaire à élution médicamenteuse',
      hr: 'Sustav koronarnog stenta koji otpušta lijek',
      hu: 'Gyógyszerkibocsátó koszorúér-sztent rendszer',
      it: 'Sistema di stent coronarico a rilascio di farmaco',
      lt: 'Vaistus išskiriančio vainikinių arterijų stento sistema',
      lv: 'Zāles izdalošā koronārā stenta sistēma',
      mt: "Sistema ta' stent koronarju li jerħi l-mediċina",
      nl: 'Geneesmiddelafgevend coronair stentsysteem',
      pl: 'System stentu wieńcowego uwalniającego lek',
      pt: 'Sistema de stent coronário com eluição de fármaco',
      ro: 'Sistem de stent coronarian cu eliberare de medicament',
      sk: 'Systém koronárneho stentu uvoľňujúceho liečivo',
      sl: 'Sistem koronarne opornice, ki sprošča zdravilo',
      sv: 'Läkemedelsavgivande kranskärlsstentsystem',
      ja: '薬剤溶出型冠動脈ステントシステム',
      zh: '药物洗脱冠状动脉支架系统',
      ar: 'نظام دعامة تاجية مطلقة للدواء',
    },
  },
  store: {
    id: 'PHR-0031', key: 'store', version: 'v3', source: 'Risk control RC-12 · RA-approved 2024-02-01',
    text: {
      en: 'Do not store above {t} °C',
      bg: 'Да не се съхранява при температура над {t} °C',
      cs: 'Neuchovávejte při teplotě nad {t} °C',
      da: 'Må ikke opbevares over {t} °C',
      de: 'Nicht über {t} °C lagern',
      el: 'Να μη φυλάσσεται σε θερμοκρασία μεγαλύτερη των {t} °C',
      es: 'No conservar a temperatura superior a {t} °C',
      et: 'Hoida temperatuuril kuni {t} °C',
      fi: 'Säilytä alle {t} °C',
      fr: 'Ne pas conserver au-dessus de {t} °C',
      hr: 'Ne čuvati na temperaturi iznad {t} °C',
      hu: 'Legfeljebb {t} °C-on tárolandó',
      it: 'Non conservare a temperatura superiore a {t} °C',
      lt: 'Laikyti ne aukštesnėje kaip {t} °C temperatūroje',
      lv: 'Uzglabāt temperatūrā līdz {t} °C',
      mt: "Taħżinx f'temperatura 'l fuq minn {t} °C",
      nl: 'Niet bewaren boven {t} °C',
      pl: 'Nie przechowywać w temperaturze powyżej {t} °C',
      pt: 'Não conservar acima de {t} °C',
      ro: 'A nu se păstra la temperaturi peste {t} °C',
      sk: 'Uchovávajte pri teplote neprevyšujúcej {t} °C',
      sl: 'Shranjujte pri temperaturi do {t} °C',
      sv: 'Förvaras vid högst {t} °C',
      ja: '{t} °C以下で保存',
      zh: '请勿在{t} °C以上储存',
      ar: 'لا يحفظ في درجة حرارة أعلى من {t} °م',
    },
  },
  medicinal: {
    id: 'PHR-0044', key: 'medicinal', version: 'v2', source: 'RA-approved 2025-06-10',
    text: { en: 'Contains a medicinal substance: sirolimus' },
  },
}

// Legacy translation-memory segment that slipped into the old carton template (the defect the suite must catch)
export const LEGACY_TM_OVERRIDES: Record<string, string> = {
  'store.de': 'Nicht über 30 °C lagern',
}

// Back-translation similarity (precomputed with an MT back-translation + multilingual embedding model; illustrative)
export const BACKTRANSLATION_SIM: Record<string, number> = {
  bg: 0.94, cs: 0.95, da: 0.96, de: 0.97, el: 0.93, es: 0.97, et: 0.91, fi: 0.92, fr: 0.97, hr: 0.94, hu: 0.92, it: 0.97, lt: 0.92,
  lv: 0.93, mt: 0.90, nl: 0.96, pl: 0.95, pt: 0.96, ro: 0.95, sk: 0.94, sl: 0.93, sv: 0.96, ja: 0.93, zh: 0.94, ar: 0.92,
}

export const TERMBASE = [
  { term: 'drug-eluting', de: 'medikamentenfreisetzend', fr: 'à élution médicamenteuse', it: 'a rilascio di farmaco', status: 'preferred' },
  { term: 'stent system', de: 'Stentsystem', fr: 'système de stent', it: 'sistema di stent', status: 'preferred' },
  { term: 'do not store above', de: 'nicht über … lagern', fr: 'ne pas conserver au-dessus de', it: 'non conservare a temperatura superiore a', status: 'EMA QRD-aligned' },
]
