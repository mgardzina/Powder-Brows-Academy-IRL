import { SALON_CONFIG } from "@/app/config/salon";

export type FormType =
  | 'LIP_AUGMENTATION'
  | 'FACIAL_VOLUMETRY'
  | 'NEEDLE_MESOTHERAPY'
  | 'INJECTION_LIPOLYSIS'
  | 'PERMANENT_MAKEUP'
  | 'LASER_HAIR_REMOVAL'
  | 'LASER_TATTOO_REMOVAL'
  | 'WRINKLE_REDUCTION'
  | 'EYELID_LIFT'
  | 'TISSUE_STIMULATION'
  | 'EYEBROW_TINTING'
  | 'EYELASH_EXTENSION'
  | 'EYEBROW_LAMINATION';

export interface ConsentFormData {
  type: FormType;

  // Personal data
  imieNazwisko: string;
  ulica: string;
  kodPocztowy: string;
  miasto: string;
  dataUrodzenia: string;
  telefon: string;
  email?: string;
  miejscowoscData: string;
  osobaPrzeprowadzajacaZabieg?: string;

  // Treatment details
  nazwaProduktu: string;
  obszarZabiegu: string;
  celEfektu: string;
  numerZabiegu?: string; // "first treatment" / "subsequent treatment"

  // Contraindications (Dictionary key -> value, value can be boolean for checkboxes or string for follow-up fields)
  przeciwwskazania: Record<string, boolean | string | null>;

  // Consents
  zgodaPrzetwarzanieDanych: boolean;
  zgodaMarketing: boolean;
  zgodaFotografie: boolean;
  zgodaPomocPrawna: boolean;
  miejscaPublikacjiFotografii: string;

  // Signatures
  podpisDane: string;
  podpisMarketing: string;
  podpisFotografie: string;
  podpisRodo: string | null;
  podpisRodo2: string | null;

  // Additional information
  informacjaDodatkowa?: string;
  zastrzeniaKlienta?: string;
  wykazLekow?: string;
  inneSchorzenia?: string;

  // Treatment series (Tissue stimulation)
  planowanaIloscZabiegow?: string;
  odstepMiedzyZabiegami?: string;
  kolejneZabiegiOdstepy?: string;
  iloscProduktu?: string;
  znieczulenie?: string;
}

export const mezoterapiaIglowaCategoryBreaks: Record<number, string> = {
  0: "ABSOLUTE CONTRAINDICATIONS FOR THE PROCEDURE",
  11: "RELATIVE CONTRAINDICATIONS FOR THE PROCEDURE",
  18: "TEMPORARY CONTRAINDICATIONS FOR THE PROCEDURE",
};

export const mezoterapiaIglowaContraindications: Record<
  string,
  string | ContraindicationWithFollowUp
> = {
  // Absolute
  ciazaLaktacja: "Are you pregnant or breastfeeding?",
  chemoRadioTerapia:
    "Have you undergone chemotherapy or radiotherapy in the past year?",
  kortykosteroidy: "Are you undergoing corticosteroid therapy?",
  nowotwor: "Do you suffer from cancer?",
  hivZoltaczka: "Do you suffer from HIV or hepatitis?",
  luszczyca: "Do you suffer from psoriasis?",
  epilepsja: "Do you suffer from epilepsy?",
  hemofilia: "Have you been diagnosed with haemophilia?",
  gojenieRan: "Do you have problems/difficulties with wound healing?",
  alergiaZnieczulenie:
    "Are you allergic to preparations used for local anaesthesia?",
  alkoholSrodki:
    "Have you consumed alcohol or other intoxicating substances in the last 2 days?",

  // Relative
  cukrzyca: "Do you suffer from diabetes?",
  serce: "Do you suffer from heart disorders?",
  anemia: "Do you have anaemia?",
  problemyKrazenie: "Do you have circulatory problems?",
  autoimmunologiczne: "Do you suffer from autoimmune diseases?",
  zmianySkorne:
    "Do you have skin changes in the treatment area (acne, purulent conditions, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?",
  lekiKrzepliwosc:
    "Have you taken blood-thinning medications in the last 7 days, including acetylsalicylic acid, heparin, acenocoumarol?",

  // Temporary
  opryszczka: "Do you have an active herpes infection? (lips/eyes)",
  wypelniacze:
    "Have you used dermal fillers - hyaluronic acid?",
  botoks: "Have you had Botox injections?",
  zabiegiChirurgiczne: {
    text:
      "Have you had surgical procedures in the facial area?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, which ones?",
  },
  zluszczanie4tygodnie:
    "Have you had a skin exfoliation procedure within 4 weeks before the treatment?",
  chorobySkory:
    "Do you have skin diseases (seborrhoeic/atopic dermatitis)?",
  sterydy: "Are you currently undergoing steroid therapy?",
  antybiotyki: "Are you currently undergoing antibiotic therapy?",
  lekiRozrzedzajace:
    "Are you taking blood-thinning medications? (aspirin, paracetamol, vitamin E, other)",
  lekiMiejscowe:
    "Are you using topical medications in the treatment area?",
  zluszczanie4tygodnie2:
    "Have you had a skin exfoliation procedure within 4 weeks before the treatment?",
  temperatura:
    "Do you have an elevated body temperature or a cold on the day of the procedure?",
  tarczyca: "Do you have thyroid disorders?",
  sinceKrwawienia: "Do you have a tendency to bruise or bleed?",
  tatuaze: "Do you have tattoos?",
  makijazPermanentny: "Do you have permanent makeup?",
};

// GDPR Information - Data controller
export const rodoInfo = {
  administrator: SALON_CONFIG.owner,
  firmaNazwa: SALON_CONFIG.fullName,
  nip: SALON_CONFIG.nip,
  regon: '383931003',
  adres: `${SALON_CONFIG.address}, ${SALON_CONFIG.zipCode} ${SALON_CONFIG.city}`,
  consentTitle: 'CONSENT FOR PERSONAL DATA PROCESSING (GDPR)',
  consentText: `I, the undersigned, in accordance with Art. 6(1)(a) in conjunction with Art. 7(2) of Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 (OJ EU L 2018.127.2 consolidated text) on the protection of natural persons with regard to the processing of personal data and on the free movement of such data, and repealing Directive 95/46/EC (General Data Protection Regulation), hereinafter referred to as GDPR, hereby give my voluntary consent for the processing by the Data Controller - Malwina Zieba, conducting business under: PowderBrows Academy Malwina Zieba, ul. Siedlanowskiego 3/12, 37-450 Stalowa Wola, NIP: 8652314272, REGON: 383931003, of my personal data including:
● first and last name
● phone number
● email address
● date of birth
● PESEL number (national ID)
● image recorded for the purpose of maintaining treatment documentation
● information about health status, conditions, and past treatments`,
  clauseTitle: 'INFORMATION CLAUSE REGARDING PERSONAL DATA PROCESSING',
  clauseText: `I declare that in accordance with Art. 13(1) and (2) of the GDPR, I have been informed that:
a) providing personal data is voluntary, but in case of refusal to provide it, the Data Controller is entitled to refuse to provide the service,
b) I have the right to withdraw my consent at any time, however I understand that this will not affect the lawfulness of processing carried out on the basis of consent before its withdrawal,
c) data including: first and last name, date of birth, PESEL number, information about health status, conditions, past treatments, and image recorded for treatment documentation purposes, are processed on the basis of statutory authorisation referred to in Art. 9(2)(a) of the GDPR, for the purpose of proper service delivery - for which obtaining sensitive data is necessary,
d) data including: phone number and email address, will be used for making reservations, providing services and informing about services offered by the Data Controller (appointment dates, offers, scope of services),
e) data in the form of image recorded for promotional and marketing purposes will be used for the Data Controller's promotional and marketing activities (posting photographs on the salon website, Facebook, Instagram),
f) recipients of personal data will be persons authorised by the Data Controller who process personal data as part of their assigned duties,
g) in the case of a legitimate request, data recipients may also include supervisory authorities, law enforcement bodies and other public bodies acting on the basis of statutory authorisation,
h) personal data will be processed until: withdrawal of consent, expiry of the Data Controller's obligation to store data resulting from applicable law, or expiry of the limitation period for claims related to the service provided,
i) I have the right to request from the Data Controller: access to my personal data, the right to rectify, transfer or restrict processing, as well as to delete personal data,
j) personal data will be subject to automated decision-making processes, including regular profiling, solely for the purpose of matching the Data Controller's marketing offer to individual client needs, as well as reminding about scheduled appointments,
k) the Data Controller will not transfer personal data to a third country or international organisations,
l) if I believe that personal data is being processed incorrectly or unlawfully, I have the right to lodge a complaint with the supervisory authority - the President of the Personal Data Protection Office.`,
  pelnyTekst: `GDPR Information Obligation

In accordance with Art. 13 of the General Data Protection Regulation, OJ EU L 119 of 04.05.2016, I inform that:

1) the controller of your personal data is PowderBrows Academy Malwina Zieba,
2) your personal data will be processed for the purpose of using hotel/cosmetic services - based on Art. 6(1)(b) of the General Data Protection Regulation of 27 April 2016,
3) recipients of your personal data will be exclusively entities authorised to obtain personal data on the basis of legal provisions and entities participating in the provision of services,
4) your personal data will be stored for a period of 10 years,
5) you have the right to request access to your personal data from the controller, the right to rectify, delete or restrict processing, and the right to data portability,
6) you have the right to lodge a complaint with the supervisory authority,
7) providing personal data is voluntary, however refusal to provide data may result in refusal to provide the service/contract`,
};

// New contraindication structure - common for all forms
export interface ContraindicationQuestion {
  key: string;
  text: string;
  hasFollowUp?: boolean; // Does the question have a text field "If yes, then..."
  followUpPlaceholder?: string;
}

export interface ContraindicationCategory {
  title: string;
  questions: ContraindicationQuestion[];
}

// Common contraindications for all treatments
export const commonContraindications = {
  absolute: {
    title: 'ABSOLUTE CONTRAINDICATIONS FOR THE PROCEDURE',
    questions: [
      { key: 'ciazaLaktacja', text: 'Are you pregnant or breastfeeding?' },
      {
        key: 'zmianySkorne',
        text: 'Do you have skin inflammation or infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn?)'
      },
      { key: 'chemioRadioterapia', text: 'Have you undergone chemotherapy or radiotherapy in the past year?' },
      { key: 'chorobaNowotwrowa', text: 'Do you suffer from cancer?' },
      { key: 'hivZoltaczka', text: 'Do you suffer from HIV or hepatitis?' },
      { key: 'luszczycaAktywna', text: 'Do you suffer from psoriasis?' },
      { key: 'epilepsja', text: 'Do you suffer from epilepsy?' },
      { key: 'gojenieRan', text: 'Do you have problems/difficulties with wound healing?' },
      { key: 'alergiaSkładniki', text: 'Are you allergic to the preparation ingredients?' },
      { key: 'alergiaZnieczulenie', text: 'Are you allergic to preparations used for local anaesthesia?' },
      {
        key: 'chorobyImmunologiczne',
        text: 'Do you suffer from immunological diseases (rheumatoid arthritis, psoriatic arthritis, ulcerative colitis, Crohn\'s disease, ankylosing spondylitis, etc.)?'
      },
      { key: 'bielactwo', text: 'Do you suffer from vitiligo?' },
      { key: 'porfiriaSkorna', text: 'Do you suffer from cutaneous porphyria?' },
      { key: 'podatnoscBlizny', text: 'Do you have a tendency towards scar hypertrophy?' },
      { key: 'alkoholSrodkiOdurzajace', text: 'Have you consumed alcohol or other intoxicating substances in the last 2 days?' },
      { key: 'izotretinoina', text: 'Are you currently undergoing isotretinoin treatment (Izotek, Roaccutane, Aknenormin)?' },
      { key: 'lekiPrzeciwbolowe', text: 'Are you taking painkillers and anti-inflammatory medications (e.g. ibuprofen)?' },
      { key: 'utrataSwiadomosci', text: 'Have you experienced loss of consciousness during an aesthetic medical procedure?' },
      { key: 'uczulenieSrodkiZnieczulajace', text: 'Are you allergic to anaesthetic agents?' },
    ]
  } as ContraindicationCategory,

  relative: {
    title: 'RELATIVE CONTRAINDICATIONS FOR THE PROCEDURE',
    questions: [
      { key: 'problemyKrazenie', text: 'Do you have circulatory problems?' },
      { key: 'chorobyAutoimmunologiczne', text: 'Do you suffer from autoimmune diseases?' },
      { key: 'antykoagulanty', text: 'Are you taking anticoagulants or blood-thinning medications (e.g. acard)?' },
      { key: 'szczepieniWzw', text: 'Have you been vaccinated against hepatitis B?' },
      { key: 'lekIglyKrew', text: 'Do you have a fear of needles/blood?' },
    ]
  } as ContraindicationCategory,

  temporary: {
    title: 'TEMPORARY CONTRAINDICATIONS FOR THE PROCEDURE',
    questions: [
      { key: 'leczenieStomatologiczne', text: 'Are you currently undergoing dental treatment?' },
      {
        key: 'wypelniaczeSkorne',
        text: 'Have you used dermal fillers - hyaluronic acid?',
        hasFollowUp: true,
        followUpPlaceholder: 'If yes, which ones?'
      },
      {
        key: 'botoks',
        text: 'Have you had Botox injections?',
        hasFollowUp: true,
        followUpPlaceholder: 'If yes, which ones?'
      },
      {
        key: 'zabiegiChirurgiczne',
        text: 'Have you had surgical procedures in the facial area?',
        hasFollowUp: true,
        followUpPlaceholder: 'If yes, which ones?'
      },
      { key: 'antybiotykoterapia', text: 'Are you currently undergoing antibiotic therapy?' },
      { key: 'lekiRozrzedzajaceKrew', text: 'Are you taking blood-thinning medications? (aspirin, paracetamol, vitamin E, other)' },
      { key: 'lekiMiejscowe', text: 'Are you using topical medications in the treatment area?' },
      { key: 'temperaturaPrzeziebienie', text: 'Do you have an elevated body temperature or a cold on the day of the procedure?' },
    ]
  } as ContraindicationCategory,

  other: {
    title: 'OTHER',
    questions: [
      { key: 'sklonnosciSiniacyKrwawienie', text: 'Do you have a tendency to bruise or bleed?' },
      { key: 'tatuaze', text: 'Do you have tattoos?' },
      {
        key: 'makijazPermanentny',
        text: 'Do you have permanent makeup?',
        hasFollowUp: true,
        followUpPlaceholder: 'If yes, when was it done and using which technique?'
      },
      {
        key: 'inneSchorzenia',
        text: 'Do you have any other conditions, please specify:',
        hasFollowUp: true,
        followUpPlaceholder: 'Please describe'
      },
    ]
  } as ContraindicationCategory,
};

// Constant for Hyaluronic Acid / Facial Volumetry
export const hyaluronicContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  // ABSOLUTE CONTRAINDICATIONS FOR THE PROCEDURE
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  zmianySkorne: 'Do you have inflammation or skin infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, hemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  chemioRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  chorobaNowotwrowa: 'Do you suffer from cancer?',
  hivZoltaczka: 'Do you suffer from HIV or hepatitis?',
  luszczycaAktywna: 'Do you suffer from psoriasis?',
  epilepsja: 'Do you suffer from epilepsy?',
  gojenieRan: 'Do you have problems/difficulties with wound healing?',
  alergiaSkladniki: 'Do you have allergies to the ingredients of the preparation?',
  alergiaZnieczulenie: 'Do you have allergies to preparations used for local anesthesia?',
  chorobyImmunologiczne: {
    text: 'Do you suffer from immunological diseases (rheumatoid arthritis, psoriatic arthritis, ulcerative colitis, Crohn\'s disease, ankylosing spondylitis, etc.)?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  bielactwo: 'Do you suffer from vitiligo?',
  porfiriaSkorna: 'Do you suffer from cutaneous porphyria?',
  podatnoscBlizny: 'Do you have a tendency for scar hypertrophy?',
  alkoholNarkotyki: 'Have you consumed alcohol or other intoxicating substances in the last 2 days?',
  izotretinoina: 'Are you currently undergoing isotretinoin treatment (Izotek, Roaccutane, Aknenormin)?',
  lekiPrzeciwbolowe: 'Are you taking painkillers and anti-inflammatory drugs (e.g. ibuprofen)?',
  utrataSwiadomosci: 'Have you ever lost consciousness during an aesthetic medical procedure?',
  uczulenieSrodkiZnieczulajace: 'Are you allergic to anesthetic agents?',

  // RELATIVE CONTRAINDICATIONS FOR THE PROCEDURE
  problemyKrazenie: 'Do you have circulation problems?',
  chorobaAutoimmunologiczna: 'Do you suffer from autoimmune diseases?',
  antykoagulanty: 'Are you taking anticoagulants or blood-thinning medications (e.g. acard)?',
  szczepieniWzw: 'Have you been vaccinated against hepatitis B?',
  lekIglyKrew: 'Do you have a fear of needles/blood?',

  // TEMPORARY CONTRAINDICATIONS FOR THE PROCEDURE
  leczenieStomatologiczne: 'Are you currently undergoing dental treatment?',
  wypelniaczeSkorne: {
    text: 'Have you used dermal fillers - hyaluronic acid?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  botoks: {
    text: 'Have you had Botox injections?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  zabiegiChirurgiczne: {
    text: 'Have you had surgical procedures in the facial area?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  antybiotykoterapia: 'Are you currently undergoing antibiotic therapy?',
  lekiRozrzedzajaceKrew: 'Are you using blood-thinning medications? (aspirin, paracetamol, vitamin E, other)',
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',

  // OTHER
  sklonnosciSiniaki: 'Do you have a tendency for bruising or bleeding?',
  tatuaze: 'Do you have tattoos?',
  makijazPermanentny: {
    text: 'Do you have permanent makeup?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, when was it done and with what technique?'
  },
  inneSchorzenia: {
    text: 'Do you have any other medical conditions?',
    hasFollowUp: true,
    followUpPlaceholder: 'Please specify'
  },
};

// Natural reactions for hyaluronic acid
export const hyaluronicNaturalReactions = [
  'swelling and stinging in the treatment area lasting up to 2 weeks',
  'redness and/or bruising in the treatment area lasting up to a week',
  'extravasation, hematomas, bruises in the treatment area lasting up to 2 weeks',
  'tenderness of treated tissues lasting up to approximately one month',
  'possible palpability of treatment material (nodules) for up to 2 weeks',
  'itching during the healing period',
];

// Complications for hyaluronic acid
export const hyaluronicComplications = {
  czeste: [
    'prolonged swelling',
    'prolonged erythema',
    'thickening at the injection site',
    'hemorrhages',
    'hyaluronic acid migration',
    'Tyndall effect',
    'discoloration at the injection site',
  ],
  rzadkie: [
    'viral infection',
    'bacterial infection',
    'fungal infections',
    'irregular skin surface deformation',
    'skin nodules',
    'delayed inflammatory reactions',
    'abscesses and ulcers',
    'visible asymmetry',
  ],
  bardzoRzadkie: [
    'skin necrosis',
    'embolism of blood and lymphatic vessels',
    'granuloma formation',
    'compression of local blood vessels',
    'angioedema',
  ],
};

// Post-care recommendations for hyaluronic acid
export const hyaluronicPostCare = [
  'Use post-treatment preparation: ARNICA OINTMENT',
  'Treat the treated area with special care',
  'Do not touch or massage the treated areas',
  'Maintain high hand hygiene, as there is a high risk of secondary infection',
  'Do not wash with soap and exfoliating agents the areas subjected to filling for at least 2 weeks',
  'Avoid strong sun exposure for 6 weeks and use high UV filter creams',
  'Do not use tanning beds for 2 weeks',
  'Do not use sauna, swimming pool, or cryotherapy for 1 week',
  'Avoid alcohol for at least 48 hours after the procedure',
  'Avoid hot beverages on the day of the procedure (applies to lip augmentation)',
  'Avoid intense physical exercise for approximately two days',
  'Avoid sleeping for several days in a position that could compress the hyaluronic acid injection site, which could cause displacement of the preparation',
  'Do not undergo chemical or mechanical peeling treatments for 2 weeks after the procedure',
  'NOTE: Strictly follow post-treatment recommendations. For 4 days after the procedure, drink plenty of water, at least 2.5 liters per day.',
  'NOTE: Inflammatory reactions persisting for more than 7 days or the occurrence of any adverse reactions should be reported immediately.',
];

// Constant for PMU (Permanent Makeup)
export const pmuContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  // ABSOLUTE CONTRAINDICATIONS FOR THE PROCEDURE
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  zmianySkorne: 'Do you have skin inflammation or infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  chemioRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  chorobaNowotwrowa: 'Do you suffer from cancer?',
  hivZoltaczka: 'Do you suffer from HIV or hepatitis?',
  luszczycaAktywna: 'Do you suffer from psoriasis?',
  epilepsja: 'Do you suffer from epilepsy?',
  gojenieRan: 'Do you have problems/difficulties with wound healing?',
  alergiaBarwniki: 'Are you allergic to pigments used for tattooing?',
  alergiaZnieczulenie: 'Are you allergic to preparations used for local anaesthesia?',
  chorobyImmunologiczne: {
    text: 'Do you suffer from immunological diseases (rheumatoid arthritis, psoriatic arthritis, ulcerative colitis, Crohn\'s disease, ankylosing spondylitis, etc.)?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  bielactwo: 'Do you suffer from vitiligo?',
  porfiriaSkorna: 'Do you suffer from cutaneous porphyria?',
  podatnoscBlizny: 'Do you have a tendency towards scar hypertrophy?',
  alkoholNarkotyki: 'Have you consumed alcohol or other intoxicating substances in the last 2 days?',
  izotretinoina: 'Are you currently undergoing isotretinoin treatment (Izotek, Roaccutane, Aknenormin)?',
  lekiPrzeciwbolowe: 'Are you taking painkillers and anti-inflammatory medications (e.g. ibuprofen)?',
  utrataSwiadomosci: 'Have you experienced loss of consciousness during an aesthetic medical procedure?',
  uczulenieSrodkiZnieczulajace: 'Are you allergic to anaesthetic agents?',
  
  // RELATIVE CONTRAINDICATIONS FOR THE PROCEDURE
  problemyKrazenie: 'Do you have circulatory problems?',
  chorobaAutoimmunologiczna: 'Do you suffer from autoimmune diseases?',
  antykoagulanty: 'Are you taking anticoagulants or blood-thinning medications (e.g. acard)?',
  szczepieniWzw: 'Have you been vaccinated against hepatitis B?',
  lekIglyKrew: 'Do you have a fear of needles/blood?',
  
  // TEMPORARY CONTRAINDICATIONS FOR THE PROCEDURE
  leczenieStomatologiczne: 'Are you currently undergoing dental treatment? (applies to lip makeup)',
  wypelniaczeUst: {
    text: 'Have you used dermal fillers - hyaluronic acid? (applies to lip makeup)',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  zabiegiChirurgiczne: {
    text: 'Have you had surgical procedures in the facial area?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  antybiotykoterapia: 'Are you currently undergoing antibiotic therapy?',
  lekiRozrzedzajaceKrew: 'Are you taking blood-thinning medications? (aspirin, paracetamol, vitamin E, other)',
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',
  chorobaGalkiOcznej: 'Do you suffer from an eyeball disease? (applies to eyelid makeup)',
  stanyZapalneSpojowek: 'Do you have conjunctival or eye inflammation? (applies to eyelid makeup)',
  operacjeOczu: 'Have you had eye surgery? (applies to eyelid makeup)',
  
  // OTHER
  sklonnosciSiniaki: 'Do you have a tendency to bruise or bleed?',
  tatuaze: 'Do you have tattoos?',
  makijazPermanentny: {
    text: 'Do you have permanent makeup?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, when was it done and using which technique?'
  },
  inneSchorzenia: {
    text: 'Do you have any other conditions?',
    hasFollowUp: true,
    followUpPlaceholder: 'Please specify'
  },
};

// Natural reactions for PMU
export const pmuNaturalReactions = [
  'itching during the healing period',
  'appearance of scabs and skin flaking at the treatment site',
  'makeup will be significantly darker in the first days after the procedure',
];

// Complications for PMU
export const pmuComplications = {
  czeste: ['swelling', 'erythema'],
  rzadkie: ['viral infection', 'bacterial infection'],
  bardzoRzadkie: ['keloids', 'pigment migration'],
};

// Post-care recommendations for PMU
export const pmuPostCare = [
  'Treat the treated area with special care',
  'IMPORTANT: Do not mechanically remove scabs or flaking skin!',
  'Maintain high hand hygiene, as there is a high risk of secondary infection',
  'Do not wash with soap and exfoliating agents the areas subjected to pigmentation for at least 2 weeks',
  'Avoid strong sun exposure for 6 weeks and use high UV filter creams',
  'Do not use tanning beds for 6 weeks',
  'Do not use sauna or swimming pool for at least 3 weeks',
  'Avoid mechanically removing scabs',
  'Avoid hot beverages, spicy food and alcohol',
  'Drink liquids through a straw in the first days after the procedure (lip makeup)',
  'Do not use lipsticks or lip glosses during the lip healing period (lip makeup)',
  'Maintain special oral hygiene (lip makeup)',
  'Do not undergo mesotherapy or botulinum toxin injections 2–3 weeks after the procedure',
  'Do not undergo chemical or mechanical peeling treatments for 3 weeks after the procedure',
  'The procedure takes place in two stages: the second procedure (touch-up/correction) will be carried out within 2 months of the initial procedure',
  'If inflammatory reactions persist for more than a week or any adverse reactions occur, report them immediately',
];

// Constant for Laser Q-Switch
export const laserContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  // ABSOLUTE CONTRAINDICATIONS FOR THE PROCEDURE
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  zmianySkorne: 'Do you have skin inflammation or infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  chemioRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  chorobaNowotwrowa: 'Do you suffer from cancer?',
  hivZoltaczka: 'Do you suffer from HIV or hepatitis?',
  luszczycaAktywna: 'Do you suffer from psoriasis?',
  epilepsja: 'Do you suffer from epilepsy?',
  gojenieRan: 'Do you have problems/difficulties with wound healing?',
  alergiaSkładniki: 'Are you allergic to the preparation ingredients?',
  alergiaZnieczulenie: 'Are you allergic to preparations used for local anaesthesia?',
  chorobyImmunologiczne: {
    text: 'Do you suffer from immunological diseases (rheumatoid arthritis, psoriatic arthritis, ulcerative colitis, Crohn\'s disease, ankylosing spondylitis, etc.)?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  bielactwo: 'Do you suffer from vitiligo?',
  porfiriaSkorna: 'Do you suffer from cutaneous porphyria?',
  podatnoscBlizny: 'Do you have a tendency towards scar hypertrophy?',
  alkoholNarkotyki: 'Have you consumed alcohol or other intoxicating substances in the last 2 days?',
  izotretinoina: 'Are you currently undergoing isotretinoin treatment (Izotek, Roaccutane, Aknenormin)?',
  lekiPrzeciwbolowe: 'Are you taking painkillers and anti-inflammatory medications (e.g. ibuprofen)?',
  utrataSwiadomosci: 'Have you experienced loss of consciousness during an aesthetic medical procedure?',
  uczulenieSrodkiZnieczulajace: 'Are you allergic to anaesthetic agents?',
  rozrusznikSerca: 'Do you have a cardiac pacemaker?',
  
  // RELATIVE CONTRAINDICATIONS FOR THE PROCEDURE
  problemyKrazenie: 'Do you have circulatory problems?',
  chorobaAutoimmunologiczna: 'Do you suffer from autoimmune diseases?',
  antykoagulanty: 'Are you taking anticoagulants or blood-thinning medications (e.g. acard)?',
  szczepieniWzw: 'Have you been vaccinated against hepatitis B?',
  lekIglyKrew: 'Do you have a fear of needles/blood?',
  
  // TEMPORARY CONTRAINDICATIONS FOR THE PROCEDURE
  leczenieStomatologiczne: 'Are you currently undergoing dental treatment?',
  wypelniaczeSkorne: {
    text: 'Have you used dermal fillers - hyaluronic acid?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  botoks: {
    text: 'Have you had Botox injections?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  zabiegiChirurgiczne: {
    text: 'Have you had surgical procedures in the facial area?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  antybiotykoterapia: 'Are you currently undergoing antibiotic therapy?',
  lekiRozrzedzajaceKrew: 'Are you taking blood-thinning medications? (aspirin, paracetamol, vitamin E, other)',
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',
  chorobaGalkiOcznej: 'Do you suffer from an eyeball disease? (applies to eyelid procedures)',
  stanyZapalneSpojowek: 'Do you have conjunctival or eye inflammation? (applies to eyelid procedures)',
  operacjeOczu: 'Have you had eye surgery? (applies to eyelid procedures)',
  
  // OTHER
  sklonnosciSiniaki: 'Do you have a tendency to bruise or bleed?',
  tatuaze: 'Do you have tattoos?',
  makijazPermanentny: {
    text: 'Do you have permanent makeup?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, when was it done and using which technique?'
  },
  inneSchorzenia: {
    text: 'Do you have any other conditions?',
    hasFollowUp: true,
    followUpPlaceholder: 'Please specify'
  },
};

// Natural reactions for Laser
export const laserNaturalReactions = [
  'discomfort during the procedure',
  'itching during the healing period',
  'appearance of scabs and skin flaking at the treatment site',
  'transient skin discolouration',
];

// Complications for Laser
export const laserComplications = {
  czeste: ['swelling', 'erythema', 'scabs', 'blisters', 'allergic reactions'],
  rzadkie: ['viral infection', 'scarring', 'bacterial infection'],
  bardzoRzadkie: ['temporary or permanent changes in skin colour and structure'],
};

// Post-care recommendations for Laser
export const laserPostCare = [
  'Treat the treated area with special care',
  'Maintain high hand hygiene, as there is a high risk of secondary infection',
  'Avoid strong sun exposure for 4 weeks and use high UV filter creams',
  'Do not use tanning beds for 4 weeks',
  'Do not use sauna or swimming pool for at least 3 weeks',
  'Avoid mechanically removing scabs',
  'Avoid alcohol for approximately 48 hours after the procedure',
  'Do not undergo chemical or mechanical peeling treatments for 2 weeks after the procedure',
];

// =====================================================
// NEW FORM TYPES
// =====================================================

// LIP_AUGMENTATION - Lip augmentation with hyaluronic acid
export interface ContraindicationWithFollowUp {
  text: string;
  hasFollowUp?: boolean;
  followUpPlaceholder?: string;
  isPositiveAnswerSafe?: boolean;
}

export const modelowanieUstContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  // ABSOLUTE CONTRAINDICATIONS FOR THE PROCEDURE
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  zapalenieZakazenieSkory: 'Do you have skin inflammation or infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  chemioterapiaRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  nowotwor: 'Do you suffer from cancer?',
  hivZoltaczka: 'Do you suffer from HIV or hepatitis?',
  luszczycaAktywna: 'Do you suffer from psoriasis?',
  epilepsja: 'Do you suffer from epilepsy?',
  problemyGojenieRan: 'Do you have problems/difficulties with wound healing?',
  alergiaSkładnikiPreparatu: 'Are you allergic to the preparation ingredients?',
  alergiaZnieczulenie: 'Are you allergic to preparations used for local anaesthesia?',
  chorobyImmunologiczne: {
    text: 'Do you suffer from immunological diseases (rheumatoid arthritis, psoriatic arthritis, ulcerative colitis, Crohn\'s disease, ankylosing spondylitis, etc.)?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  bielactwo: 'Do you suffer from vitiligo?',
  porfiriaSkorna: 'Do you suffer from cutaneous porphyria?',
  podatnoscBlizny: 'Do you have a tendency towards scar hypertrophy?',
  alkoholNarkotyki: 'Have you consumed alcohol or other intoxicating substances in the last 2 days?',
  leczenieIzotretinina: 'Are you currently undergoing isotretinoin treatment (Izotek, Roaccutane, Aknenormin)?',
  lekiPrzeciwbolowe: 'Are you taking painkillers and anti-inflammatory medications (e.g. ibuprofen)?',
  utrataSwiadomosci: 'Have you experienced loss of consciousness during an aesthetic medical procedure?',
  uczulenieSrodkiZnieczulajace: 'Are you allergic to anaesthetic agents?',
  
  // RELATIVE CONTRAINDICATIONS FOR THE PROCEDURE
  problemyKrazeniem: 'Do you have circulatory problems?',
  chorobyAutoimmunologiczne: 'Do you suffer from autoimmune diseases?',
  antykoagulantyLekiRozrzedzajace: 'Are you taking anticoagulants or blood-thinning medications (e.g. acard)?',
  szczepienieWzw: 'Have you been vaccinated against hepatitis B?',
  lekIglyKrew: 'Do you have a fear of needles/blood?',
  
  // TEMPORARY CONTRAINDICATIONS FOR THE PROCEDURE
  leczenieStomatologiczne: 'Are you currently undergoing dental treatment?',
  wypelniaczeSkorneKwasHialuronowy: {
    text: 'Have you used dermal fillers - hyaluronic acid?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  zastrzykiBotoks: {
    text: 'Have you had Botox injections?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  zabiegiChirurgiczneTwarz: {
    text: 'Have you had surgical procedures in the facial area?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  antybiotykoterapia: 'Are you currently undergoing antibiotic therapy?',
  lekiRozrzedzajaceKrew: 'Are you taking blood-thinning medications? (aspirin, paracetamol, vitamin E, other)',
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',
  
  // OTHER
  sklonnosciSinceKrwawienie: 'Do you have a tendency to bruise or bleed?',
  tatuaze: 'Do you have tattoos?',
  makijazPermanentny: {
    text: 'Do you have permanent makeup?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, when was it done and using which technique?'
  },
  inneSchorzenia: {
    text: 'Do you have any other conditions?',
    hasFollowUp: true,
    followUpPlaceholder: 'Please specify'
  },
};

export const modelowanieUstNaturalReactions = [
  'redness',
  'swelling',
  'bleeding',
  'haematomas',
  'bruising',
  'erythema',
  'itching',
  'pain',
  'thickening or nodules',
  'allergic reactions to the injected preparation',
];

export const modelowanieUstComplications = {
  czeste: [
    'redness',
    'swelling',
    'bleeding',
    'haematomas',
    'bruising',
    'erythema',
    'itching',
    'pain',
    'thickening or nodules',
    'allergic reactions to the injected preparation',
  ],
  rzadkie: [
    'viral infection',
    'scar formation',
    'allergic reactions',
    'bacterial infection',
    'facial asymmetry',
    'discolouration at the injection site',
    'infection',
    'nodules',
    'herpes reactivation',
    'pruritus',
    'ischaemia',
    'dermatitis',
    'blisters',
    'induration',
    'facial swelling',
  ],
  bardzoRzadkie: [
    'keloids',
    'necrosis',
    'visual disturbances',
    'inflammation and oedema',
  ],
};

export const modelowanieUstPostCare = [
  'Treat the treated area with special care',
  'For 2 weeks avoid pressing and massaging the lips',
  'After the procedure avoid alcohol and smoking, as well as intense physical exercise – for approximately 3–7 days',
  'Maintain high hand hygiene, as there is a high risk of secondary infection',
  'Do not wash with water, soap or exfoliating agents the treated areas for at least 7 days',
  'Avoid strong sun exposure for 6 weeks and use high UV filter creams',
  'Do not use tanning beds or cryotherapy treatments for 3 days',
  'Do not use sauna or swimming pool for at least 3 days',
  'Avoid mechanically removing scabs',
  'Avoid consuming hot beverages and food for 4 days',
  'Drink liquids through a straw during the first 5 days after the procedure',
  'Do not use lipsticks or lip glosses during the lip healing period',
  'Maintain special oral hygiene',
  'Do not undergo mesotherapy or botulinum toxin injections after the procedure',
  'Do not undergo chemical or mechanical peeling treatments for 3 weeks after the procedure',
  'If within 3–6 months of the procedure you need to undergo an MRI scan, you undertake to inform your doctor about the hyaluronic acid procedures performed',
];

// FACIAL_VOLUMETRY - Facial volumetry with hyaluronic acid
export const wolumetriaTwarzyContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  zapalenieZakazenieSkory: 'Do you have skin inflammation or infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  chorobySerca: 'Do you suffer from heart disorders?',
  chorobyAutoimmunologiczne: 'Do you suffer from autoimmune diseases?',
  cukrzyca: 'Do you suffer from diabetes?',
  chemioterapiaRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  nowotwor: 'Do you suffer from cancer?',
  hivZoltaczka: 'Do you suffer from HIV or hepatitis?',
  zaburzeniaTarczycy: 'Do you suffer from thyroid disorders?',
  luszczycaAktywna: 'Do you suffer from psoriasis?',
  epilepsja: 'Do you suffer from epilepsy?',
  problemyGojenieRan: 'Do you have problems/difficulties with wound healing?',
  alergiaSkładnikiPreparatu: 'Are you allergic to the preparation ingredients?',
  alergiaZnieczulenie: 'Are you allergic to preparations used for local anaesthesia?',
  chorobyImmunologiczne: {
    text: 'Do you suffer from immunological diseases (rheumatoid arthritis, psoriatic arthritis, ulcerative colitis, Crohn\'s disease, ankylosing spondylitis, etc.)?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  bielactwo: 'Do you suffer from vitiligo?',
  porfiriaSkorna: 'Do you suffer from cutaneous porphyria?',
  podatnoscBlizny: 'Do you have a tendency towards scar hypertrophy?',
  alkoholNarkotyki: 'Have you consumed alcohol or other intoxicating substances in the last 2 days?',
  lekiRyzykoKrwawienia: 'Are you taking medications that increase the risk of bleeding? (aspirin, paracetamol, vitamin E, other)',
  problemyKrzepliwoscKrwi: 'Do you have problems with blood coagulation?',
  
  // RELATIVE CONTRAINDICATIONS
  problemyKrazeniem: 'Do you have circulatory problems?',

  // TEMPORARY CONTRAINDICATIONS
  wypelniaczeSkorneKwasHialuronowy: 'Have you used dermal fillers - hyaluronic acid?',
  zastrzykiBotoks: 'Have you had Botox injections?',
  antybiotykoterapia: 'Are you currently undergoing antibiotic therapy?',
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',
  sklonnosciSinceKrwawienie: 'Do you have a tendency to bruise or bleed?',

  // OTHER
  tatuaze: 'Do you have tattoos?',
  makijazPermanentny: {
    text: 'Do you have permanent makeup?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, when was it done and using which technique?'
  },
  zabiegiChirurgiczneTwarz: {
    text: 'Have you had surgical procedures in the facial area?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  inneSchorzenia: {
    text: 'Do you have any other unlisted conditions?',
    hasFollowUp: true,
    followUpPlaceholder: 'Please specify'
  },
};

export const wolumetriaTwarzyNaturalReactions = [
  'redness',
  'swelling',
  'bleeding',
  'haematomas',
  'bruising',
  'erythema',
  'itching',
  'pain',
  'thickening or nodules',
  'hypercorrection',
];

export const wolumetriaTwarzyComplications = {
  czeste: [
    'redness',
    'swelling',
    'bleeding',
    'haematomas',
    'bruising',
    'erythema',
    'itching',
    'pain',
    'thickening or nodules',
    'hypercorrection',
  ],
  rzadkie: [
    'viral infection',
    'scar formation',
    'allergic reactions',
    'bacterial infection',
    'facial asymmetry',
    'discolouration at the injection site',
  ],
  bardzoRzadkie: [
    'keloids',
    'cysts',
    'urticaria',
    'granulomas',
    'necrosis',
  ],
};

export const wolumetriaTwarzyPostCare = [
  'Cleanse the treated surface with clean water or a soap-free gel/alcohol-free toner for at least 24 hours after the procedure',
  'Use soothing cosmetics: Bepanthen, Alantan, Panthenol, Arnica',
  'Avoid physical activity for at least 2 days after the procedure',
  'Do not scratch scabs',
  'Do not perform procedures on the body area that was subjected to the procedure',
  'Treat the treated area with special care',
  'Avoid pressing and massaging the treated area and face',
  'Maintain high hand hygiene, as there is a high risk of secondary infection',
  'Do not apply cosmetics to the treated areas for 2 days',
  'Gently pat the skin dry with a towel and do not rub the treated areas',
  'Avoid strong sun exposure for 6 weeks and use high UV filter creams',
  'Do not use sauna or swimming pool for at least 7 days',
  'Do not undergo mesotherapy or botulinum toxin procedures after the procedure',
  'Do not undergo chemical or mechanical peeling treatments for 3 weeks after the procedure',
];

// WRINKLE_REDUCTION - Wrinkle Reduction - post-care recommendations
export const niwelowaineZmarszczekPostCare = [
  'Avoid strong forward inclinations',
  'Treat the treated area with special care',
  'For 14 days do not undergo other cosmetic procedures',
  'Limit physical exercise for approximately 48 h',
  'For 48 h limit the application of makeup',
  'Do not wash with water, soap or exfoliating agents the areas subjected to filling for at least 4 weeks',
  'Avoid massaging and pressing the skin at the injection site',
  'For approximately 24 h avoid excessive facial expressions',
  'Avoid strong sun exposure for 4 weeks and use high UV filter creams',
  'Do not use tanning beds or cryotherapy treatments for 4 weeks',
  'Do not use sauna or swimming pool for at least 14 days',
  'Apply cold compresses to the treated area, but keep them near it without pressing on it',
  'Maintain high hand hygiene, as there is a high risk of secondary infection',
  'Avoid sleeping for several days in a position that could compress the injection site — ideally sleep on your back',
  'Do not fly for 48 hours after the procedure',
  'Avoid alcohol for 48 h after the procedure',
  'Do not undergo lymphatic massage or other cosmetic procedures for at least 4 weeks after the procedure',
  'Inform the practitioner performing cosmetic/cosmetological procedures about the period since botulinum toxin injections (some procedures are contraindicated)',
  'CAUTION!!! Follow the post-treatment recommendations strictly.',
  'CAUTION!!! Any adverse reactions should be reported immediately to the Specialist performing the procedure.',
];

// EYELID_LIFT - Plasma Eyelid Lifting
export const plazmaPlexrPreCare = [
  'Avoid UV exposure (sun, tanning beds) for 1.5 months before the planned procedure',
  '1 week before the procedure do not perform mechanical peeling or hair removal at the site to be treated',
  'On the day of the procedure, thoroughly and precisely cleanse the skin',
];

export const plazmaPlexrPostCare = [
  'After the procedure, small dots (scabs) are visible on the skin, which last 7–14 days — absolutely do not scratch them off',
  'You may use regenerative creams (Bepanthen, Alantan, Panthenol)',
  'On the second or third day after the procedure, swelling appears in the treated area and lasts for approximately 3 days',
  'During swelling, use only sterile products (single-use gauze for cleansing, saline solution or Octenisept) and regenerating cream',
  'Do not use corrective makeup during the healing period',
  'After the scabs fall off, the skin may be slightly red for 1–2 weeks — use regenerating and redness-reducing creams',
  'Do not sunbathe for at least 4 weeks after the procedure (including tanning beds) — use SPF 50 minimum',
  'Treat the treated area with special care — do not touch or massage',
  'Maintain high hand hygiene — there is a high risk of secondary infection',
  'Avoid intense physical exercise and hot baths',
  'Cool the treated surface with dry compresses',
  'Avoid alcohol',
  'Do not apply makeup in the treated area',
  'Do not use swimming pool or sauna during the treatment series and between sessions',
  'Washing of the treated area is only possible after 24 hours',
  'Protect the treated area with a filter cream',
  'Chemical and mechanical peeling is prohibited',
  'Do not use alcohol-based toners or creams containing fruit acids, vitamin A or C for 4 weeks after the procedure',
  'Do not cleanse the treated area with alcohol-based preparations (Octenisept is permitted)',
  'For approximately 2–3 months after the procedure, the skin will be sensitive and susceptible to external factors — requires appropriate care',
  'The next procedure can be performed after a minimum of 40 days (optimally after 3 months)',
  'CAUTION!!! Follow the post-treatment recommendations strictly',
  'CAUTION!!! Any adverse reactions should be reported immediately to the Specialist performing the procedure',
];

export const plasmaLiftingContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  // ABSOLUTE CONTRAINDICATIONS
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  zapalenieZakazenieSkory: 'Do you have skin inflammation or infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  chorobySerca: 'Do you suffer from heart disorders?',
  chorobyAutoimmunologiczne: 'Do you suffer from autoimmune diseases?',
  wysokieCisnienie: 'Do you have high blood pressure?',
  cukrzycaZaburzeniaNaczyniowe: 'Do you suffer from diabetes with vascular disorders?',
  chemioterapiaRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  nowotwor: 'Do you suffer from cancer?',
  zoltaczkaChorobyWatrobyNerek: 'Do you suffer from hepatitis or severe liver or kidney diseases?',
  zaburzeniaTarczycy: 'Do you suffer from thyroid disorders?',
  epilepsja: 'Do you suffer from epilepsy?',
  chorobyImmunologiczne: 'Do you suffer from immunological diseases?',
  luszczycaBielactwo: 'Do you suffer from psoriasis or vitiligo?',
  chorobyTkankiLacznej: 'Do you suffer from connective tissue diseases?',

  // RELATIVE CONTRAINDICATIONS
  problemyKrazeniem: 'Do you have circulatory problems?',

  // TEMPORARY CONTRAINDICATIONS
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',
  lekiSwiatlouczulajace: {
    text: 'Are you taking photosensitising medications or dietary supplements (marigold, St John\'s wort, nettle, rock rose, horsetail)?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  lekiAntydepresyjneSterydy: 'Are you taking antidepressants or steroids?',
  antybiotykoterapiaRetynoidy: 'Are you currently undergoing antibiotic therapy (including retinoids)?',
  leczenieStomatologiczne: 'Have you undergone dental treatment within the last week?',

  // OTHER
  inneSchorzenia: {
    text: 'Do you have any other unlisted conditions?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
};

// NEEDLE_MESOTHERAPY - Needle mesotherapy
export const mezoterapiaIglowaNaturalReactions = [
  "local pain at injection points",
  "erythema",
  "swelling and stinging in the post-treatment area lasting up to a week",
  "redness and/or bruising in the post-treatment area lasting up to a week",
  "extravasations, haematomas, bruises in the post-treatment area lasting up to a week",
  "tenderness of treated tissues lasting up to 2 weeks",
  "itching during the healing period",
];

export const mezoterapiaIglowaComplications = [
  "recurrence of herpes infection",
  "viral infections",
  "bacterial infections",
  "allergic reactions",
];

export const mezoterapiaIglowaComplicationsVeryRare = [
  "haemorrhages and haematomas",
];

export const mezoterapiaIglowaPreCare = [
  "For 7 days before the procedure do not take medications that reduce blood coagulation (e.g. aspirin)",
  "Do not consume alcohol for at least 24 h before the procedure",
  "On the day of the procedure the skin should not be tanned or irritated",
];

export const mezoterapiaIglowaPostCare = [
  "Use the recommended home care preparation (regenerating/protective) strictly according to the instructions provided by the Specialist, for the indicated period.",
  "treat the treated area with special care",
  "maintain high hand hygiene, as there is a high risk of secondary infection",
  "do not apply makeup in the treated areas for 24 hours",
  "do not use exfoliating agents on the treated areas for approximately 14 days",
  "do not touch or massage the treated areas",
  "avoid strong sun exposure for 4 weeks and use high UV filter creams",
  "do not use tanning beds for 4 weeks",
  "do not use sauna or swimming pool for 4 weeks",
  "avoid prolonged exposure to frost",
  "avoid mechanically removing scabs",
  "avoid alcohol for 24 hours after the procedure",
  "do not undergo chemical or mechanical peeling treatments for 3 weeks after the procedure",
  "CAUTION!!! Follow the post-treatment recommendations strictly!",
  "CAUTION!!! Any adverse reactions should be reported immediately to the Specialist performing the procedure.",
];

// INJECTION_LIPOLYSIS - Injection lipolysis
export const lipolizaIniekcyjnaContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  // ABSOLUTE
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  zapalenieZakazenieSkory: 'Do you have skin inflammation or infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  chorobySerca: 'Do you suffer from heart disorders?',
  chorobyAutoimmunologiczne: 'Do you suffer from autoimmune diseases?',
  cukrzycaZaburzeniamiNaczyniowymi: 'Do you suffer from diabetes with vascular disorders?',
  chemioterapiaRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  nowotwor: 'Do you suffer from cancer?',
  zoltaczkaChorobyWatrobyNerek: 'Do you suffer from hepatitis or severe liver or kidney diseases?',
  zaburzeniaTarczycy: 'Do you suffer from thyroid disorders?',
  epilepsja: 'Do you suffer from epilepsy?',
  alergiaSkladnikiPreparatu: 'Are you allergic to the preparation ingredients?',
  nadwrazliwoscKwasBenzoesowy: 'Do you have hypersensitivity to benzoic acid, soy or vitamin E/B?',
  alergiaZnieczulenie: 'Are you allergic to preparations used for local anaesthesia?',
  chorobyImmunologiczne: 'Do you suffer from immunological diseases?',
  lekiRyzykoKrwawienia: 'Are you taking medications that increase the risk of bleeding? (aspirin, paracetamol, vitamin E, other)',
  problemyKrzepliwoscKrwi: 'Do you have problems with blood coagulation?',
  zakrzepoweZapalenieZyl: 'Do you suffer from thrombophlebitis?',
  preparatyIzotretynoina: 'Have you taken oral isotretinoin preparations within the last 3 months? (e.g. Acnenormin, Roacutan, Izotek, Curacne)?',
  niewydolnoscMarskoscWatroby: 'Do you suffer from liver failure or cirrhosis or other liver diseases?',

  // RELATIVE
  problemyKrazeniem: 'Do you have circulatory problems?',

  // TEMPORARY
  antybiotykoterapia: 'Are you currently undergoing antibiotic therapy?',
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',

  // OTHER
  tatuaze: 'Do you have tattoos?',
  makijazPermanentny: {
    text: 'Do you have permanent makeup?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, when was it done and using which technique?',
  },
  zabiegiKwasHialuronowyToksynaBotulinowa: 'Have you undergone procedures using hyaluronic acid or botulinum toxin in the last 6 months?',
  zabiegiChirurgiczneTwarz: {
    text: 'Have you had surgical procedures in the facial area?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?',
  },
  inneSchorzenia: {
    text: 'Do you have any other unlisted conditions, please specify:',
    hasFollowUp: true,
    followUpPlaceholder: 'Please specify',
  },
};

export const lipolizaIniekcyjnaNaturalReactions = [
  'redness',
  'swelling',
  'bleeding',
  'haematomas',
  'bruising',
  'erythema',
  'itching',
  'pain',
  'thickening or nodules',
];

export const lipolizaIniekcyjnaComplications = {
  czeste: [
    'redness',
    'swelling',
    'bleeding',
    'haematomas',
    'bruising',
    'erythema',
    'itching',
    'pain',
    'thickening or nodules',
  ],
  rzadkie: [
    'viral infection',
    'scar formation',
    'allergic reactions',
    'bacterial infection',
    'visible surface irregularities of the skin',
    'discolouration at the injection site',
  ],
  bardzoRzadkie: [
    'keloids',
    'cysts',
    'shock',
    'asymmetry',
    'necrosis',
  ],
};

export const lipolizaIniekcyjnaPreCare = [
  '7 days before the procedure stop taking medications that increase the risk of bleeding (Aspirin, Polopiryna, Acard)',
  'limit alcohol consumption 24 h before the planned procedure',
  '7 days before the procedure drink at least 2 litres of water per day',
];

export const lipolizaIniekcyjnaPostCare = [
  'treat the treated area with special care',
  'do not consume alcohol for 24 h after the procedure',
  'drink at least 2 litres of water per day',
  'avoid using pain relievers that inhibit inflammatory reactions',
  'do not take medications that reduce blood coagulation, e.g. Aspirin',
  'avoid hot baths — only a brief cool shower',
  'avoid sun exposure and tanning beds for approximately 4 weeks after the procedure',
  'do not use invasive cosmetics on the treated areas for 7 days',
  'gently pat the skin dry with a towel and do not rub',
  'do not use sauna for at least 14 days',
  'do not undergo chemical or mechanical peeling treatments for 4 weeks after the procedure',
  'CAUTION!!! Follow the post-treatment recommendations strictly.',
  'CAUTION!!! Any adverse reactions should be reported immediately to the Specialist performing the procedure.',
];

// PERMANENT_MAKEUP - Permanent makeup
export const makijazPermanentnyContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  // ABSOLUTE CONTRAINDICATIONS FOR THE PROCEDURE
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  chemioterapiaRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  nowotwor: 'Do you suffer from cancer?',
  hivZoltaczka: 'Do you suffer from HIV or hepatitis?',
  luszczycaAktywna: 'Do you suffer from psoriasis?',
  epilepsja: 'Do you suffer from epilepsy?',
  hemofilia: 'Have you been diagnosed with haemophilia?',
  problemyGojenieRan: 'Do you have problems/difficulties with wound healing?',
  alergiaBarwniki: 'Are you allergic to pigments used for tattooing?',
  alergiaZnieczulenie: 'Are you allergic to preparations used for local anaesthesia?',
  alkoholNarkotyki: 'Have you consumed alcohol or other intoxicating substances in the last 2 days?',
  nadpobudliwoscGalkiOcznej: 'Do you have hyperreactivity of the eyeball?',
  stanyZapalneSpojowekOczu: 'Do you have conjunctival or eye inflammation?',
  stwardnienieSiatkowki: 'Do you have retinal sclerosis?',
  skoraTendencjeKeloidyBlizny: 'Do you have skin with a tendency towards keloids and scars?',
  lekiPrzeciwzapalne: 'Are you taking non-steroidal anti-inflammatory medications?',
  // RELATIVE CONTRAINDICATIONS FOR THE PROCEDURE
  cukrzyca: 'Do you suffer from diabetes?',
  zaburzeniaSerca: 'Do you suffer from heart disorders?',
  anemia: 'Do you have anaemia?',
  problemyKrazeniem: 'Do you have circulatory problems?',
  chorobyAutoimmunologiczne: 'Do you suffer from autoimmune diseases?',
  zmianySkorne: 'Do you have skin changes in the treatment area (acne, purulent conditions, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  skoraTlustaPorowata: 'Do you have oily or porous skin?',
  // TEMPORARY CONTRAINDICATIONS FOR THE PROCEDURE
  aktywnaOpryszczka: 'Do you have an active herpes infection? (lips/eyes)',
  leczenieStomatologiczne: 'Are you currently undergoing dental treatment?',
  peelingChemicznyLaserowy: 'Have you had a chemical or laser peel within the last 6 months?',
  wypelniaczeSkorneKwasHialuronowy: 'Have you used dermal fillers - hyaluronic acid?',
  zastrzykiBotoks: 'Have you had Botox injections?',
  zabiegiChirurgiczneTwarz: {
    text: 'Have you had surgical procedures in the facial area?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones and when?',
  },
  chorobySkory: 'Do you have skin diseases (seborrhoeic/atopic dermatitis)?',
  kuracjaSterydowa: 'Are you currently undergoing steroid therapy?',
  antybiotykoterapia: 'Are you currently undergoing antibiotic therapy?',
  lekiRozrzedzajaceKrew: 'Are you taking blood-thinning medications? (aspirin, paracetamol, vitamin E, other)',
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  zabiegZluszczania: 'Have you had a skin exfoliation procedure within 4 weeks before the treatment?',
  odzywkiRewitalizacjaBrwiRzesy: 'Have you used eyebrow or eyelash revitalisation/growth stimulation serums within a month before the procedure?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',
  zaburzeniaTarczycy: 'Do you have thyroid disorders?',
  sklonnosciSinceKrwawienie: 'Do you have a tendency to bruise or bleed?',
  uczulenieLidokaina: 'Are you allergic to lidocaine?',
  tatuaze: 'Do you have other tattoos?',
  makijazPermanentny: {
    text: 'Do you have permanent makeup?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, when was it done and using which technique?',
  },
  inneSchorzenia: {
    text: 'Other conditions',
    hasFollowUp: true,
    followUpPlaceholder: 'Please specify',
  },
};

export const makijazPermanentnyCategoryBreaks: Record<number, string> = {
  0: 'ABSOLUTE CONTRAINDICATIONS FOR THE PROCEDURE',
  16: 'RELATIVE CONTRAINDICATIONS FOR THE PROCEDURE',
  23: 'TEMPORARY CONTRAINDICATIONS FOR THE PROCEDURE',
};

export const makijazPermanentnyNaturalReactions = [
  'itching during the healing period',
  'redness',
  'bleeding',
  'appearance of scabs and skin flaking at the treatment site',
  'darker makeup in the first days after the procedure',
  'swelling',
  'bruising',
  'erythema',
];

export const makijazPermanentnyComplications = {
  czeste: [
    'itching during the healing period',
    'redness',
    'bleeding',
    'appearance of scabs and skin flaking',
    'darker makeup in the first days after the procedure',
    'swelling',
    'bruising',
    'erythema',
  ],
  rzadkie: [
    'viral infection',
    'scar formation',
    'allergic reactions',
    'bacterial infection',
  ],
  bardzoRzadkie: [
    'keloids',
    'pigment migration',
  ],
};

export const makijazPermanentnyPostCare = [
  'Treat the treated area with special care',
  'The treatment area should be wiped with a damp cotton pad to remove the plasma exuding. For the first 3 days after the procedure, care for the skin dry; only after 4 days may soothing preparations be used (e.g. neomycin around the eyes, linomag for lips/eyebrows); protect especially from contact with water',
  'Do not wash with water, soap, exfoliating agents or alcohol-containing products the areas subjected to pigmentation for at least a week',
  'Maintain high hand hygiene, as there is a high risk of secondary infection',
  'Avoid sun exposure for 6 weeks and use high UV filter creams',
  'Do not use tanning beds for 1 week',
  'Do not use sauna or swimming pool for at least 1 week',
  'Avoid mechanically removing scabs',
  'On the first day after the procedure avoid hot beverages, food and alcohol',
  'Drink liquids through a straw in the first days after the procedure (lip makeup)',
  'Do not use lipsticks or lip glosses during the lip healing period (lip makeup)',
  'Maintain special oral hygiene (lip makeup)',
  'Do not undergo mesotherapy or botulinum toxin procedures 2–3 weeks after the procedure',
  'Do not undergo chemical or mechanical peeling treatments for 3 weeks after the procedure',
  'Avoid physical exercise for 3 days after the procedure',
  'Avoid coloured cosmetics and skin-care creams for 3 days after the procedure',
  'In the case of lip makeup, herpes may appear — use: hascovir, zovirax, or consult a doctor for a prescription for heviran',
  'CAUTION!!! Follow the post-treatment recommendations strictly. Do not mechanically remove scabs or flaking skin.',
  'CAUTION!!! Persistent inflammatory reactions lasting more than a week or the occurrence of any adverse reactions should be reported immediately to the Specialist performing the procedure.',
];

// LASER_TATTOO_REMOVAL - Laser removal of permanent makeup or tattoo
export const laseroweUsuwanieContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  zapalenieZakazenieSkory: 'Do you have skin inflammation or infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  chorobySerca: 'Do you suffer from heart disorders?',
  chorobyAutoimmunologiczne: 'Do you suffer from autoimmune diseases?',
  wysokieCisnienieKrwi: 'Do you have high blood pressure?',
  cukrzycaZaburzeniamiNaczyniowymi: 'Do you suffer from diabetes with vascular disorders?',
  chemioterapiaRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  nowotwor: 'Do you suffer from cancer?',
  zoltaczkaChorobyWatrobyNerek: 'Do you suffer from hepatitis or severe liver or kidney diseases?',
  zaburzeniaTarczycy: 'Do you suffer from thyroid disorders?',
  epilepsja: 'Do you suffer from epilepsy?',
  chorobyImmunologiczne: 'Do you suffer from immunological diseases?',
  luszczycaBielactwo: 'Do you suffer from psoriasis or vitiligo?',
  chorobyTkankiLacznej: 'Do you suffer from connective tissue diseases?',
  problemyKrazeniem: 'Do you have circulatory problems?',
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',
  lekiSwiatlouczulajace: 'Are you taking photosensitising medications or dietary supplements: marigold, St John\'s wort, nettle, rock rose, horsetail?',
  lekiAntydepresyjneSterydy: 'Are you taking antidepressants or steroids?',
  kuracjaAntybiotykowa: 'Are you currently undergoing antibiotic therapy, including retinoids?',
  leczenieStomatologiczne: 'Have you undergone dental treatment within the last week?',
  inneSchorzenia: {
    text: 'Do you have any other unlisted conditions, please specify:',
    hasFollowUp: true,
  },
};

export const laseroweUsuwanieNaturalReactions = [
  'redness',
  'scabs',
  'swelling',
  'discolouration',
  'depigmentation',
  'skin pallor',
  'texture changes',
  'blisters',
];

export const laseroweUsuwanieComplications = {
  czeste: [
    'redness',
    'scabs',
    'swelling',
    'discolouration',
    'depigmentation',
    'skin pallor',
    'texture changes',
    'blisters',
  ],
  rzadkie: [
    'allergic reactions',
    'bacterial infection',
    'infections',
    'raised wheals',
    'change of hair colour to grey or white shades (in the case of eyebrows)',
    'hyperpigmentation (may occur as a result of increased melanin production by melanocytes in response to heat generated by the laser. The risk of hyperpigmentation depends largely on skin type; people with darker complexions (Fitzpatrick phototype III and IV) are more susceptible to this complication. Clients with a high risk of hyperpigmentation should avoid sun exposure before and after the procedure)',
    'hypopigmentation (the most common chronic complication of laser therapy; the risk is higher in people with darker complexions)',
  ],
  bardzoRzadkie: [
    'keloids',
  ],
};

export const laseroweUsuwaniePreCare = [
  'Avoid UV exposure (SUN, TANNING BEDS) — for 1.5 months before the planned procedure',
  '1 week before the procedure do not perform mechanical peeling or hair removal at the site to be treated',
  'On the day of the procedure, precisely shave and thoroughly cleanse the skin',
];

export const laseroweUsuwaniePostCare = [
  'treat the treated area with special care',
  'do not touch or massage the treated areas',
  'maintain high hand hygiene, as there is a high risk of secondary infection',
  'avoid intense physical exercise and hot baths',
  'cool the surface where the procedure was performed with dry compresses',
  'avoid alcohol',
  'do not apply makeup in the treated area',
  'under no circumstances scratch off scabs',
  'do not use swimming pool or sauna during the treatment series and between sessions; washing the treated areas is only possible after 24 hours',
  'absolute ban on sunbathing and tanning beds during the treatment series and between sessions',
  'protect the treated area with a filter cream',
  'chemical and mechanical peeling is prohibited',
  'do not use alcohol-based toners or creams containing fruit acids or vitamin A/C for 4 weeks after the procedure',
  'do not cleanse the treated area with alcohol-based preparations (Octanisept is permitted)',
  'CAUTION!!! Follow the post-treatment recommendations strictly.',
  'CAUTION!!! Any adverse reactions should be reported immediately to the Specialist performing the procedure.',
];

// LASER_HAIR_REMOVAL - Laser hair removal
export const depilacjaLaserowaContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  chorobyNowotworowe: 'Do you suffer or have you suffered from cancer?',
  epilepsja: 'Do you suffer from epilepsy?',
  cukrzycaNiewyrownana: 'Do you suffer from diabetes (especially uncontrolled)?',
  chorobyHormonalne: 'Do you have hormonal diseases (e.g. thyroid, PCOS)?',
  chorobyAutoimmunologiczne: 'Do you have autoimmune diseases?',
  sklonnoscBliznowce: 'Do you have a tendency to develop keloids?',
  stanyZapalneRanyInfekcje: 'Are there any inflammation, wounds, infections or skin diseases at the treatment site?',
  tatuazeZnamionaMakijazPermanentny: 'Do you have tattoos, birthmarks or permanent makeup in the treatment area?',
  swiezaOpalenizna: 'Have you had fresh suntan (sun/tanning bed) within the last 14 days?',
  lekiSwiatlouczulajace: 'Are you taking photosensitising medications, herbs or supplements?',
  antybiotyki: 'Have you taken antibiotics within the last 14 days?',
  retinoidy: 'Do you use or have you used retinoids or vitamin A?',
  kosmetykiRetinolKwasySamoopalacz: {
    text: 'Have you used cosmetics with: retinol, acids, or self-tanner within the last 2 weeks?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes — please provide details...',
  },
  inneChorobyLeki: {
    text: 'Do you suffer from other unlisted diseases or do you regularly take any medications, herbs or dietary supplements (including over-the-counter medications)?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, please list them...',
  },
};

export const depilacjaLaserowaPreCare = [
  '14 days before the procedure do not sunbathe or use a tanning bed',
  '4–6 weeks before the procedure do not pluck hairs (wax, epilator, tweezers)',
  'Hairs may only be removed with a razor',
  '14 days before the procedure do not use: photosensitising medications and herbs, retinoids, vitamin A, antibiotics',
  'Do not use cosmetics containing retinol, acids, or self-tanners',
];

export const depilacjaLaserowaPostCare = [
  'For at least 14 days avoid sun and use SPF 30–50',
  'For 24–48 hours avoid sauna, swimming pool and hot baths',
  'For a few days do not use peels or cosmetics containing alcohol',
  'Between sessions remove hairs only with a razor',
];

export const depilacjaLaserowaNaturalReactions = [
  'Redness',
  'Swelling',
  'Burning',
  'Discolouration',
  'Scabs',
  'Blisters',
];

export const depilacjaLaserowaComplications = {
  czeste: [
    'Redness',
    'Swelling',
    'Burning',
  ],
  rzadkie: [
    'Discolouration',
    'Scabs',
    'Blisters',
  ],
  bardzoRzadkie: [
    'Keloids',
  ],
};



// BIOSTIMULATORS - Tissue stimulation
export const biostymulatoryContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  // ABSOLUTE CONTRAINDICATIONS
  ciazaLaktacja: 'Are you pregnant or breastfeeding?',
  zapalenieZakazenieSkory: 'Do you have skin inflammation or infection (acne, herpes, dermatitis, allergic or fungal changes in the treatment area, haemangiomas, lichen, warts, skin discontinuity, sunburn)?',
  nadwrazliwoscPreparat: {
    text: 'Do you have hypersensitivity to the preparation?',
    hasFollowUp: true,
    followUpPlaceholder: 'Which one?'
  },
  grzybiczeBakteryjneZapalenie: 'Do you have fungal/bacterial skin inflammation?',
  zaburzeniaSercowoNaczyniowe: 'Do you have cardiovascular disorders?',
  hemofilia: 'Do you suffer from haemophilia?',
  chemioterapiaRadioterapia: 'Have you undergone chemotherapy or radiotherapy in the past year?',
  nowotwor: 'Do you suffer from cancer?',
  hivZoltaczka: 'Do you suffer from HIV or hepatitis?',
  luszczycaAktywna: 'Do you suffer from psoriasis?',
  epilepsja: 'Do you suffer from epilepsy?',
  problemyGojenieRan: 'Do you have problems/difficulties with wound healing?',
  problemyKrzepliwoscKrwi: 'Do you have blood coagulation problems?',
  alergiaSkladnikiPreparatu: 'Are you allergic to the preparation ingredients?',
  alergiaZnieczulenie: 'Are you allergic to preparations used for local anaesthesia?',
  podatnoscBlizny: 'Do you have a tendency towards scar hypertrophy?',
  alkoholSrodkiOdurzajace: 'Have you consumed alcohol or other intoxicating substances in the last 2 days?',
  lekiPrzeciwzakrzepowe: 'Are you taking anticoagulant medications?',
  cukrzyca: 'Do you suffer from diabetes?',
  dnaMoczanowa: 'Do you suffer from gout?',
  trudnosciOddychaniem: 'Do you have difficulties breathing?',

  // RELATIVE CONTRAINDICATIONS
  problemyKrazeniem: 'Do you have circulatory problems?',
  chorobyAutoimmunologiczne: 'Do you suffer from autoimmune diseases?',

  // TEMPORARY CONTRAINDICATIONS
  wypelniaczeSkorneKwasHialuronowy: 'Have you used dermal fillers - hyaluronic acid?',
  zabiegiChirurgiczneTwarz: {
    text: 'Have you had surgical procedures in the facial area?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, which ones?'
  },
  antybiotykoterapia: 'Are you currently undergoing antibiotic therapy?',
  lekiRozrzedzajaceKrew: 'Are you taking blood-thinning medications? (aspirin, paracetamol, vitamin E, other)',
  lekiMiejscowe: 'Are you using topical medications in the treatment area?',
  temperaturaPrzeziebienie: 'Do you have an elevated body temperature or a cold on the day of the procedure?',
  sklonnosciSinceKrwawienie: 'Do you have a tendency to bruise or bleed?',
  tatuaze: 'Do you have tattoos?',
  makijazPermanentny: {
    text: 'Do you have permanent makeup?',
    hasFollowUp: true,
    followUpPlaceholder: 'If yes, when was it done and using which technique?'
  },
  inneSchorzenia: {
    text: 'Do you have any other conditions?',
    hasFollowUp: true,
    followUpPlaceholder: 'Please specify:'
  }
};

export const biostymulatorySideEffects = [
  'redness',
  'swelling',
  'bleeding',
  'bruising',
  'erythema',
  'itching',
  'pain',
  'thickening or nodules'
];

export const biostymulatoryComplications = {
  rzadkie: [
    'viral infection',
    'scar formation',
    'allergic reactions',
    'bacterial infection',
    'facial asymmetry'
  ],
  bardzoRzadkie: [
    'keloids'
  ]
};

export const biostymulatoryPreTreatment = [
  'avoid taking anti-inflammatory medications for a few days before the procedure',
  'take preparations with … for a few days before the procedure and until … after the procedure',
  'avoid alcohol on the day of the procedure',
  'avoid sunbathing or using a sauna for … days before the procedure'
];

export const biostymulatoryPostTreatment = [
  'treat the treated area with special care',
  'avoid pressing and massaging the face or other treated area',
  'for approximately … avoid excessive facial expressions',
  'maintain high hand hygiene, as there is a high risk of secondary infection',
  'do not wash with water, soap or exfoliating agents the areas subjected to injection for at least …',
  'avoid strong sun exposure for … and use high UV filter creams',
  'do not use tanning beds or cryotherapy treatments for …',
  'do not use sauna or swimming pool for at least …',
  'avoid physical exertion immediately after the procedure',
  'do not undergo chemical or mechanical peeling treatments for … weeks after the procedure',
  'CAUTION!!! Follow the post-treatment recommendations strictly.',
  'CAUTION!!! Any adverse reactions should be reported immediately to the Specialist performing the procedure.'
];

export const eyebrowTintingContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  reakcjaAlergiczna: {
    text: "Have you ever had an allergic reaction after eyebrow, eyelash or hair dyeing?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, please describe the symptoms...",
  },
  uczulenieSkladniki: {
    text: "Are you allergic to any of the following ingredients?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, which ones?...",
  },
  chorobySkoryOczu: {
    text: "Do you suffer from skin or eye diseases (e.g. eczema, herpes, stye, conjunctivitis)?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, which ones?...",
  },
  wrazliweOczy: "Do your eyes water, sting or are they very sensitive?",
  testUczuleniowy: {
    text: "Have you performed an allergy patch test for the dye within the last 48 h?",
    isPositiveAnswerSafe: true,
  },
  leki: {
    text: "Are you currently taking any medications?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, which ones?...",
  },
  ciazaKarmienie: "Are you pregnant or breastfeeding?",
  zabiegiOczy: {
    text: "Have you had any procedures in the eye area within the last 2 weeks?",
    hasFollowUp: true,
    followUpPlaceholder: "Which ones?...",
  },
};

export const eyebrowTintingPostCare: string[] = [
  "Avoid contact with water for 24 hours — Do not wash your face directly around the eyes, do not use a swimming pool, sauna or hot baths.",
  "Do not rub or scratch the area around the eyes and eyebrows — The skin may be slightly sensitive, and rubbing may weaken the effect of the dye.",
  "Do not use oily creams and oils around the eyes — They may dissolve the pigment and shorten the colour's durability.",
  "Avoid eye makeup for 24 hours — Especially mascara and eyeliner — they may irritate the freshly dyed area.",
  "Avoid sun exposure and tanning beds for 1–2 days — UV rays may weaken the pigment and cause irritation.",
  "Do not use strong makeup removers for a few days — Especially those containing alcohol, SLS, AHA or other irritating ingredients.",
  "Do not perform other procedures in the eye area for a few days — E.g. eyebrow shaping, eyelash lamination, lifting, etc.",
  "Gentle makeup removal and care",
];

export const eyebrowLaminationContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  alergiaSkladniki: {
    text: "Are you allergic to any cosmetic ingredients? (e.g. dyes, henna, keratin, latex, preservatives)",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, which ones?...",
  },
  reakcjaAlergiczna: {
    text: "Have you ever had an allergic reaction after eyebrow/eyelash or hair dyeing?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, please describe the symptoms...",
  },
  reakcjaOczyBrwi: {
    text: "Have you experienced any allergic reactions after previous cosmetic procedures around the eyes or eyebrows (e.g. redness, itching, swelling, rash)?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, which ones?...",
  },
  chorobySkory: {
    text: "Do you have atopic dermatitis (AD), psoriasis or another skin disease?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, which one?...",
  },
  alergiaSezonowa: {
    text: "Do you have seasonal allergy (e.g. to pollen, dust) or asthma? (people with such allergies are sometimes more sensitive to other ingredients)",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, to what?...",
  },
  skoraWrazliwa: "Do you have sensitive, reactive skin that is easily irritated?",
  noweKosmetyki: "Have you used any new cosmetics around the eyes or eyebrows within the last 48 hours?",
  lekiAntyhistaminowe: {
    text: "Are you currently taking antihistamine, steroid or immunosuppressive medications?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, which ones?...",
  },
  ciazaKarmienie: "Are you pregnant or breastfeeding? (increased skin sensitivity, altered reaction to ingredients)",
  zabiegiIntensywne: {
    text: "Have you had peels, laser treatments, acids, retinol or other intensive procedures in the eye/eyebrow area within the last 3 days?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, which ones?...",
  },
};

export const eyebrowLaminationPostCare: string[] = [
  "Moisturise the hairs — preferably with a keratin conditioner or a special eyebrow/eyelash serum recommended by the Stylist.",
  "Gently comb the eyebrows/eyelashes daily with the brush received after the procedure.",
  "Avoid strong cosmetics with alcohol, acids and retinol in the eyebrow/eyelash area.",
  "Avoid contact with water for 24 hours.",
  "Avoid sun exposure and tanning beds for 48 hours.",
];

export const eyelashExtensionContraindications: Record<string, string | ContraindicationWithFollowUp> = {
  previousReaction: "Have you ever had an allergic reaction after eyelash extension treatment?",
  glueAllergy: "Are you allergic to any ingredients of eyelash glue (e.g. cyanoacrylate, latex)?",
  eyeInfections: "Do you have any skin or eye allergies, such as conjunctivitis, stye or other eye infections?",
  sensitiveEyes: "Do you have sensitive skin or eyes that are easily irritated?",
  eyeDiseases: "Do you suffer from any eye conditions, such as dry eye syndrome, Demodex, or watery eyes?",
  medications: {
    text: "Are you currently taking any medications (including steroids, anti-allergy medications or eye preparations)?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, please provide the name of the medication...",
  },
  pregnancy: "Are you pregnant or breastfeeding?",
  cosmeticsAllergy: "Have you previously had any allergic reactions after using eye or face cosmetics?",
  contactLenses: {
    text: "Do you wear contact lenses? (If yes, please remove lenses before the procedure.)",
    hasFollowUp: false,
  },
  recentCosmetics: "Have you used eye cosmetics such as mascara, eyeliner, or conditioners within the last 48 hours?",
  recentTreatments: {
    text: "Have you had any procedures in the eye area (e.g. Botox, aesthetic medicine treatments)?",
    hasFollowUp: true,
    followUpPlaceholder: "If yes, please provide details...",
  },
};

export const eyelashExtensionPostCare: string[] = [
  "CAUTION: Avoid oily cosmetics around the eyes (especially oil-based makeup removers), as they weaken the glue.",
  "Do not rub your eyes or pull the lashes — this may lead to damage or shedding.",
  "Regularly clean the lashes with a special shampoo or gentle cleanser to remove impurities.",
  "Comb the lashes daily with a soft brush to maintain their shape.",
  "Do not use an eyelash curler on extensions — it may break them.",
  "Avoid mascara (it weighs down the lashes and accelerates detachment).",
  "Regularly top up the lashes every 2–3 weeks to maintain the effect.",
  "Sleep on your back or avoid pressing your face into the pillow.",
];

// Mapping of form types to sets of questions
export const contraindicationsByFormType: Record<FormType, Record<string, string | ContraindicationWithFollowUp>> = {
  LIP_AUGMENTATION: modelowanieUstContraindications,
  FACIAL_VOLUMETRY: wolumetriaTwarzyContraindications,
  NEEDLE_MESOTHERAPY: mezoterapiaIglowaContraindications,
  INJECTION_LIPOLYSIS: lipolizaIniekcyjnaContraindications,
  PERMANENT_MAKEUP: makijazPermanentnyContraindications,

  LASER_HAIR_REMOVAL: depilacjaLaserowaContraindications,
  LASER_TATTOO_REMOVAL: laseroweUsuwanieContraindications,
  WRINKLE_REDUCTION: wolumetriaTwarzyContraindications,
  EYELID_LIFT: plasmaLiftingContraindications,
  TISSUE_STIMULATION: biostymulatoryContraindications,
  EYEBROW_TINTING: eyebrowTintingContraindications,
  EYEBROW_LAMINATION: eyebrowLaminationContraindications,
  EYELASH_EXTENSION: eyelashExtensionContraindications,
};

// Backwards compatibility (for legacy imports)
export const defaultContraindications = {};
export const contraindicationLabels = hyaluronicContraindications;
