/**
 * Serwer-side generator PDF dla kart zgody
 * Używa @react-pdf/renderer — działa TYLKO po stronie serwera (Node.js / Next.js API Routes)
 */
import React from "react";
import path from "path";
import fs from "fs";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";

// Ścieżka do logo — bezwzględna, wymagana przez @react-pdf/renderer
const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");
const FACE_CHART_PATH = path.join(
  process.cwd(),
  "public",
  "women-face-chart.jpg",
);
const BODY_CHART_PATH = path.join(
  process.cwd(),
  "public",
  "women-body-chart.JPG",
);

// Pre-load images as base64 data URLs for embedding in PDF diagrams
const FACE_CHART_B64 = `data:image/jpeg;base64,${fs.readFileSync(FACE_CHART_PATH).toString("base64")}`;
const BODY_CHART_B64 = `data:image/jpeg;base64,${fs.readFileSync(BODY_CHART_PATH).toString("base64")}`;

// ─── Rejestracja fontu z obsługą polskich znaków ────────────────────────────
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf",
      fontStyle: "italic",
    },
  ],
});

// ─── Mapping of treatment zone names (ID → English name) ──────────────────
const ZONE_NAME_MAP: Record<string, string> = {
  forehead: "Forehead",
  glabella: "Frown Lines",
  nose: "Nose",
  eyebrow_right: "Right Eyebrow",
  eyebrow_left: "Left Eyebrow",
  left_eye: "Left Eye (Tear Trough)",
  right_eye: "Right Eye (Tear Trough)",
  left_cheek: "Left Cheek",
  right_cheek: "Right Cheek",
  lips: "Lips",
  chin: "Chin",
  marionette_lines: "Marionette Lines",
  left_jaw: "Jawline (Left)",
  right_jaw: "Jawline (Right)",
  nasolabial_folds: "Nasolabial Folds",
  dekolt: "Cleavage",
  eyelid_left: "Left Eyelid",
  eyelid_right: "Right Eyelid",
  // Body zones
  arm_left: "Left Arm",
  arm_right: "Right Arm",
  forearm_left: "Left Forearm",
  forearm_right: "Right Forearm",
  belly: "Abdomen",
  chest: "Chest",
  thight_left: "Left Thigh",
  thight_right: "Right Thigh",
  back: "Back",
  calf_left: "Left Calf",
  calf_right: "Right Calf",
  neck: "Neck",
  shin_left: "Left Shin",
  shin_right: "Right Shin",
  bikini_area: "Bikini",
  ass: "Buttocks",
  face: "Face",
};

// Zbiory ID stref: twarz vs ciało
const FACE_ZONE_IDS = new Set([
  "forehead",
  "glabella",
  "nose",
  "eyebrow_right",
  "eyebrow_left",
  "left_eye",
  "right_eye",
  "left_cheek",
  "right_cheek",
  "lips",
  "chin",
  "marionette_lines",
  "jaw_left",
  "jaw_right",
  "nasolabial_folds",
  "dekolt",
  "eyelid_left",
  "eyelid_right",
  "neck",
]);

/** Rozdziela zone IDs na twarz i ciało */
function splitZonesByType(zones: string): { face: string[]; body: string[] } {
  const ids = zones
    .split(",")
    .map((z) => z.trim())
    .filter(Boolean);
  const face: string[] = [];
  const body: string[] = [];
  for (const id of ids) {
    if (FACE_ZONE_IDS.has(id)) {
      face.push(id);
    } else {
      body.push(id);
    }
  }
  return { face, body };
}

// ─── Import danych stref anatomicznych ────────────────────────────────────
import { ZONES as FACE_ZONES } from "@/types/face-zones";
import { BODY_ZONES } from "@/types/body-zones";

// ─── Import danych per-typ formularza ──────────────────────────────────────
import {
  modelowanieUstContraindications,
  modelowanieUstNaturalReactions,
  modelowanieUstPostCare,
  modelowanieUstComplications,
  wolumetriaTwarzyContraindications,
  wolumetriaTwarzyNaturalReactions,
  wolumetriaTwarzyPostCare,
  wolumetriaTwarzyComplications,
  mezoterapiaIglowaContraindications,
  mezoterapiaIglowaNaturalReactions,
  mezoterapiaIglowaPostCare,
  mezoterapiaIglowaComplications,
  mezoterapiaIglowaComplicationsVeryRare,
  lipolizaIniekcyjnaContraindications,
  lipolizaIniekcyjnaNaturalReactions,
  lipolizaIniekcyjnaPostCare,
  lipolizaIniekcyjnaComplications,
  makijazPermanentnyContraindications,
  makijazPermanentnyNaturalReactions,
  makijazPermanentnyPostCare,
  makijazPermanentnyComplications,
  depilacjaLaserowaContraindications,
  depilacjaLaserowaNaturalReactions,
  depilacjaLaserowaPostCare,
  depilacjaLaserowaComplications,
  laseroweUsuwanieContraindications,
  laseroweUsuwanieNaturalReactions,
  laseroweUsuwaniePostCare,
  laseroweUsuwanieComplications,
  biostymulatoryContraindications,
  biostymulatorySideEffects,
  biostymulatoryPostTreatment,
  biostymulatoryComplications,
  eyebrowTintingContraindications,
  eyebrowTintingPostCare,
  eyebrowLaminationContraindications,
  hyaluronicContraindications,
  hyaluronicNaturalReactions,
  hyaluronicPostCare,
  hyaluronicComplications,
  rodoInfo,
  ContraindicationWithFollowUp,
} from "@/types/booking";

// ─── Typy ─────────────────────────────────────────────────────────────────
interface ConsentFormData {
  id: string;
  type: string;
  createdAt: string;
  imieNazwisko: string;
  email?: string | null;
  ulica?: string | null;
  kodPocztowy?: string | null;
  miasto?: string | null;
  dataUrodzenia?: string | null;
  telefon: string;
  miejscowoscData: string;
  nazwaProduktu?: string | null;
  obszarZabiegu?: string | null;
  celEfektu?: string | null;
  przeciwwskazania: Record<string, string | boolean | null>;
  zgodaPrzetwarzanieDanych: boolean;
  zgodaMarketing: boolean;
  zgodaFotografie: boolean;
  zgodaPomocPrawna: boolean;
  miejscaPublikacjiFotografii?: string | null;
  podpisDane?: string | null;
  podpisMarketing?: string | null;
  podpisFotografie?: string | null;
  podpisRodo?: string | null;
  podpisRodo2?: string | null;
  informacjaDodatkowa?: string | null;
  zastrzeniaKlienta?: string | null;
  numerZabiegu?: string | null;
  osobaPrzeprowadzajacaZabieg?: string | null;
  planowanaIloscZabiegow?: string | null;
  odstepMiedzyZabiegami?: string | null;
  kolejneZabiegiOdstepy?: string | null;
  iloscProduktu?: string | null;
  signatureStatus?: string | null;
  signatureVerifiedAt?: string | null;
}

interface FormContent {
  title: string;
  subtitle: string;
  contraindications: Record<string, string | ContraindicationWithFollowUp>;
  naturalReactions?: string[];
  complications?: {
    czeste?: string[];
    rzadkie?: string[];
    bardzoRzadkie?: string[];
  };
  postCare?: string[];
  additionalComplications?: string[];
}

// ─── Mapping type → form data ──────────────────────────────────────
function getFormContent(type: string): FormContent {
  switch (type) {
    case "LIP_AUGMENTATION":
      return {
        title: "CONSENT FORM FOR LIP MODELING TREATMENT",
        subtitle: "Lip Modeling / Augmentation with Hyaluronic Acid",
        contraindications: modelowanieUstContraindications,
        naturalReactions: modelowanieUstNaturalReactions,
        complications: modelowanieUstComplications,
        postCare: modelowanieUstPostCare,
      };
    case "FACIAL_VOLUMETRY":
    case "WRINKLE_REDUCTION":
      return {
        title: "CONSENT FORM FOR FACIAL VOLUMETRY TREATMENT",
        subtitle: "Facial Volumetry / Wrinkle Reduction with Hyaluronic Acid",
        contraindications: wolumetriaTwarzyContraindications,
        naturalReactions: wolumetriaTwarzyNaturalReactions,
        complications: wolumetriaTwarzyComplications,
        postCare: wolumetriaTwarzyPostCare,
      };
    case "NEEDLE_MESOTHERAPY":
      return {
        title: "CONSENT FORM FOR NEEDLE MESOTHERAPY TREATMENT",
        subtitle: "Needle Mesotherapy",
        contraindications: mezoterapiaIglowaContraindications,
        naturalReactions: mezoterapiaIglowaNaturalReactions,
        complications: {
          czeste: mezoterapiaIglowaComplications,
          rzadkie: [],
          bardzoRzadkie: mezoterapiaIglowaComplicationsVeryRare,
        },
        postCare: mezoterapiaIglowaPostCare,
      };
    case "INJECTION_LIPOLYSIS":
      return {
        title: "CONSENT FORM FOR INJECTION LIPOLYSIS TREATMENT",
        subtitle: "Injection Lipolysis",
        contraindications: lipolizaIniekcyjnaContraindications,
        naturalReactions: lipolizaIniekcyjnaNaturalReactions,
        complications: lipolizaIniekcyjnaComplications,
        postCare: lipolizaIniekcyjnaPostCare,
      };
    case "PERMANENT_MAKEUP":
      return {
        title: "CONSENT FORM FOR PERMANENT MAKEUP",
        subtitle: "Permanent Makeup",
        contraindications: makijazPermanentnyContraindications,
        naturalReactions: makijazPermanentnyNaturalReactions,
        complications: makijazPermanentnyComplications,
        postCare: makijazPermanentnyPostCare,
      };
    case "LASER_HAIR_REMOVAL":
      return {
        title: "CONSENT FORM FOR LASER HAIR REMOVAL",
        subtitle: "Laser Hair Removal",
        contraindications: depilacjaLaserowaContraindications,
        naturalReactions: depilacjaLaserowaNaturalReactions,
        complications: depilacjaLaserowaComplications,
        postCare: depilacjaLaserowaPostCare,
      };
    case "LASER_TATTOO_REMOVAL":
    case "LASER":
      return {
        title: "CONSENT FORM FOR LASER REMOVAL",
        subtitle: "Laser Tattoo / Skin Lesion Removal",
        contraindications: laseroweUsuwanieContraindications,
        naturalReactions: laseroweUsuwanieNaturalReactions,
        complications: laseroweUsuwanieComplications,
        postCare: laseroweUsuwaniePostCare,
      };
    case "TISSUE_STIMULATION":
      return {
        title: "CONSENT FORM FOR TISSUE STIMULATION",
        subtitle: "Tissue Stimulation (Biostimulators)",
        contraindications: biostymulatoryContraindications,
        naturalReactions: biostymulatorySideEffects,
        complications: biostymulatoryComplications,
        postCare: biostymulatoryPostTreatment,
      };
    case "EYEBROW_TINTING":
      return {
        title: "CONSENT FORM FOR EYEBROW TINTING",
        subtitle: "Eyebrow Tinting / Henna",
        contraindications: eyebrowTintingContraindications,
        postCare: eyebrowTintingPostCare,
      };
    case "EYEBROW_LAMINATION":
      return {
        title: "CONSENT FORM FOR EYEBROW LAMINATION",
        subtitle: "Eyebrow Lamination",
        contraindications: eyebrowLaminationContraindications,
      };
    case "EYELASH_EXTENSION":
      return {
        title: "CONSENT FORM FOR EYELASH EXTENSIONS",
        subtitle: "Eyelash Extension / Styling",
        contraindications: hyaluronicContraindications,
      };
    case "EYELID_LIFT":
      return {
        title: "CONSENT FORM FOR EYELID LIFT",
        subtitle: "Eyelid Lift",
        contraindications: hyaluronicContraindications,
      };
    // Legacy types
    case "HYALURONIC":
      return {
        title: "CONSENT FORM FOR HYALURONIC ACID TREATMENT",
        subtitle: "Hyaluronic Acid Treatment",
        contraindications: hyaluronicContraindications,
        naturalReactions: hyaluronicNaturalReactions,
        complications: hyaluronicComplications,
        postCare: hyaluronicPostCare,
      };
    case "PMU":
      return {
        title: "CONSENT FORM FOR PERMANENT MAKEUP",
        subtitle: "Permanent Makeup (Legacy)",
        contraindications: makijazPermanentnyContraindications,
        naturalReactions: makijazPermanentnyNaturalReactions,
        complications: makijazPermanentnyComplications,
        postCare: makijazPermanentnyPostCare,
      };
    default:
      return {
        title: "CONSENT FORM FOR COSMETIC TREATMENT",
        subtitle: "Cosmetic Treatment",
        contraindications: hyaluronicContraindications,
        naturalReactions: hyaluronicNaturalReactions,
        postCare: hyaluronicPostCare,
      };
  }
}

// ─── Kolory brandowe ───────────────────────────────────────────────────────
const GOLD = "#C9A84C";
const DARK = "#1a1a1a";
const GRAY = "#555555";
const LIGHT_GRAY = "#f5f5f5";
const WHITE = "#FFFFFF";
const RED = "#c0392b";
const GREEN_DARK = "#1a5c2a";

// ─── Style PDF ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 36,
    backgroundColor: WHITE,
    fontSize: 9,
    fontFamily: "Roboto",
    color: DARK,
  },
  // Header
  header: {
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 10,
    marginBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  salonName: {
    fontSize: 12,
    fontFamily: "Roboto",
    fontWeight: "bold",
    color: GOLD,
    marginTop: 2,
  },
  logoImage: {
    height: 80,
    width: 240,
    objectFit: "contain",
  },

  salonSubtitle: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },
  headerDate: {
    fontSize: 8,
    color: GRAY,
    textAlign: "right",
  },
  docTitle: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: "Roboto",
    fontWeight: "bold",
    color: DARK,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  docSubtitle: {
    fontSize: 9,
    color: GOLD,
    textAlign: "center",
    marginTop: 3,
  },
  // Sekcje
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: "Roboto",
    fontWeight: "bold",
    color: GOLD,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: GOLD,
    paddingBottom: 3,
    marginBottom: 6,
  },
  // Client Data
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    color: GRAY,
    width: 100,
    fontFamily: "Roboto",
    fontWeight: "bold",
  },
  value: {
    fontSize: 8.5,
    color: DARK,
    flex: 1,
  },
  // Przeciwwskazania
  contraindicationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  contraindicationRowAlt: {
    backgroundColor: LIGHT_GRAY,
  },
  contraindicationText: {
    flex: 1,
    fontSize: 7.5,
    color: DARK,
    paddingRight: 6,
  },
  answerBadge: {
    width: 22,
    textAlign: "center",
    fontSize: 7.5,
    fontFamily: "Roboto",
    fontWeight: "bold",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  answerYes: {
    color: RED,
  },
  answerNo: {
    color: GREEN_DARK,
  },
  answerDetails: {
    fontSize: 7,
    color: GOLD,
    marginTop: 2,
    marginLeft: 4,
    flex: 1,
    fontFamily: "Roboto",
    fontStyle: "italic",
  },
  // Lista punktowana
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "flex-start",
  },
  bullet: {
    fontSize: 8,
    color: GOLD,
    width: 10,
  },
  goldDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginRight: 6,
    marginTop: 3,
  },
  bulletText: {
    fontSize: 7.5,
    color: DARK,
    flex: 1,
  },
  // Signature
  signatureSection: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: GRAY,
    fontFamily: "Roboto",
    fontWeight: "bold",
    marginBottom: 4,
  },
  signatureImage: {
    height: 60,
    objectFit: "contain",
    marginBottom: 4,
  },
  signatureDate: {
    fontSize: 7.5,
    color: GRAY,
    textAlign: "right",
    fontFamily: "Roboto",
    fontStyle: "italic",
  },
  // Stopka
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: GOLD,
    paddingTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: GRAY,
  },
  footerGold: {
    fontSize: 7,
    color: GOLD,
    fontFamily: "Roboto",
    fontWeight: "bold",
  },
  // Status badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN_DARK,
    marginRight: 4,
  },
  statusText: {
    fontSize: 7.5,
    color: GREEN_DARK,
    fontFamily: "Roboto",
    fontWeight: "bold",
  },
  pageNumber: {
    fontSize: 7,
    color: GRAY,
    textAlign: "right",
  },
  consentBox: {
    backgroundColor: LIGHT_GRAY,
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    marginBottom: 8,
  },
  consentText: {
    fontSize: 7.5,
    color: DARK,
    lineHeight: 1.4,
  },
  twoCol: {
    flexDirection: "row",
    gap: 8,
  },
  col: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#f0ebe0",
    borderRadius: 3,
    fontSize: 7.5,
  },
  zoneChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#f5f0e0",
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 10,
    fontSize: 7,
    color: GOLD,
    fontFamily: "Roboto",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  consentCheck: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: GOLD,
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  consentCheckFilled: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: GREEN_DARK,
    backgroundColor: GREEN_DARK,
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    fontSize: 8,
    color: WHITE,
    fontFamily: "Roboto",
    fontWeight: "bold",
  },
  consentLabel: {
    fontSize: 8,
    color: DARK,
    flex: 1,
  },
});

// ─── Helper: tekst przeciwwskazania ────────────────────────────────────────
function getContraText(val: string | ContraindicationWithFollowUp): string {
  if (typeof val === "string") return val;
  return val.text;
}

// ─── Komponenty schematów anatomicznych do PDF ──────────────────────────────

/** Schemat twarzy — zdjęcie twarzy z narośleżonymi strefami */
function FaceDiagramPDF({ selectedIds }: { selectedIds: string[] }) {
  // Map form values (names) to internal IDs
  const activeIds = (selectedIds || []).map((val) => {
    const formVal = val.trim().toUpperCase();
    const match = FACE_ZONES.find(
      (z) => z.id.toUpperCase() === formVal || z.name.toUpperCase() === formVal,
    );
    return match ? match.id : val;
  });
  const selected = new Set(activeIds);
  return (
    <View style={{ width: 250, height: 250, position: "relative" }}>
      <Image
        src={FACE_CHART_B64}
        style={{
          width: 250,
          height: 250,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 250,
          height: 250,
        }}
      >
        <Svg viewBox="0 0 980 980" style={{ width: 250, height: 250 }}>
          {FACE_ZONES.map((zone) => {
            const isSelected = selected.has(zone.id);
            return (
              <Path
                key={zone.id}
                d={zone.d}
                fill="#D4AF37"
                fillOpacity={isSelected ? 0.55 : 0.15}
                stroke={isSelected ? "#B8941E" : "#D4AF37"}
                strokeWidth={isSelected ? 5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

/** Schemat ciała — zdjęcie ciała z narośleżonymi strefami */
function BodyDiagramPDF({ selectedIds }: { selectedIds: string[] }) {
  // Map form values (names) to internal IDs
  const activeIds = (selectedIds || []).map((val) => {
    const formVal = val.trim().toUpperCase();
    const match = BODY_ZONES.find(
      (z) => z.id.toUpperCase() === formVal || z.name.toUpperCase() === formVal,
    );
    return match ? match.id : val;
  });
  const selected = new Set(activeIds);
  return (
    <View style={{ width: 220, height: 310, position: "relative" }}>
      <Image
        src={BODY_CHART_B64}
        style={{
          width: 220,
          height: 310,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 220,
          height: 310,
        }}
      >
        <Svg viewBox="0 0 724 1024" style={{ width: 220, height: 310 }}>
          {BODY_ZONES.map((zone) => {
            const isSelected = selected.has(zone.id);
            return (
              <Path
                key={zone.id}
                d={zone.d}
                fill="#D4AF37"
                fillOpacity={isSelected ? 0.55 : 0.15}
                stroke={isSelected ? "#B8941E" : "#D4AF37"}
                strokeWidth={isSelected ? 5 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

// ─── Komponent PDF ─────────────────────────────────────────────────────────
function ConsentFormPDF({
  form,
  content,
}: {
  form: ConsentFormData;
  content: FormContent;
}) {
  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    // Already in dd.mm.rrrr format
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(d)) return d;
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString("en-IE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const today = new Date().toLocaleDateString("en-IE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const kontraEntries = Object.entries(content.contraindications);
  const hasComplications =
    content.complications &&
    ((content.complications.czeste?.length ?? 0) > 0 ||
      (content.complications.rzadkie?.length ?? 0) > 0 ||
      (content.complications.bardzoRzadkie?.length ?? 0) > 0);

  return (
    <Document
      title={content.title}
      author={rodoInfo.firmaNazwa}
      subject="Consent Form"
    >
      {/* ═══ PAGE 1: Client Data + Contraindications ═══ */}
      <Page size="A4" style={styles.page} wrap>
        {/* Header ze logo */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Image src={LOGO_PATH} style={styles.logoImage} />
              <Text style={styles.salonSubtitle}>{rodoInfo.adres}</Text>
            </View>
            <View>
              <Text style={styles.headerDate}>Print date: {today}</Text>
              <Text style={styles.headerDate}>
                Nr doc.: {form.id.substring(0, 8).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.docTitle}>{content.title}</Text>
          <Text style={styles.docSubtitle}>{content.subtitle}</Text>
        </View>

        {/* SMS signature status */}
        {form.signatureStatus === "VERIFIED" ||
        form.signatureStatus === "SIGNED" ? (
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              Signature electronically verified
              {form.signatureVerifiedAt
                ? ` • ${formatDate(form.signatureVerifiedAt)}`
                : ""}
            </Text>
          </View>
        ) : null}

        {/* Client Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Data</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.value}>{form.imieNazwisko}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date of birth:</Text>
                <Text style={styles.value}>
                  {formatDate(form.dataUrodzenia)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{form.telefon}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{form.email || "—"}</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.row}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>
                  {form.ulica ? `${form.ulica}, ` : ""}
                  {form.kodPocztowy ? `${form.kodPocztowy} ` : ""}
                  {form.miasto || "—"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Treatment date:</Text>
                <Text style={styles.value}>{form.miejscowoscData}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Specialist:</Text>
                <Text style={styles.value}>
                  {form.osobaPrzeprowadzajacaZabieg || "—"}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Treatment type:</Text>
                <Text style={styles.value}>{content.subtitle}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Treatment details */}
        {(form.nazwaProduktu || form.iloscProduktu || form.celEfektu) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment Details</Text>
            <View style={styles.twoCol}>
              <View style={styles.col}>
                {form.nazwaProduktu && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Product:</Text>
                    <Text style={styles.value}>{form.nazwaProduktu}</Text>
                  </View>
                )}
                {form.iloscProduktu && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Amount:</Text>
                    <Text style={styles.value}>{form.iloscProduktu}</Text>
                  </View>
                )}
              </View>
              <View style={styles.col}>
                {form.celEfektu && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Goal / Effect:</Text>
                    <Text style={styles.value}>{form.celEfektu}</Text>
                  </View>
                )}
              </View>
            </View>
            {/* Treatment series */}
            {form.planowanaIloscZabiegow && (
              <View style={styles.row}>
                <Text style={styles.label}>Series:</Text>
                <Text style={styles.value}>
                  {form.planowanaIloscZabiegow} session(s), interval:{" "}
                  {form.odstepMiedzyZabiegami || "—"}, next:{" "}
                  {form.kolejneZabiegiOdstepy || "—"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Treatment Area — text zone chips + anatomical diagrams */}
        {form.obszarZabiegu &&
          (() => {
            const { face, body } = splitZonesByType(form.obszarZabiegu);
            const FORMS_WITH_FACE_SELECTOR: string[] = [
              "FACIAL_VOLUMETRY",
              "WRINKLE_REDUCTION",
              "TISSUE_STIMULATION",
              "PERMANENT_MAKEUP",
              "LASER_TATTOO_REMOVAL",
            ];
            const FORMS_WITH_BODY_SELECTOR: string[] = [
              "LASER_TATTOO_REMOVAL",
              "LASER_HAIR_REMOVAL",
            ];
            const showFaceDiagram =
              FORMS_WITH_FACE_SELECTOR.includes(form.type) && face.length > 0;
            const showBodyDiagram =
              FORMS_WITH_BODY_SELECTOR.includes(form.type) && body.length > 0;
            return (
              <View style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>Treatment Area</Text>
                <View style={{ gap: 6 }}>
                  {face.length > 0 && (
                    <View>
                      <Text
                        style={{
                          fontSize: 7.5,
                          fontFamily: "Roboto",
                          fontWeight: "bold",
                          color: GRAY,
                          marginBottom: 3,
                        }}
                      >
                        Selected zones — Face:
                      </Text>
                      <View style={styles.chipRow}>
                        {face.map((id, i) => (
                          <Text key={i} style={styles.zoneChip}>
                            {ZONE_NAME_MAP[id] || id}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                  {body.length > 0 && (
                    <View>
                      <Text
                        style={{
                          fontSize: 7.5,
                          fontFamily: "Roboto",
                          fontWeight: "bold",
                          color: GRAY,
                          marginBottom: 3,
                        }}
                      >
                        Selected zones — Body:
                      </Text>
                      <View style={styles.chipRow}>
                        {body.map((id, i) => (
                          <Text key={i} style={styles.zoneChip}>
                            {ZONE_NAME_MAP[id] || id}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                  {(showFaceDiagram || showBodyDiagram) && (
                    <View style={{ marginTop: 8 }}>
                      <Text
                        style={{
                          fontSize: 7.5,
                          fontFamily: "Roboto",
                          fontWeight: "bold",
                          color: GRAY,
                          marginBottom: 6,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Visualisation of the treatment area
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "center",
                          alignItems: "flex-start",
                          gap: 16,
                        }}
                      >
                        {showFaceDiagram && (
                          <FaceDiagramPDF selectedIds={face} />
                        )}
                        {showBodyDiagram && (
                          <BodyDiagramPDF selectedIds={body} />
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })()}

        {/* Przeciwwskazania — na osobnej stronie */}
        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>
            Medical Interview — Contraindications
          </Text>
          {kontraEntries.map(([key, val], idx) => {
            const questionText = getContraText(val);
            const answer = form.przeciwwskazania[key];
            const isYes = answer === true;
            const detailsKey = `${key}_details`;
            const details = form.przeciwwskazania[detailsKey] as
              | string
              | undefined;
            const isContraindicationWithFollowUp =
              typeof val === "object" && val.hasFollowUp;

            return (
              <View
                key={key}
                style={[
                  styles.contraindicationRow,
                  idx % 2 === 0 ? styles.contraindicationRowAlt : {},
                ]}
              >
                <Text style={styles.contraindicationText}>{questionText}</Text>
                <Text
                  style={[
                    styles.answerBadge,
                    isYes ? styles.answerYes : styles.answerNo,
                  ]}
                >
                  {isYes ? "YES" : "NO"}
                </Text>
                {isYes && isContraindicationWithFollowUp && details && (
                  <Text style={styles.answerDetails}>→ {details}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Informacja dodatkowa */}
        {form.informacjaDodatkowa && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <Text style={styles.consentText}>{form.informacjaDodatkowa}</Text>
          </View>
        )}

        {/* Stopka */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {rodoInfo.firmaNazwa} • Consent Form no{" "}
            {form.id.substring(0, 8).toUpperCase()}
          </Text>
          <Text
            style={styles.footerGold}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ═══ PAGE 2: Effects, Recommendations, GDPR ═══ */}
      <Page size="A4" style={styles.page} wrap>
        {/* Continuation header with logo */}
        <View style={[styles.header, { paddingBottom: 6 }]}>
          <View style={styles.headerTop}>
            <Image
              src={LOGO_PATH}
              style={[styles.logoImage, { height: 55, width: 165 }]}
            />
            <Text style={[styles.docTitle, { fontSize: 10 }]}>
              {content.title} — Continuation
            </Text>
          </View>
        </View>

        {/* Naturalne reakcje */}
        {content.naturalReactions && content.naturalReactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Possible Reactions After Treatment (Common)
            </Text>
            {content.naturalReactions.map((r, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.goldDot} />
                <Text style={styles.bulletText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Powikłania */}
        {hasComplications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Possible Complications</Text>
            <View style={styles.twoCol}>
              {content.complications!.czeste &&
                content.complications!.czeste.length > 0 && (
                  <View style={styles.col}>
                    <Text
                      style={{
                        fontSize: 7.5,
                        fontFamily: "Roboto",
                        fontWeight: "bold",
                        color: GRAY,
                        marginBottom: 3,
                      }}
                    >
                      Common:
                    </Text>
                    {content.complications!.czeste.map((c, i) => (
                      <View key={i} style={styles.bulletItem}>
                        <View style={styles.goldDot} />
                        <Text style={styles.bulletText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                )}
              {(content.complications!.rzadkie?.length ?? 0) +
                (content.complications!.bardzoRzadkie?.length ?? 0) >
                0 && (
                <View style={styles.col}>
                  {content.complications!.rzadkie &&
                    content.complications!.rzadkie.length > 0 && (
                      <>
                        <Text
                          style={{
                            fontSize: 7.5,
                            fontFamily: "Roboto",
                            fontWeight: "bold",
                            color: GRAY,
                            marginBottom: 3,
                          }}
                        >
                          Rare:
                        </Text>
                        {content.complications!.rzadkie.map((c, i) => (
                          <View key={i} style={styles.bulletItem}>
                            <View style={styles.goldDot} />
                            <Text style={styles.bulletText}>{c}</Text>
                          </View>
                        ))}
                      </>
                    )}
                  {content.complications!.bardzoRzadkie &&
                    content.complications!.bardzoRzadkie.length > 0 && (
                      <>
                        <Text
                          style={{
                            fontSize: 7.5,
                            fontFamily: "Roboto",
                            fontWeight: "bold",
                            color: GRAY,
                            marginBottom: 3,
                            marginTop: 4,
                          }}
                        >
                          Very rare:
                        </Text>
                        {content.complications!.bardzoRzadkie.map((c, i) => (
                          <View key={i} style={styles.bulletItem}>
                            <View style={styles.goldDot} />
                            <Text style={styles.bulletText}>{c}</Text>
                          </View>
                        ))}
                      </>
                    )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Post-treatment recommendations */}
        {content.postCare && content.postCare.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Post-Treatment Recommendations
            </Text>
            {content.postCare.map((p, i) => (
              <View key={i} style={styles.bulletItem}>
                <View style={styles.goldDot} />
                <Text
                  style={[
                    styles.bulletText,
                    p.startsWith("WARNING") || p.startsWith("UWAGA")
                      ? { fontFamily: "Roboto", fontWeight: "bold", color: RED }
                      : {},
                  ]}
                >
                  {p}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* GDPR Consent */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            GDPR — Consent for Data Processing
          </Text>
          <View style={styles.consentBox}>
            <Text style={styles.consentText}>{rodoInfo.consentText}</Text>
          </View>
          {form.podpisRodo && (
            <View
              style={[
                styles.signatureSection,
                { width: "50%", alignSelf: "flex-end", marginTop: 4 },
              ]}
              wrap={false}
            >
              <Text style={styles.signatureLabel}>GDPR (Data Processing):</Text>
              <Image
                src={form.podpisRodo}
                style={[styles.signatureImage, { height: 40, marginBottom: 2 }]}
              />
              <Text style={styles.signatureDate}>{form.miejscowoscData}</Text>
            </View>
          )}
        </View>

        {/* RODO Klauzula */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>GDPR Information Clause</Text>
          <View style={styles.consentBox}>
            <Text style={styles.consentText}>{rodoInfo.clauseText}</Text>
          </View>
          {form.podpisRodo2 && (
            <View
              style={[
                styles.signatureSection,
                { width: "50%", alignSelf: "flex-end", marginTop: 4 },
              ]}
              wrap={false}
            >
              <Text style={styles.signatureLabel}>GDPR (Clause):</Text>
              <Image
                src={form.podpisRodo2}
                style={[styles.signatureImage, { height: 40, marginBottom: 2 }]}
              />
              <Text style={styles.signatureDate}>{form.miejscowoscData}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {rodoInfo.firmaNazwa} • Consent Form No.{" "}
            {form.id.substring(0, 8).toUpperCase()}
          </Text>
          <Text
            style={styles.footerGold}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ═══ PAGE 3: Additional Consents + Treatment Signatures ═══ */}
      <Page size="A4" style={styles.page} wrap>
        <View style={[styles.header, { paddingBottom: 6 }]}>
          <View style={styles.headerTop}>
            <Image
              src={LOGO_PATH}
              style={[styles.logoImage, { height: 55, width: 165 }]}
            />
            <Text style={[styles.docTitle, { fontSize: 10 }]}>
              {content.title} — Consents & Signatures
            </Text>
          </View>
        </View>

        {/* Zgody i Oświadczenia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consents Granted (Marked = X)</Text>
          <View style={styles.consentRow}>
            <View
              style={
                form.zgodaPrzetwarzanieDanych
                  ? styles.consentCheckFilled
                  : styles.consentCheck
              }
            >
              {form.zgodaPrzetwarzanieDanych && (
                <Text style={styles.checkMark}>X</Text>
              )}
            </View>
            <Text style={styles.consentLabel}>
              Consent for personal data processing (GDPR)
            </Text>
          </View>
          <View style={styles.consentRow}>
            <View
              style={
                form.zgodaMarketing
                  ? styles.consentCheckFilled
                  : styles.consentCheck
              }
            >
              {form.zgodaMarketing && <Text style={styles.checkMark}>X</Text>}
            </View>
            <Text style={styles.consentLabel}>
              Marketing consent (SMS/Email)
            </Text>
          </View>
          <View style={styles.consentRow}>
            <View
              style={
                form.zgodaFotografie
                  ? styles.consentCheckFilled
                  : styles.consentCheck
              }
            >
              {form.zgodaFotografie && <Text style={styles.checkMark}>X</Text>}
            </View>
            <Text style={styles.consentLabel}>
              Consent for likeness use
              {form.miejscaPublikacjiFotografii
                ? `: ${form.miejscaPublikacjiFotografii}`
                : ""}
            </Text>
          </View>
          <View style={styles.consentRow}>
            <View
              style={
                form.zgodaPomocPrawna
                  ? styles.consentCheckFilled
                  : styles.consentCheck
              }
            >
              {form.zgodaPomocPrawna && <Text style={styles.checkMark}>X</Text>}
            </View>
            <Text style={styles.consentLabel}>
              Informed consent for the procedure
            </Text>
          </View>
        </View>

        {/* Oświadczenia (Teksty Zgód) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Declaration Texts, Consents & Signatures
          </Text>

          <View style={[styles.consentBox, { marginBottom: 4 }]} wrap={false}>
            <Text
              style={[
                styles.consentText,
                { fontFamily: "Roboto", fontWeight: "bold" },
              ]}
            >
              Informed Consent for Treatment
            </Text>
            <Text style={styles.consentText}>
              By signing below, I confirm that I have provided full and true
              answers to the questions in the health questionnaire. I have read
              the information about the treatment, the risk of complications
              (including the possibility of typical and rare adverse reactions)
              and post-treatment recommendations. I make the decision to undergo
              the procedure fully consciously and voluntarily.
            </Text>
          </View>
          {form.podpisDane && (
            <View
              style={[
                styles.signatureSection,
                {
                  width: "50%",
                  alignSelf: "flex-end",
                  marginTop: 0,
                  marginBottom: 8,
                },
              ]}
              wrap={false}
            >
              <Text style={styles.signatureLabel}>
                Informed Consent (Required):
              </Text>
              <Image
                src={form.podpisDane}
                style={[styles.signatureImage, { height: 40, marginBottom: 2 }]}
              />
              <Text style={styles.signatureDate}>{form.miejscowoscData}</Text>
            </View>
          )}

          {form.zgodaMarketing && (
            <View wrap={false}>
              <View style={[styles.consentBox, { marginBottom: 4 }]}>
                <Text
                  style={[
                    styles.consentText,
                    { fontFamily: "Roboto", fontWeight: "bold" },
                  ]}
                >
                  Marketing Consent
                </Text>
                <Text style={styles.consentText}>
                  I consent to receive information about news, promotions and
                  special offers from
                  {rodoInfo.firmaNazwa} electronically (SMS / E-mail).
                </Text>
              </View>
              {form.podpisMarketing && (
                <View
                  style={[
                    styles.signatureSection,
                    {
                      width: "50%",
                      alignSelf: "flex-end",
                      marginTop: 0,
                      marginBottom: 8,
                    },
                  ]}
                  wrap={false}
                >
                  <Text style={styles.signatureLabel}>Marketing Consent:</Text>
                  <Image
                    src={form.podpisMarketing}
                    style={[
                      styles.signatureImage,
                      { height: 40, marginBottom: 2 },
                    ]}
                  />
                  <Text style={styles.signatureDate}>
                    {form.miejscowoscData}
                  </Text>
                </View>
              )}
            </View>
          )}

          {form.zgodaFotografie && (
            <View wrap={false}>
              <View style={[styles.consentBox, { marginBottom: 4 }]}>
                <Text
                  style={[
                    styles.consentText,
                    { fontFamily: "Roboto", fontWeight: "bold" },
                  ]}
                >
                  Consent for Likeness Use
                </Text>
                <Text style={styles.consentText}>
                  I give my free consent for the recording and dissemination of
                  my likeness (photo/video) for promotional purposes.
                </Text>
              </View>
              {form.podpisFotografie && (
                <View
                  style={[
                    styles.signatureSection,
                    {
                      width: "50%",
                      alignSelf: "flex-end",
                      marginTop: 0,
                      marginBottom: 8,
                    },
                  ]}
                  wrap={false}
                >
                  <Text style={styles.signatureLabel}>
                    Consent for Likeness Use:
                  </Text>
                  <Image
                    src={form.podpisFotografie}
                    style={[
                      styles.signatureImage,
                      { height: 40, marginBottom: 2 },
                    ]}
                  />
                  <Text style={styles.signatureDate}>
                    {form.miejscowoscData}
                  </Text>
                </View>
              )}
            </View>
          )}

          {form.zastrzeniaKlienta && (
            <View style={styles.consentBox} wrap={false}>
              <Text
                style={[
                  styles.consentText,
                  { fontFamily: "Roboto", fontWeight: "bold" },
                ]}
              >
                Client Reservations
              </Text>
              <Text style={styles.consentText}>{form.zastrzeniaKlienta}</Text>
            </View>
          )}
        </View>

        {/* Podsumowanie prawne */}
        <View
          style={[
            styles.consentBox,
            { marginTop: 0, marginBottom: 0, padding: 6 },
          ]}
        >
          <Text style={[styles.consentText, { fontSize: 6.5, color: GRAY }]}>
            This document constitutes a consent form and medical interview
            filled out electronically by the client. Signatures placed on this
            document are electronic signatures in accordance with Art. 78¹ of
            the Civil Code (documentary form). Identity verification: SMS
            verification to the number {form.telefon}.
            {form.signatureStatus === "VERIFIED" && form.signatureVerifiedAt
              ? ` Signature verified: ${formatDate(form.signatureVerifiedAt)}.`
              : ""}{" "}
            Data controller: {rodoInfo.firmaNazwa}, VAT/Tax ID: {rodoInfo.nip}.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {rodoInfo.firmaNazwa} • Consent Form No.{" "}
            {form.id.substring(0, 8).toUpperCase()}
          </Text>
          <Text
            style={styles.footerGold}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber}/${totalPages} • Document generated: ${today}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// ─── Główna funkcja eksportowana ───────────────────────────────────────────
export async function generateConsentFormPdf(
  form: ConsentFormData,
): Promise<Buffer> {
  const content = getFormContent(form.type);
  const pdfBuffer = await renderToBuffer(
    <ConsentFormPDF form={form} content={content} />,
  );
  return Buffer.from(pdfBuffer);
}
