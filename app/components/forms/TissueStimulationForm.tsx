import { useState, useEffect } from "react";
import Image from "next/image";
import { Phone, Check, ArrowLeft, Instagram, Mail, Shield } from "lucide-react";
import {
  getTodayDate,
  formatBirthDate,
  calculateAge,
  validateBirthDate,
} from "@/lib/dateUtils";
import SignaturePad from "@/components/SignaturePad";
import SignatureVerificationModal from "@/components/SignatureVerificationModal";
import { AuditLogData } from "@/app/actions/otp";
import Footer from "@/app/components/Footer";
import AnatomyFaceSelector from "../AnatomyFaceSelector";
import { ZONES as TISSUE_ZONES } from "@/types/face-zones-tissue";
import BackButton from "../BackButton";
import { SALON_CONFIG } from "@/app/config/salon";
import {
  ConsentFormData,
  ContraindicationWithFollowUp,
  biostymulatoryContraindications,
  biostymulatorySideEffects,
  biostymulatoryComplications,
  biostymulatoryPreTreatment,
  biostymulatoryPostTreatment,
  wolumetriaTwarzyNaturalReactions,
  wolumetriaTwarzyComplications,
  wolumetriaTwarzyPostCare,
  rodoInfo,
} from "../../../types/booking";

const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  PROFHILO:
    '"Molecule of Youth" with the highest concentration of hyaluronic acid. Acts as a tissue stimulator for skin remodeling.',
  NUCLEOFIL:
    "Polynucleotide-based preparation. Provides deep hydration, antioxidant action, and stimulates collagen production.",
  "Nucleofill eyes":
    "Polynucleotide-based preparation dedicated to the delicate eye area. Improves skin tension, reduces dark circles and wrinkles.",
  "Xella Rederm":
    "Innovative preparation combining sodium succinate and hyaluronic acid. Reduces dark circles, puffiness, and discoloration under the eyes.",
  Tropocollagen:
    "Pure type-I collagen. Regenerates skin structure, accelerates healing, and restores tissue deficiencies.",
};

interface FacialVolumetryFormProps {
  onBack: () => void;
}

const initialFormData: ConsentFormData = {
  type: "TISSUE_STIMULATION",
  imieNazwisko: "",
  ulica: "",
  kodPocztowy: "",
  miasto: SALON_CONFIG.city,
  dataUrodzenia: "",
  telefon: "",
  miejscowoscData: `${SALON_CONFIG.city}, ${getTodayDate()}`,
  osobaPrzeprowadzajacaZabieg: "",
  nazwaProduktu: "",
  obszarZabiegu: "",
  celEfektu: "",
  numerZabiegu: "",
  przeciwwskazania: Object.entries(biostymulatoryContraindications).reduce(
    (acc, [key, value]) => {
      const hasFollowUp = typeof value === "object" && value.hasFollowUp;
      return {
        ...acc,
        [key]: null,
        ...(hasFollowUp ? { [`${key}_details`]: "" } : {}),
      };
    },
    {},
  ),
  zgodaPrzetwarzanieDanych: false,
  zgodaMarketing: false,
  zgodaFotografie: false,
  zgodaPomocPrawna: false,
  miejscaPublikacjiFotografii: "",
  podpisDane: "",
  podpisMarketing: "",
  podpisFotografie: "",
  podpisRodo: "",
  podpisRodo2: "",
  informacjaDodatkowa: "",
  zastrzeniaKlienta: "",
};

export default function FacialVolumetryForm({
  onBack,
}: FacialVolumetryFormProps) {
  const [formData, setFormData] = useState<ConsentFormData>(initialFormData);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentContraindicationIndex, setCurrentContraindicationIndex] =
    useState(0);
  const [showContraindicationsWizard, setShowContraindicationsWizard] =
    useState(true);
  const [isWizardComplete, setIsWizardComplete] = useState(false);

  // Form Steps: DATA -> SMS -> RODO -> TREATMENT -> MARKETING
  type Step = "DATA" | "RODO" | "RODO2" | "TREATMENT" | "MARKETING";
  const [currentStep, setCurrentStep] = useState<Step>("DATA");

  // Digital Signature State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSignatureVerified, setIsSignatureVerified] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditLogData | null>(null);

  const contraindicationKeys = Object.keys(biostymulatoryContraindications);
  const currentContraindicationKey =
    contraindicationKeys[currentContraindicationIndex];
  const currentContraindicationValue =
    biostymulatoryContraindications[currentContraindicationKey];
  const currentContraindicationObject:
    | ContraindicationWithFollowUp
    | undefined =
    typeof currentContraindicationValue === "string"
      ? undefined
      : currentContraindicationValue;

  // Calculate next potential question index (skipping completed wizard steps)
  const getNextIncompleteIndex = () => {
    // If wizard not started or just starting
    if (currentContraindicationIndex === -1) return 0;

    // Check from current index onwards
    for (
      let i = currentContraindicationIndex;
      i < contraindicationKeys.length;
      i++
    ) {
      const key = contraindicationKeys[i];
      // If this key hasn't been answered yet (is null or undefined)
      if (
        formData.przeciwwskazania[key] === undefined ||
        formData.przeciwwskazania[key] === null
      ) {
        return i;
      }
    }
    return -1; // All done
  };

  // Update wizard completion status
  // REMOVED: Auto-completion effect caused premature closing on last question follow-up
  // useEffect(() => {
  //   const isComplete = contraindicationKeys.every(
  //     (key) =>
  //       formData.przeciwwskazania[key] !== undefined &&
  //       formData.przeciwwskazania[key] !== null,
  //   );
  //   setIsWizardComplete(isComplete);
  // }, [formData.przeciwwskazania, contraindicationKeys]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const handleWizardAnswer = (value: boolean) => {
    handleContraindicationChange(currentContraindicationKey, value);

    // If answer is YES and has follow-up, stay on step to allow input
    const hasFollowUp =
      typeof currentContraindicationObject === "object" &&
      currentContraindicationObject?.hasFollowUp;

    if (value === true && hasFollowUp) {
      return;
    }

    if (currentContraindicationIndex < contraindicationKeys.length - 1) {
      setCurrentContraindicationIndex((prev) => prev + 1);
    } else {
      setIsWizardComplete(true);
    }
  };

  const handleNextStep = () => {
    if (currentContraindicationIndex < contraindicationKeys.length - 1) {
      setCurrentContraindicationIndex((prev) => prev + 1);
    } else {
      setIsWizardComplete(true);
    }
  };

  const resetWizard = () => {
    // Clear all contraindication answers
    setFormData((prev) => ({
      ...prev,
      przeciwwskazania: {},
    }));
    setCurrentContraindicationIndex(0);
    setShowContraindicationsWizard(true);
    setIsWizardComplete(false);
  };

  const handleInputChange = (
    field: keyof ConsentFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setFormData((prev) => ({ ...prev, telefon: formatted }));
  };

  // Oblicz wiek na podstawie daty urodzenia

  const isAgeValid = calculateAge(formData.dataUrodzenia) >= 16;

  const handleContraindicationChange = (key: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      przeciwwskazania: { ...prev.przeciwwskazania, [key]: value },
    }));
  };

  // Handler dla zweryfikowanego podpisu
  // Handler dla zweryfikowanego podpisu
  const handleSignatureVerified = (
    _signatureData: string,
    audit: AuditLogData,
  ) => {
    // _signatureData is technically "SMS_VERIFIED_NO_SIGNATURE" now
    setAuditLog(audit);
    setIsSignatureVerified(true);
    setShowSignatureModal(false);

    // Explicitly transition to next step
    setCurrentStep("RODO");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generuj zawartość dokumentu do hashowania
  const getDocumentContent = () => {
    return JSON.stringify({
      type: formData.type,
      imieNazwisko: formData.imieNazwisko,
      telefon: formData.telefon,
      dataUrodzenia: formData.dataUrodzenia,
      przeciwwskazania: formData.przeciwwskazania,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submissionData = {
      ...formData,
      email: email || null,
      auditLog: auditLog, // Dodaj audit log do danych
      signatureStatus: isSignatureVerified ? "SIGNED" : "PENDING",
    };

    try {
      const response = await fetch("/api/consent-forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitSuccess(true);
      } else {
        alert("An error occurred while saving the form. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while saving the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gradient-emerald backdrop-blur-sm rounded-3xl shadow-2xl border border-[#D4AF37] p-12 max-w-lg text-center">
          <div className="w-20 h-20 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-serif text-marble-text mb-4">
            Thank you!
          </h2>
          <p className="text-ui-textSecondary mb-8">
            Your form has been saved.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setFormData(initialFormData);
                setEmail("");
                setCurrentStep("DATA");
                resetWizard();
                setIsSignatureVerified(false);
                setAuditLog(null);
                window.scrollTo(0, 0);
              }}
              className="bg-brand text-white px-8 py-3 rounded-xl hover:bg-brand-dark transition-colors"
            >
              Fill out again
            </button>
            <BackButton
              onClick={onBack}
              label="Back to procedure selection"
              className="w-full justify-center"
            />
          </div>
        </div>
      </div>
    );
  }

  // Basic validation for Step 1
  const isStep1Valid =
    formData.imieNazwisko &&
    formData.telefon &&
    formData.telefon.replace(/\D/g, "").length === 9 &&
    formData.miejscowoscData &&
    formData.dataUrodzenia &&
    isAgeValid &&
    isWizardComplete;

  return (
    <div className="min-h-screen selection:bg-brand/30">
      {/* Header */}
      <header className="bg-ui-bgSecondary/80 backdrop-blur-md sticky top-0 z-50 border-b border-brand shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-serif text-marble-text tracking-wider uppercase">
              {SALON_CONFIG.name}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${SALON_CONFIG.phone.replace(/\s/g, "")}`}
              className="text-marble-textSecondary hover:text-brand transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
            <a
              href={SALON_CONFIG.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-marble-textSecondary hover:text-brand transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <BackButton onClick={onBack} className="self-start" />
            <div className="flex gap-2 text-xs md:text-sm font-medium text-marble-textSecondary overflow-x-auto pb-2 md:pb-0">
              <span
                className={
                  currentStep === "DATA"
                    ? "text-brand font-bold"
                    : "text-marble-textSecondary"
                }
              >
                1. Data
              </span>
              <span className="text-marble-textSecondary">→</span>
              <span
                className={
                  currentStep === "RODO"
                    ? "text-brand font-bold"
                    : "text-marble-textSecondary"
                }
              >
                2. GDPR
              </span>
              <span className="text-marble-textSecondary">→</span>
              <span
                className={
                  currentStep === "RODO2"
                    ? "text-brand font-bold"
                    : "text-marble-textSecondary"
                }
              >
                3. GDPR 2
              </span>
              <span className="text-marble-textSecondary">→</span>
              <span
                className={
                  currentStep === "TREATMENT"
                    ? "text-brand font-bold"
                    : "text-marble-textSecondary"
                }
              >
                4. Procedure
              </span>
              <span className="text-marble-textSecondary">→</span>
              <span
                className={
                  currentStep === "MARKETING"
                    ? "text-brand font-bold"
                    : "text-marble-textSecondary"
                }
              >
                5. Consents
              </span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-serif text-marble-text mb-3 tracking-tight">
              Tissue <span className="text-brand">Stimulation</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-brand"></div>
              <p className="text-brand text-sm md:text-lg font-light tracking-[0.3em] uppercase drop-shadow-sm">
                Biostymulatory
              </p>
              <div className="h-px w-12 bg-brand"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* KROK 1: DANE I WYWIAD */}
          {currentStep === "DATA" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Dane osobowe */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    1
                  </span>
                  Personal Data
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Full name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.imieNazwisko}
                      onChange={(e) =>
                        handleInputChange("imieNazwisko", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      City / Date *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.miejscowoscData}
                      onChange={(e) =>
                        handleInputChange("miejscowoscData", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                      placeholder={`${SALON_CONFIG.city}, 27.01.2026`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marble-textSecondary" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                        placeholder={SALON_CONFIG.email}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                        Street and number
                      </label>
                      <input
                        type="text"
                        value={formData.ulica}
                        onChange={(e) =>
                          handleInputChange("ulica", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                        placeholder="1/2 Example St."
                        autoComplete="street-address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                        Postal code
                      </label>
                      <input
                        type="text"
                        value={formData.kodPocztowy}
                        onChange={(e) =>
                          handleInputChange("kodPocztowy", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                        placeholder="38-400"
                        autoComplete="postal-code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.miasto}
                        onChange={(e) =>
                          handleInputChange("miasto", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                        placeholder={SALON_CONFIG.city}
                        autoComplete="address-level2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Date of birth * (min. 16 years)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.dataUrodzenia}
                      onChange={(e) =>
                        handleInputChange(
                          "dataUrodzenia",
                          formatBirthDate(e.target.value),
                        )
                      }
                      placeholder="dd.mm.yyyy"
                      maxLength={10}
                      className={`w-full px-4 py-3 bg-ui-bg border rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all ${
                        formData.dataUrodzenia && !isAgeValid
                          ? "border-red-500"
                          : "border-[#D4AF37]"
                      }`}
                    />
                    {validateBirthDate(formData.dataUrodzenia) !== null && (
                      <p className="text-red-400 text-xs mt-1">
                        {validateBirthDate(formData.dataUrodzenia)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Phone * (for SMS verification)
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-4 py-3 bg-gradient-emerald border border-r-0 border-[#D4AF37] rounded-l-xl text-[#D4AF37] font-medium select-none">
                        +353
                      </span>
                      <input
                        type="tel"
                        required
                        value={formData.telefon}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-r-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                        placeholder="123 456 789"
                        maxLength={11}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Informacja o Zabiegu */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    2
                  </span>
                  Procedure Information
                </h2>
                <div className="prose prose-sm max-w-none text-ui-textSecondary leading-relaxed space-y-4">
                  <p>
                    Tissue stimulators are used in anti-aging medicine to
                    rebuild the skin structure by stimulating skin cells:
                    collagen and elastin. They are typically preparations based
                    on non-cross-linked hyaluronic acid of various
                    concentrations and succinic acid, which has bioregenerative
                    properties. Hyaluronic acid, in turn, has filling and
                    moisturizing properties.
                  </p>
                  <p>
                    The tissue stimulator procedure is performed using products
                    such as:
                  </p>
                  <p>
                    Each time, the preparation to be used during the procedure
                    is selected by the Specialist according to the client’s
                    expectations and needs. The proposed procedure is invasive,
                    as it involves breaking the skin’s continuity, and therefore
                    carries some inherent risk.
                  </p>
                  <p>
                    The procedure involves injecting the above-mentioned
                    preparation using a needle or cannula into the treated
                    areas. The goal is to neutralize skin laxity, restore lost
                    facial contour, smooth wrinkles, slim facial features,
                    smooth and thicken the skin, and improve the client’s
                    aesthetic appearance and well-being. Indications for tissue
                    stimulator procedures include cheek modeling, filling the
                    marionette lines, correcting the jawline and the
                    subzygomatic area, as well as nose and chin shape
                    correction.
                  </p>
                  <p>
                    Furthermore, the procedure aims to restore skin firmness,
                    halt the signs of aging, reduce the first wrinkles, and
                    revitalize dry, dull skin.
                  </p>

                  <p>
                    The procedure is always performed after ruling out any
                    contraindications. The client’s needs and expectations are
                    discussed with the Specialist beforehand.
                  </p>

                  <p>
                    The next step is anesthesia, which minimizes discomfort
                    during the procedure. The pain threshold is felt
                    individually.
                  </p>

                  <p>
                    The use of anesthesia ensures that pain is minimized; in
                    most cases it is described as almost imperceptible. The
                    duration of the procedure depends on the application site
                    and individual skin characteristics, but it takes
                    approximately one hour on average.
                  </p>
                  <p>
                    The tissue stimulator procedure does not produce permanent
                    results; its effects last for approximately 6 months and
                    should be repeated after that time. The effect depends on
                    skin type, the amount of product injected, the injection
                    technique, and lifestyle. The Specialist informs the client
                    that the results are not identical for every client.
                  </p>
                </div>
              </section>

              {/* Sekcja 3: Wybór Preparatu */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    3
                  </span>
                  Product Selection
                </h2>
                <div className="space-y-8 mb-8 my-6">
                  {/* TWARZ */}
                  <div>
                    <h4 className="font-serif text-marble-text text-lg mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-brand rounded-full"></div>
                      Stimulators – FACE
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {["PROFHILO", "NUCLEOFIL"].map((name) => {
                        const currentName = formData.nazwaProduktu || "";
                        const baseName = currentName.split(" - ")[0];
                        const isSelected = baseName === name;

                        return (
                          <div
                            key={name}
                            onClick={() => {
                              if (!isSelected) {
                                handleInputChange("nazwaProduktu", name);
                                handleInputChange("iloscProduktu", ""); // Reset volume
                              }
                            }}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                              isSelected
                                ? "border-brand bg-brand/10 gold-glow"
                                : "border-[#D4AF37] bg-ui-bg hover:border-brand/60"
                            } shadow-xl shadow-brand/5`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span
                                className={`font-serif text-lg font-medium ${
                                  isSelected
                                    ? "text-marble-text"
                                    : "text-marble-text"
                                }`}
                              >
                                {name}
                              </span>
                              {isSelected && (
                                <div className="w-6 h-6 bg-brand rounded flex items-center justify-center">
                                  <Check className="w-4 h-4 text-black" />
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-ui-textSecondary mb-3 leading-relaxed">
                              {PRODUCT_DESCRIPTIONS[name]}
                            </p>

                            {/* Volume Selection */}
                            {isSelected && (
                              <div className="border-t border-[#D4AF37] pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <p className="text-xs font-medium text-brand mb-2 uppercase tracking-wide">
                                  Select volume (ml):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {["1.0", "2.0", "3.0", "4.0"].map((vol) => {
                                    const isSelectedVol =
                                      formData.iloscProduktu === vol;
                                    return (
                                      <button
                                        key={vol}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleInputChange(
                                            "iloscProduktu",
                                            vol,
                                          );
                                          handleInputChange(
                                            "nazwaProduktu",
                                            `${name} - ${vol}ml`,
                                          );
                                        }}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                          isSelectedVol
                                            ? "border-brand bg-brand text-white shadow-sm"
                                            : "border-[#D4AF37] bg-ui-bg text-ui-textSecondary hover:border-brand hover:text-brand"
                                        }`}
                                      >
                                        {vol} ml
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* OKOLICA OKA */}
                  <div>
                    <h4 className="font-serif text-marble-text text-lg mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-brand rounded-full"></div>
                      Stimulators – EYE AREA
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {["Nucleofill eyes", "Xella Rederm", "Tropocollagen"].map(
                        (name) => {
                          const currentName = formData.nazwaProduktu || "";
                          const baseName = currentName.split(" - ")[0];
                          const isSelected = baseName === name;

                          return (
                            <div
                              key={name}
                              onClick={() => {
                                if (!isSelected) {
                                  handleInputChange("nazwaProduktu", name);
                                  handleInputChange("iloscProduktu", ""); // Reset volume
                                }
                              }}
                              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-brand bg-brand/10 gold-glow"
                                  : "border-[#D4AF37] bg-ui-bg hover:border-brand/60"
                              } shadow-xl shadow-brand/5`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span
                                  className={`font-serif text-lg font-medium ${
                                    isSelected
                                      ? "text-marble-text"
                                      : "text-marble-text"
                                  }`}
                                >
                                  {name}
                                </span>
                                {isSelected && (
                                  <div className="w-6 h-6 bg-brand rounded flex items-center justify-center">
                                    <Check className="w-4 h-4 text-black" />
                                  </div>
                                )}
                              </div>

                              <p className="text-xs text-ui-textSecondary mb-3 leading-relaxed">
                                {PRODUCT_DESCRIPTIONS[name]}
                              </p>

                              {/* Volume Selection */}
                              {isSelected && (
                                <div className="border-t border-[#D4AF37] pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <p className="text-xs font-medium text-brand mb-2 uppercase tracking-wide">
                                    Select volume (ml):
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {["1.0", "2.0", "3.0", "4.0"].map((vol) => {
                                      const isSelectedVol =
                                        formData.iloscProduktu === vol;
                                      return (
                                        <button
                                          key={vol}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleInputChange(
                                              "iloscProduktu",
                                              vol,
                                            );
                                            handleInputChange(
                                              "nazwaProduktu",
                                              `${name} - ${vol}ml`,
                                            );
                                          }}
                                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                            isSelectedVol
                                              ? "border-brand bg-brand text-white shadow-sm"
                                              : "border-[#D4AF37] bg-ui-bg text-ui-textSecondary hover:border-brand hover:text-brand"
                                          }`}
                                        >
                                          {vol} ml
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Sekcja 4: Obszar Zabiegu */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    4
                  </span>
                  Treatment Area
                </h2>
                <div className="mb-8">
                  <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                    Treatment Area
                  </label>
                  <div className="bg-ui-bg p-4 rounded-xl border border-[#D4AF37]">
                    <p className="text-xs text-ui-textSecondary mb-4 text-center">
                      Mark the areas to be treated on the diagram.
                    </p>
                    <AnatomyFaceSelector
                      customZones={TISSUE_ZONES}
                      initialSelected={
                        formData.obszarZabiegu
                          ? formData.obszarZabiegu.split(", ").filter(Boolean)
                          : []
                      }
                      onSelect={(selectedIds) => {
                        handleInputChange(
                          "obszarZabiegu",
                          selectedIds.join(", "),
                        );
                      }}
                    />
                  </div>
                </div>
              </section>

              {/* Wywiad Medyczny Hyaluronic */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    5
                  </span>
                  Medical Interview
                </h2>
                <p className="text-sm text-ui-textSecondary mb-6">
                  Do you have any of the following contraindications?
                </p>

                {/* Medications Input */}
                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37] mb-6">
                  <h3 className="font-serif text-marble-text text-lg mb-2">
                    CONTRAINDICATIONS TO THE PROCEDURE
                  </h3>
                  <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                    Please list all medications taken in the last 6 months
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-gradient-emerald border border-[#D4AF37] rounded-xl focus:border-brand outline-none text-sm text-marble-text placeholder-marble-textSecondary"
                    placeholder="Enter medications or enter 'NONE'..."
                    value={
                      (formData.informacjaDodatkowa || "")
                        .split("\n")
                        .find((p) => p.startsWith("Leki (6 m-cy): "))
                        ?.replace("Leki (6 m-cy): ", "") || ""
                    }
                    onChange={(e) => {
                      const parts = (formData.informacjaDodatkowa || "").split(
                        "\n",
                      );
                      const prefix = "Leki (6 m-cy): ";
                      const newVal = `${prefix}${e.target.value}`;
                      const index = parts.findIndex((p) =>
                        p.startsWith(prefix),
                      );

                      if (index !== -1) {
                        if (e.target.value) {
                          parts[index] = newVal;
                        } else {
                          parts.splice(index, 1);
                        }
                      } else if (e.target.value) {
                        parts.push(newVal);
                      }

                      handleInputChange(
                        "informacjaDodatkowa",
                        parts.filter(Boolean).join("\n"),
                      );
                    }}
                  />
                </div>

                <div className="space-y-3">
                  {showContraindicationsWizard &&
                  !isWizardComplete &&
                  currentContraindicationIndex < contraindicationKeys.length ? (
                    <div
                      key={currentContraindicationIndex}
                      className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] max-w-2xl mx-auto shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-medium text-brand">
                          Question {currentContraindicationIndex + 1} of{" "}
                          {contraindicationKeys.length}
                        </span>
                        <div className="h-2 w-24 bg-ui-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand transition-all duration-300"
                            style={{
                              width: `${Math.round(((currentContraindicationIndex + 1) / contraindicationKeys.length) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <h4 className="text-xl md:text-2xl font-serif text-marble-text mb-8 min-h-[5rem] flex items-center justify-center text-center">
                        {typeof biostymulatoryContraindications[
                          currentContraindicationKey
                        ] === "string"
                          ? (biostymulatoryContraindications[
                              currentContraindicationKey
                            ] as string)
                          : (
                              biostymulatoryContraindications[
                                currentContraindicationKey
                              ] as ContraindicationWithFollowUp
                            ).text}
                      </h4>

                      {/* Show follow-up input if user answered TAK and question has follow-up */}
                      {formData.przeciwwskazania[currentContraindicationKey] ===
                        true &&
                        currentContraindicationObject?.hasFollowUp && (
                          <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                            <input
                              type="text"
                              className="w-full px-4 py-3 text-base bg-ui-bg border-2 border-[#D4AF37] rounded-xl focus:border-brand outline-none transition-colors"
                              placeholder={
                                currentContraindicationObject.followUpPlaceholder
                              }
                              value={String(
                                formData.przeciwwskazania[
                                  `${currentContraindicationKey}_details`
                                ] ?? "",
                              )}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  przeciwwskazania: {
                                    ...prev.przeciwwskazania,
                                    [`${currentContraindicationKey}_details`]:
                                      e.target.value,
                                  },
                                }));
                              }}
                            />
                          </div>
                        )}

                      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                        <button
                          type="button"
                          onClick={() => handleWizardAnswer(false)}
                          className={`py-4 px-6 rounded-xl border-2 transition-all text-lg font-medium shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center ${
                            currentContraindicationObject?.hasFollowUp &&
                            formData.przeciwwskazania[
                              currentContraindicationKey
                            ] === false
                              ? "border-green-500 bg-green-500 text-white"
                              : "bg-ui-bg border-[#D4AF37] text-ui-textSecondary active:border-green-500 active:bg-green-500 active:text-white md:hover:border-green-500 md:hover:bg-green-500 md:hover:text-brand"
                          }`}
                        >
                          NO
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWizardAnswer(true)}
                          className={`py-4 px-6 rounded-xl border-2 transition-all text-lg font-medium shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center ${
                            currentContraindicationObject?.hasFollowUp &&
                            formData.przeciwwskazania[
                              currentContraindicationKey
                            ] === true
                              ? "border-red-500 bg-red-500 text-white"
                              : "bg-ui-bg border-[#D4AF37] text-ui-textSecondary active:border-red-500 active:bg-red-500 active:text-white md:hover:border-red-500 md:hover:bg-red-500 md:hover:text-brand"
                          }`}
                        >
                          YES
                        </button>
                      </div>

                      {currentContraindicationObject?.hasFollowUp &&
                        formData.przeciwwskazania[
                          currentContraindicationKey
                        ] !== null && (
                          <div className="max-w-md mx-auto mt-4">
                            <button
                              type="button"
                              onClick={handleNextStep}
                              className="w-full py-4 px-6 rounded-xl bg-brand text-white transition-all text-lg font-medium shadow-sm hover:shadow-md hover:bg-brand-dark active:scale-95 flex items-center justify-center"
                            >
                              Next →
                            </button>
                          </div>
                        )}

                      <div className="mt-8 flex justify-between items-center border-t border-[#D4AF37] pt-6">
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentContraindicationIndex((prev) =>
                              Math.max(0, prev - 1),
                            )
                          }
                          disabled={currentContraindicationIndex === 0}
                          className="flex items-center gap-2 text-sm text-marble-textSecondary disabled:opacity-0 hover:text-brand transition-colors"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <span className="text-xs text-brand uppercase tracking-wider font-medium">
                          Step {currentContraindicationIndex + 1}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-300 rounded-xl mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="text-green-800 font-medium">
                            Medical interview completed
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={resetWizard}
                          className="text-sm text-green-700 hover:text-green-900 font-medium underline"
                        >
                          Edit answers
                        </button>
                      </div>

                      {Object.entries(biostymulatoryContraindications).map(
                        ([key, value], index) => {
                          const questionText =
                            typeof value === "string" ? value : value.text;
                          const hasFollowUp =
                            typeof value === "object" && value.hasFollowUp;
                          const followUpDetails =
                            formData.przeciwwskazania[`${key}_details`];

                          return (
                            <div
                              key={key}
                              className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                                formData.przeciwwskazania[key]
                                  ? "bg-red-900/20 border border-red-900/50"
                                  : "bg-green-900/10 border border-green-900/30"
                              }`}
                            >
                              <span className="text-brand font-medium min-w-[1.5rem] mt-0.5">
                                {index + 1}.
                              </span>
                              <div className="flex-1">
                                <p className="text-ui-textSecondary text-sm leading-relaxed">
                                  {questionText}
                                </p>
                                {hasFollowUp &&
                                  formData.przeciwwskazania[key] &&
                                  followUpDetails && (
                                    <p className="text-brand text-xs mt-2 italic">
                                      → {followUpDetails}
                                    </p>
                                  )}
                              </div>
                              <div className="ml-2">
                                {formData.przeciwwskazania[key] ? (
                                  <span className="inline-flex items-center px-3 py-1 bg-red-900/30 text-red-400 text-xs font-bold rounded-full border border-red-900/50 whitespace-nowrap">
                                    YES
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 bg-green-900/30 text-green-400 text-xs font-bold rounded-full border border-green-900/50 whitespace-nowrap">
                                    NO
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Skutki Uboczne i Powikłania */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    6
                  </span>
                  Information on Side Effects and Complications
                </h2>

                <div className="space-y-6">
                  {/* Częste skutki uboczne */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE SIDE EFFECTS AFTER THE PROCEDURE – COMMON
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {biostymulatorySideEffects.map((reaction, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-brand">∙</span>
                          <span>{reaction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rzadkie powikłania */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE COMPLICATIONS AFTER THE PROCEDURE – RARE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {biostymulatoryComplications.rzadkie.map(
                        (complication, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{complication}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Bardzo rzadkie powikłania */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE COMPLICATIONS AFTER THE PROCEDURE – VERY RARE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {biostymulatoryComplications.bardzoRzadkie.map(
                        (complication, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{complication}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Zalecenia Przedzabiegowe */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm mt-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    7
                  </span>
                  Pre-Procedure Instructions
                </h2>

                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37] mb-6">
                  <p className="text-sm font-medium text-marble-text mb-3">
                    PRE-PROCEDURE RECOMMENDATIONS:
                  </p>
                  <ul className="space-y-2 text-sm text-ui-textSecondary">
                    {biostymulatoryPreTreatment.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-brand">∙</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Zalecenia Pozabiegowe */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    8
                  </span>
                  Post-Procedure Instructions
                </h2>

                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37] mb-6">
                  <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                    <strong>
                      I hereby declare that I have been informed of the need to
                      follow these post-procedure instructions:
                    </strong>
                  </p>
                  <ul className="space-y-2 text-sm text-ui-textSecondary">
                    {biostymulatoryPostTreatment.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-brand">∙</span>
                        <span
                          className={
                            instruction.startsWith("UWAGA")
                              ? "font-bold text-brand"
                              : ""
                          }
                        >
                          {instruction}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <div className="flex justify-end pt-4 pb-12">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(true)}
                  disabled={!isStep1Valid}
                  className="bg-brand text-white py-4 px-8 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3"
                >
                  <Shield className="w-5 h-5" />
                  Verify Identity (SMS) and Continue
                </button>
              </div>
            </div>
          )}

          {/* KROK 2: RODO */}
          {currentStep === "RODO" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] overflow-hidden gold-glow-sm">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6">
                    {rodoInfo.consentTitle}
                  </h3>
                  <div className="bg-ui-bg p-6 rounded-xl text-sm text-ui-textSecondary leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto mb-6 border border-[#D4AF37]">
                    {rodoInfo.consentText}
                  </div>
                  {/* Signature Area for RODO */}
                  <div className="mt-8">
                    <SignaturePad
                      label="Client Signature (Consent to data processing)"
                      value={formData.podpisRodo || ""}
                      onChange={(sig) => {
                        handleInputChange("podpisRodo", sig);
                        // Auto-approve RODO consent when signed
                        if (sig && !formData.zgodaPrzetwarzanieDanych) {
                          handleInputChange("zgodaPrzetwarzanieDanych", true);
                        }
                      }}
                      date={formData.miejscowoscData}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-between pt-4 pb-12">
                <button
                  type="button"
                  onClick={() => setCurrentStep("DATA")}
                  className="text-brand hover:text-brand-dark px-6 py-3 font-medium transition-colors"
                >
                  ← Back to data
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("RODO2")}
                  disabled={!formData.podpisRodo}
                  className="bg-brand text-white py-3 px-8 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* KROK 3: RODO 2 */}
          {currentStep === "RODO2" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] overflow-hidden gold-glow-sm">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6">
                    {rodoInfo.clauseTitle}
                  </h3>
                  <div className="bg-ui-bg p-6 rounded-xl text-sm text-ui-textSecondary leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto mb-6 border border-[#D4AF37]">
                    {rodoInfo.clauseText}
                  </div>
                  {/* Signature Area for RODO 2 */}
                  <div className="mt-8">
                    <SignaturePad
                      label="Client Signature (Information clause)"
                      value={formData.podpisRodo2 || ""}
                      onChange={(sig) => {
                        handleInputChange("podpisRodo2", sig);
                      }}
                      date={formData.miejscowoscData}
                    />
                    <p className="text-xs text-marble-textSecondary mt-3 italic">
                      Signing is equivalent to acknowledging the above GDPR
                      information clause.
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex justify-between pt-4 pb-12">
                <button
                  type="button"
                  onClick={() => setCurrentStep("RODO")}
                  className="text-brand hover:text-brand-dark px-6 py-3 font-medium transition-colors"
                >
                  ← Back to GDPR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("TREATMENT")}
                  disabled={!formData.podpisRodo2}
                  className="bg-brand text-white py-3 px-8 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* KROK 3: ZABIEG */}
          {currentStep === "TREATMENT" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Ryzyko Hyaluronic */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] gold-glow-sm">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                    Risk Awareness
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I have been informed about the procedure and the possibility
                    of natural risks:
                  </p>

                  <div className="space-y-6">
                    <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                      <p className="text-sm font-medium text-marble-text mb-3">
                        Possible natural reactions:
                      </p>
                      <ul className="space-y-2 text-sm text-ui-textSecondary">
                        {biostymulatorySideEffects.map((reaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">•</span>
                            {reaction}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                      <p className="text-sm font-medium text-marble-text mb-3">
                        Possible complications:
                      </p>
                      <div className="space-y-3 text-sm text-ui-textSecondary">
                        <p>
                          <span className="font-medium">Rare:</span>{" "}
                          {biostymulatoryComplications.rzadkie.join(", ")}
                        </p>
                        <p>
                          <span className="font-medium">Very rare:</span>{" "}
                          {biostymulatoryComplications.bardzoRzadkie.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Zalecenia Hyaluronic */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] gold-glow-sm">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                    Post-Procedure Commitments
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I commit to following these instructions:
                  </p>
                  <ul className="space-y-2 text-ui-textSecondary text-sm bg-ui-bg p-4 rounded-xl border border-[#D4AF37]/30">
                    {biostymulatoryPostTreatment.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-brand">•</span>
                        <span
                          className={
                            instruction.startsWith("UWAGA")
                              ? "font-bold text-brand"
                              : ""
                          }
                        >
                          {instruction}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Oświadczenia */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                  Declarations
                </h3>
                <div className="bg-ui-bg p-5 rounded-xl mb-6 border border-[#D4AF37]">
                  <h4 className="font-serif text-marble-text text-lg mb-4">
                    CLIENT DECLARATIONS AND CONSENTS
                  </h4>
                  <div className="space-y-4 text-sm text-ui-textSecondary leading-relaxed">
                    <p>
                      <strong>Procedure information:</strong> I declare that I
                      received from the Specialist full and reliable information
                      about the indications for tissue stimulator procedures,
                      the technique, and the expected effects. I had the
                      opportunity to ask questions, to which I received
                      comprehensive answers.
                    </p>
                    <p>
                      <strong>Health status:</strong> I declare that I have
                      provided truthful and complete answers to questions about
                      my health. I understand that the accuracy of this
                      information is critical for the safety of the procedure.
                    </p>
                    <p>
                      <strong>Awareness of effects:</strong> I acknowledge that
                      the effects of the procedure are individual and depend on
                      body biochemistry, skin type, and lifestyle. I understand
                      that a specific result cannot be fully guaranteed, and
                      dissatisfaction arising from my subjective expectations
                      cannot be the basis for claims.
                    </p>
                    <p>
                      <strong>Risk and complications:</strong> I have been
                      informed about the possibility of adverse reactions such
                      as redness, swelling, bruising at the injection site, and
                      allergic reaction to the product or anesthetic. I
                      understand that the occurrence of these consequences,
                      provided the procedure was performed correctly, does not
                      entitle me to make compensation claims.
                    </p>
                    <p>
                      <strong>Post-procedure instructions:</strong> I commit to
                      strictly following the aftercare instructions provided by
                      the Specialist. I acknowledge that failure to follow the
                      instructions may result in infection, scarring, or other
                      complications.
                    </p>
                    <div className="bg-ui-bg-subtle p-4 rounded-lg border border-[#D4AF37]/30 my-4 space-y-4">
                      <p>
                        <strong>Treatment series:</strong> I have been informed
                        that for optimal results (usually lasting up to 6
                        months) the procedure should be performed in a series.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-ui-textSecondary mb-1">
                            Planned number of procedures in series:
                          </label>
                          <input
                            type="text"
                            value={formData.planowanaIloscZabiegow || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "planowanaIloscZabiegow",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 3-4"
                            className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-marble-text focus:ring-1 focus:ring-brand focus:border-brand outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ui-textSecondary mb-1">
                            Interval between 1st and 2nd procedure (days):
                          </label>
                          <input
                            type="text"
                            value={formData.odstepMiedzyZabiegami || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "odstepMiedzyZabiegami",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 14"
                            className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-marble-text focus:ring-1 focus:ring-brand focus:border-brand outline-none text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-ui-textSecondary mb-1">
                            Subsequent procedures at intervals (days):
                          </label>
                          <input
                            type="text"
                            value={formData.kolejneZabiegiOdstepy || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "kolejneZabiegiOdstepy",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 21"
                            className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-marble-text focus:ring-1 focus:ring-brand focus:border-brand outline-none text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <p>
                      <strong>Hygiene and Specialist status:</strong> I confirm
                      that the materials used for the procedure are single-use
                      and were opened in my presence. I am aware that the
                      Specialist performing the procedure has extensive
                      experience but is not a medical doctor of aesthetic
                      medicine.
                    </p>
                    <p>
                      <strong>Voluntariness:</strong> I declare that my decision
                      to undergo the procedure is conscious, voluntary, and
                      deliberate.
                    </p>
                    <p>
                      <strong>CONFIRMATION AND SIGNATURES:</strong> I have been
                      comprehensively informed about the risks and side effects.
                      I understand the content of this document and accept it in
                      full.
                    </p>
                  </div>
                </div>

                {/* Podpis pod Zabiegiem (Nowy, obowiązkowy) */}
                <div className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 mt-8 gold-glow-sm">
                  <h3 className="text-xl font-serif text-marble-text mb-4 border-b border-[#D4AF37] pb-2">
                    Consent Confirmation for Procedure
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-6">
                    By signing below I confirm that I have read the above
                    information, risks, and instructions and give my informed
                    consent to the procedure.
                  </p>
                  <SignaturePad
                    label="Client Signature (Required)"
                    value={formData.podpisDane}
                    onChange={(sig) => {
                      handleInputChange("podpisDane", sig);
                      // Możemy tu też ustawić flagę zgody, np. zgodaPomocPrawna (repurposed) lub po prostu polegać na podpisie
                      // Dla spójności z backendem, ustawmy zgodaPomocPrawna na true
                      handleInputChange("zgodaPomocPrawna", !!sig);
                    }}
                    date={formData.miejscowoscData}
                  />
                </div>
              </section>

              <div className="flex justify-between pt-4 pb-12">
                <button
                  type="button"
                  onClick={() => setCurrentStep("RODO")}
                  className="text-brand hover:text-brand-dark px-6 py-3 font-medium transition-colors"
                >
                  ← Back to GDPR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("MARKETING")}
                  disabled={!formData.podpisDane}
                  className="bg-brand text-white py-3 px-8 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next (Additional Consents) →
                </button>
              </div>
            </div>
          )}

          {/* KROK 4: MARKETING */}
          {currentStep === "MARKETING" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h3 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    8
                  </span>
                  Additional Consents
                </h3>
                <p className="text-sm text-ui-textSecondary mb-6">
                  The following consents are <strong>optional</strong>.
                </p>

                {/* Zgoda na marketing */}
                <div className="bg-ui-bg/60 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-brand/50 hover:shadow-md transition-shadow gold-glow-sm">
                  <div className="p-6">
                    <h4 className="font-serif text-marble-text text-lg mb-3">
                      Marketing Consent
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-6">
                      I consent to receiving information about news, promotions,
                      and special offers from{" "}
                      <strong>{rodoInfo.firmaNazwa}</strong> electronically (SMS
                      / Email).
                    </p>
                    <SignaturePad
                      label="Signature (I agree)"
                      value={formData.podpisMarketing}
                      onChange={(sig) => {
                        handleInputChange("podpisMarketing", sig);
                        handleInputChange("zgodaMarketing", !!sig);
                      }}
                      date={formData.miejscowoscData}
                    />
                  </div>
                </div>

                {/* Zgoda na wizerunek */}
                <div className="bg-ui-bg/60 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-brand/50 hover:shadow-md transition-shadow gold-glow-sm">
                  <div className="p-6">
                    <h4 className="font-serif text-marble-text text-lg mb-3">
                      Image Usage Consent
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                      I give my free consent for the recording and distribution
                      of my image (photos/video of procedure results) for
                      promotional purposes of the {SALON_CONFIG.name} salon.
                    </p>

                    <div className="mb-6">
                      <label className="block text-xs uppercase tracking-wider text-marble-textSecondary mb-2 font-medium">
                        Where can we publish? (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.miejscaPublikacjiFotografii}
                        onChange={(e) =>
                          handleInputChange(
                            "miejscaPublikacjiFotografii",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 bg-ui-bg border-b border-[#D4AF37] focus:border-brand outline-none text-sm transition-colors text-marble-text"
                        placeholder="e.g. Instagram, Facebook (leave empty = all)"
                      />
                    </div>

                    <SignaturePad
                      label="Signature (I agree)"
                      value={formData.podpisFotografie}
                      onChange={(sig) => {
                        handleInputChange("podpisFotografie", sig);
                        handleInputChange("zgodaFotografie", !!sig);
                      }}
                      date={formData.miejscowoscData}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-between pt-4 pb-12 items-center border-t border-[#D4AF37] mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentStep("TREATMENT")}
                  className="text-brand hover:text-brand-dark px-6 py-3 font-medium transition-colors"
                >
                  ← Back to procedure
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isSignatureVerified}
                  className="bg-brand text-white py-4 px-12 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </div>
                  ) : (
                    "Submit and Send Card"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      <Footer />

      {/* Modal weryfikacji podpisu */}
      <SignatureVerificationModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onVerified={handleSignatureVerified}
        phoneNumber={formData.telefon}
        documentContent={getDocumentContent()}
        clientName={formData.imieNazwisko || "Client"}
      />
    </div>
  );
}
