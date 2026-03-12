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
import BackButton from "../BackButton";
import {
  ConsentFormData,
  ContraindicationWithFollowUp,
  rodoInfo,
  oczyszczanieTwarzyContraindications,
  oczyszczanieTwarzyCategoryBreaks,
  oczyszczanieTwarzyNaturalReactions,
  oczyszczanieTwarzyComplications,
  oczyszczanieTwarzyComplicationsVeryRare,
  oczyszczanieTwarzyPostCare,
} from "../../../types/booking";
import { SALON_CONFIG } from "@/app/config/salon";

interface FacialCleansingFormProps {
  onBack: () => void;
}

const initialFormData: ConsentFormData = {
  type: "FACIAL_CLEANSING",
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
  metodaZabiegu: "",
  przeciwwskazania: Object.entries(oczyszczanieTwarzyContraindications).reduce(
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
  wykazLekow: "", // INITIALIZE
  inneSchorzenia: "", // INITIALIZE
};

export default function FacialCleansingForm({
  onBack,
}: FacialCleansingFormProps) {
  const [formData, setFormData] = useState<ConsentFormData>(initialFormData);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentContraindicationIndex, setCurrentContraindicationIndex] =
    useState(0);
  const [showContraindicationsWizard, setShowContraindicationsWizard] =
    useState(true);

  // Form Steps: DATA -> RODO -> RODO2 -> TREATMENT -> MARKETING
  const [currentStep, setCurrentStep] = useState<
    "DATA" | "RODO" | "RODO2" | "TREATMENT" | "MARKETING"
  >("DATA");

  // Digital Signature State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSignatureVerified, setIsSignatureVerified] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditLogData | null>(null);

  const contraindicationKeys = Object.keys(oczyszczanieTwarzyContraindications);
  const currentContraindicationKey =
    contraindicationKeys[currentContraindicationIndex];

  const currentContraindicationValue = oczyszczanieTwarzyContraindications[
    currentContraindicationKey
  ] as string | ContraindicationWithFollowUp;
  const currentContraindicationObject:
    | ContraindicationWithFollowUp
    | undefined =
    typeof currentContraindicationValue === "string"
      ? undefined
      : currentContraindicationValue;
  const isWizardComplete =
    currentContraindicationIndex === contraindicationKeys.length;

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Auto-close wizard when all questions are answered
  useEffect(() => {
    if (isWizardComplete && showContraindicationsWizard) {
      setShowContraindicationsWizard(false);
    }
  }, [isWizardComplete, showContraindicationsWizard]);

  const handleWizardAnswer = (value: boolean) => {
    handleContraindicationChange(currentContraindicationKey, value);
    // Determine if the answer given requires a follow-up
    const hasFollowUp = currentContraindicationObject?.hasFollowUp;
    const isSafePositive = currentContraindicationObject?.isPositiveAnswerSafe;
    const requiresFollowUp =
      hasFollowUp && (isSafePositive ? value === false : value === true);

    if (requiresFollowUp) {
      return;
    }
    if (currentContraindicationIndex < contraindicationKeys.length) {
      setCurrentContraindicationIndex((prev) => prev + 1);
    }
  };

  const handleWizardNext = () => {
    if (currentContraindicationIndex < contraindicationKeys.length) {
      setCurrentContraindicationIndex((prev) => prev + 1);
    }
  };

  const resetWizard = () => {
    setCurrentContraindicationIndex(0);
    setShowContraindicationsWizard(true);
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

  const handleContraindicationChange = (
    key: string,
    value: boolean | string,
  ) => {
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
        alert(
          "An error occurred while saving the form. Please try again.",
        );
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
              Fill in again
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
                4. Treatment
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
            <h1 className="text-4xl md:text-6xl font-serif text-marble-text mb-3 tracking-tighter drop-shadow-lg">
              Facial <span className="text-brand">Cleansing</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brand"></div>
              <p className="text-brand text-xs md:text-base font-light tracking-[0.4em] uppercase">
                Cavitation peeling, iontophoresis, micromassage.
              </p>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brand"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* KROK 1: DANE I WYWIAD */}
          {currentStep === "DATA" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Dane osobowe */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
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
                      placeholder="First and Last Name"
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
                      E-mail Address
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
                        placeholder="123 Example Street"
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
                      placeholder="dd.mm.rrrr"
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
                        +48
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

              {/* Treatment Information */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    2
                  </span>
                  Treatment Information
                </h2>
                <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] text-ui-textSecondary leading-relaxed space-y-4">
                  <p>
                    The facial cleansing procedure is a professional cosmetic
                    treatment encompassing a range of cleansing, nourishing and
                    regenerative techniques. Depending on the chosen method, the
                    treatment may include: cavitation peeling, iontophoresis,
                    micromassage, oxygen infusion, LED light therapy and other
                    advanced cosmetic techniques.
                  </p>
                  <p>
                    Indications for the procedure include: blackheads, enlarged
                    pores, excessive sebum production, dull and tired skin,
                    uneven skin tone, dehydration, weakened hydrolipid barrier,
                    acne lesions and a general need for skin refreshment and
                    regeneration.
                  </p>
                  <p>
                    The procedure is performed using professional cosmetic
                    products individually selected for the skin&apos;s needs.
                    Prior to the procedure, a medical interview is conducted to
                    exclude contraindications and determine needs and
                    expectations.
                  </p>
                  <p>
                    The duration of the procedure depends on the chosen method
                    and skin condition, averaging 45 minutes to 1.5 hours. For
                    optimal results, regular treatments at intervals of 3–4
                    weeks are recommended.
                  </p>
                </div>
              </section>

              {/* Treatment Type */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    3
                  </span>
                  Treatment Type
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {[
                    {
                      value: "Facial cleansing",
                      label: "Facial cleansing",
                    },
                    {
                      value: "Hydrolipid barrier repair",
                      label: "Hydrolipid barrier repair",
                    },
                    {
                      value: "Combined acne therapy",
                      label: "Combined acne therapy",
                    },
                    { value: "Pro XN", label: "Pro XN" },
                    {
                      value: "LED light therapy",
                      label: "LED light therapy",
                    },
                    { value: "Skin analysis", label: "Skin analysis" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() =>
                        handleInputChange("metodaZabiegu", method.value)
                      }
                      className={`py-3 px-4 rounded-xl border-2 transition-all font-medium text-sm ${
                        formData.metodaZabiegu === method.value
                          ? "border-brand bg-brand text-white"
                          : "border-[#D4AF37] bg-ui-bg text-ui-textSecondary hover:border-brand hover:text-brand"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>

                {/* Description: Facial cleansing */}
                {formData.metodaZabiegu === "Facial cleansing" && (
                  <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] text-ui-textSecondary leading-relaxed space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="font-serif text-marble-text text-lg">
                      Facial Cleansing (cavitation, ultrasound, oxygen infusion)
                    </h3>
                    <p>
                      A comprehensive cleansing treatment combining several
                      advanced technologies. Cavitation peeling uses ultrasonic
                      waves to gently remove dead skin cells, blackheads and
                      impurities from pores. Ultrasound assists the absorption
                      of active substances into deeper skin layers, increasing
                      the effectiveness of the products used. Oxygen infusion
                      delivers concentrated oxygen along with active ingredients
                      directly to the skin.
                    </p>
                    <p className="font-medium text-marble-text">
                      Treatment effects:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>deep pore
                        cleansing and blackhead removal
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>smoothing and
                        evening out skin tone
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>skin hydration and
                        oxygenation
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>improved elasticity
                        and firmness
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>brightening and
                        refreshing the complexion
                      </li>
                    </ul>
                    <p className="text-sm italic">
                      The treatment is non-invasive and painless. Recommended for
                      all skin types, especially skin with blackheads, enlarged
                      pores, dull and tired skin.
                    </p>
                  </div>
                )}

                {/* Description: Hydrolipid barrier repair */}
                {formData.metodaZabiegu ===
                  "Hydrolipid barrier repair" && (
                  <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] text-ui-textSecondary leading-relaxed space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="font-serif text-marble-text text-lg">
                      Hydrolipid Barrier Repair
                    </h3>
                    <p>
                      A treatment dedicated to dehydrated, sensitive and
                      irritated skin whose protective barrier has been
                      compromised. The hydrolipid barrier is the skin&apos;s natural
                      protective layer that guards against water loss, external
                      factors and microorganisms. Its weakening leads to
                      dryness, redness and excessive skin reactivity.
                    </p>
                    <p>
                      During the treatment, products rich in ceramides, fatty
                      acids, cholesterol and moisturising ingredients are used to
                      rebuild and strengthen the skin&apos;s hydrolipid mantle.
                    </p>
                    <p className="font-medium text-marble-text">
                      Treatment effects:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>restoration of the
                        skin&apos;s natural protective barrier
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>deep hydration and
                        reduced feeling of tightness
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>reduction of
                        redness and irritation
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>strengthened skin
                        resistance to external factors
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>restored skin
                        comfort and smoothness
                      </li>
                    </ul>
                    <p className="text-sm italic">
                      Especially recommended after intensive exfoliating
                      treatments, during winter months and for skin exposed to
                      environmental factors.
                    </p>
                  </div>
                )}

                {/* Description: Combined acne therapy */}
                {formData.metodaZabiegu === "Combined acne therapy" && (
                  <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] text-ui-textSecondary leading-relaxed space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="font-serif text-marble-text text-lg">
                      Combined Acne Therapy
                    </h3>
                    <p>
                      A comprehensive therapy targeted at individuals struggling
                      with acne at various stages. The treatment combines
                      several cleansing, sebum regulation and anti-inflammatory
                      techniques, individually tailored to the skin&apos;s needs.
                    </p>
                    <p>
                      The treatment protocol may include: cavitation cleansing,
                      blackhead extraction, application of antibacterial and
                      sebum-regulating products, as well as anti-inflammatory
                      light therapy.
                    </p>
                    <p className="font-medium text-marble-text">
                      Treatment effects:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>reduction of active
                        acne lesions
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>cleansing and
                        tightening of pores
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>regulation of
                        excessive sebum production
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>reduced
                        inflammation and redness
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>improved overall
                        skin condition and appearance
                      </li>
                    </ul>
                    <p className="text-sm italic">
                      For optimal results, a series of treatments at intervals
                      of 2–3 weeks is recommended. Duration and intensity are
                      tailored individually.
                    </p>
                  </div>
                )}

                {/* Description: Pro XN */}
                {formData.metodaZabiegu === "Pro XN" && (
                  <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] text-ui-textSecondary leading-relaxed space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="font-serif text-marble-text text-lg">
                      Pro XN
                    </h3>
                    <p>
                      An advanced professional treatment utilising innovative
                      technology for intensive skin regeneration and
                      rejuvenation. Pro XN combines the action of active
                      ingredients with advanced methods of delivering them to
                      deeper skin layers.
                    </p>
                    <p>
                      The treatment stimulates the skin&apos;s natural repair
                      processes, supports collagen and elastin production and
                      improves microcirculation. The protocol is individually
                      tailored depending on the skin&apos;s needs and condition.
                    </p>
                    <p className="font-medium text-marble-text">
                      Treatment effects:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>intensive skin
                        regeneration and rejuvenation
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>improved firmness
                        and elasticity
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>smoothing of fine
                        lines and wrinkles
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>brightening and
                        evening out skin tone
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>deep nourishment
                        and hydration of the skin
                      </li>
                    </ul>
                    <p className="text-sm italic">
                      Designed for individuals seeking advanced anti-aging care
                      and intensive skin revitalisation.
                    </p>
                  </div>
                )}

                {/* Description: LED light therapy */}
                {formData.metodaZabiegu === "LED light therapy" && (
                  <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] text-ui-textSecondary leading-relaxed space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="font-serif text-marble-text text-lg">
                      LED Light Therapy
                    </h3>
                    <p>
                      A non-invasive therapy using LED light of various
                      wavelengths to stimulate skin cells. Each light colour
                      affects different processes: red light stimulates collagen
                      production and accelerates regeneration, blue light has
                      antibacterial properties and is effective against acne, and
                      yellow light supports microcirculation and reduces redness.
                    </p>
                    <p className="font-medium text-marble-text">
                      Treatment effects:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>stimulation of
                        collagen and elastin production
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>reduction of
                        inflammation and acne
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>accelerated skin
                        regeneration processes
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>improved skin tone
                        and brightened complexion
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>wrinkle reduction
                        and improved elasticity
                      </li>
                    </ul>
                    <p className="text-sm italic">
                      The treatment is completely painless and safe. It can be
                      used as a standalone therapy or as a complement to other
                      cosmetic treatments. Recommended series: 6–10 treatments
                      at intervals of 3–7 days.
                    </p>
                  </div>
                )}

                {/* Description: Skin analysis */}
                {formData.metodaZabiegu === "Skin analysis" && (
                  <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] text-ui-textSecondary leading-relaxed space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="font-serif text-marble-text text-lg">
                      Skin Analysis
                    </h3>
                    <p>
                      Professional skin analysis using specialised diagnostic
                      equipment. The examination allows for an accurate
                      assessment of the skin&apos;s condition, its needs and the
                      identification of problems invisible to the naked eye.
                    </p>
                    <p>
                      During the analysis, the following are assessed: hydration
                      level, elasticity, wrinkle depth, pore condition, sebum
                      level, discolouration, hydrolipid barrier condition and
                      skin sensitivity. Based on the results, the specialist
                      selects an individual home and salon care plan.
                    </p>
                    <p className="font-medium text-marble-text">
                      What you gain:
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>precise
                        determination of skin type and condition
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>identification of
                        hidden skin problems
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>individual salon
                        care plan
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>selection of
                        appropriate home care cosmetics
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-brand">•</span>ability to monitor
                        therapy effects over time
                      </li>
                    </ul>
                    <p className="text-sm italic">
                      Skin analysis is the ideal first step before starting any
                      skin therapy. It allows for informed selection of
                      treatments and cosmetics.
                    </p>
                  </div>
                )}
              </section>

              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
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
                    CONTRAINDICATIONS FOR THE PROCEDURE
                  </h3>
                  <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                    Please list all medications taken in the last 6 months
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-gradient-emerald border border-[#D4AF37] rounded-xl focus:border-brand outline-none text-sm text-marble-text placeholder-marble-textSecondary"
                    placeholder="Enter medications or type 'NONE'..."
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

                {showContraindicationsWizard && !isWizardComplete ? (
                  <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] max-w-2xl mx-auto shadow-sm">
                    {/* Category Header */}

                    <div className="flex justify-between items-center mb-8">
                      <span className="text-sm font-medium text-brand">
                        Question {currentContraindicationIndex + 1} of{" "}
                        {contraindicationKeys.length}
                      </span>
                      <div className="h-2 w-24 bg-black/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand transition-all duration-300"
                          style={{
                            width: `${
                              ((currentContraindicationIndex + 1) /
                                contraindicationKeys.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center gap-6 mb-8">
                      <div className="space-y-6 w-full max-w-2xl">
                        <h3 className="text-xl md:text-2xl font-serif text-marble-text leading-relaxed">
                          {typeof currentContraindicationValue === "string"
                            ? currentContraindicationValue
                            : currentContraindicationValue.text}
                        </h3>
                        {currentContraindicationObject?.hasFollowUp &&
                          formData.przeciwwskazania[
                            currentContraindicationKey
                          ] ===
                            (currentContraindicationObject.isPositiveAnswerSafe
                              ? false
                              : true) && (
                            <div className="animate-in fade-in slide-in-from-top-2 max-w-md mx-auto w-full text-left">
                              <input
                                type="text"
                                autoFocus
                                value={String(
                                  formData.przeciwwskazania[
                                    `${currentContraindicationKey}_details`
                                  ] || "",
                                )}
                                onChange={(e) =>
                                  handleContraindicationChange(
                                    `${currentContraindicationKey}_details`,
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                                placeholder={
                                  currentContraindicationObject.followUpPlaceholder ||
                                  "Please provide details..."
                                }
                              />
                            </div>
                          )}
                      </div>
                    </div>

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
                            : "bg-ui-bg border-[#D4AF37] text-ui-textSecondary active:border-green-500 active:bg-green-500 active:text-white md:hover:border-green-500 md:hover:bg-green-500 md:hover:text-white"
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
                            : "bg-ui-bg border-[#D4AF37] text-ui-textSecondary active:border-red-500 active:bg-red-500 active:text-white md:hover:border-red-500 md:hover:bg-red-500 md:hover:text-white"
                        }`}
                      >
                        YES
                      </button>
                    </div>

                    {currentContraindicationObject?.hasFollowUp &&
                      formData.przeciwwskazania[currentContraindicationKey] !==
                        null && (
                        <div className="max-w-md mx-auto mt-4">
                          <button
                            type="button"
                            onClick={handleWizardNext}
                            className="w-full py-4 px-6 rounded-xl bg-brand text-white transition-all text-lg font-medium shadow-sm hover:shadow-md hover:bg-brand-dark active:scale-95 flex items-center justify-center"
                          >
                            Next →
                          </button>
                        </div>
                      )}

                    <div className="mt-8 flex justify-between items-center border-t border-[#D4AF37]/50 pt-6">
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
                      <span className="text-xs text-marble-textSecondary uppercase tracking-wider font-medium">
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

                    {Object.entries(oczyszczanieTwarzyContraindications).map(
                      ([key, value], index) => {
                        const questionText =
                          typeof value === "string" ? value : value.text;
                        const hasFollowUp =
                          typeof value === "object" && value.hasFollowUp;
                        const followUpDetails =
                          formData.przeciwwskazania[`${key}_details`];

                        return (
                          <div key={key}>
                            <div
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
                                      → {followUpDetails as string}
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
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </section>

              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    6
                  </span>
                  Side Effects and Complications
                </h2>

                <div className="space-y-6">
                  {/* Common side effects */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE REACTIONS AFTER THE PROCEDURE — COMMON
                    </p>
                    <p className="text-sm text-ui-textSecondary mb-3">
                      I have been informed about the procedure and the
                      possibility of natural body reactions occurring after the
                      treatment:
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {oczyszczanieTwarzyNaturalReactions.map(
                        (reaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{reaction}</span>
                          </li>
                        ),
                      )}
                    </ul>
                    <p className="text-sm font-bold text-brand mt-4">
                      NOTE! Skin during menstruation may be more sensitive and
                      reactive, which may affect comfort during the procedure.
                    </p>
                  </div>

                  {/* Rare complications */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE COMPLICATIONS AFTER THE PROCEDURE — RARE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {oczyszczanieTwarzyComplications.map(
                        (complication, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{complication}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Very rare complications */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE COMPLICATIONS AFTER THE PROCEDURE — VERY RARE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {oczyszczanieTwarzyComplicationsVeryRare.map(
                        (complication, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{complication}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Empty div for layout balance if needed, or remove */}
                </div>
              </section>

              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    7
                  </span>
                  Post-Treatment Recommendations
                </h2>

                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37] mb-6">
                  <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                    <strong>POST-TREATMENT RECOMMENDATIONS</strong>
                    <br />
                    I hereby declare that I have been informed about the
                    necessity to follow the recommendations below after the
                    procedure:
                  </p>
                  <ul className="space-y-2 text-sm text-ui-textSecondary">
                    {oczyszczanieTwarzyPostCare.map((instruction, index) => (
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
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] overflow-hidden">
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
                      label="Client Signature (Consent for data processing)"
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
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] overflow-hidden">
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

          {/* KROK 4: ZABIEG */}
          {currentStep === "TREATMENT" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Side Effects and Complications */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    5
                  </span>
                  Side Effects and Complications
                </h2>
                <div className="space-y-6">
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I have been informed about the procedure and the possibility
                    of natural risks occurring:
                  </p>

                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE NATURAL REACTIONS AFTER THE PROCEDURE:
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {oczyszczanieTwarzyNaturalReactions.map(
                        (reaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{reaction}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE COMPLICATIONS AFTER THE PROCEDURE:
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {oczyszczanieTwarzyComplications.map(
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

              {/* Post-Treatment Recommendations */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    6
                  </span>
                  Post-Treatment Recommendations
                </h2>
                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                  <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                    <strong>
                      I commit to following the recommendations below:
                    </strong>
                  </p>
                  <ul className="space-y-2 text-sm text-ui-textSecondary">
                    {oczyszczanieTwarzyPostCare.map((instruction, index) => (
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

              {/* Salon Rules */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    7
                  </span>
                  Salon Rules
                </h2>
                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                  <p className="text-sm text-ui-textSecondary mb-4 font-medium uppercase tracking-wide">
                    I am aware of the following rules resulting from the salon
                    regulations:
                  </p>
                  <ol className="list-decimal pl-5 space-y-3 text-sm text-ui-textSecondary leading-relaxed">
                    <li>
                      Booking a procedure means full acceptance of the
                      regulations and the rules listed below.
                    </li>
                    <li>
                      When booking an appointment, it is worth making sure there
                      are no contraindications for the procedure.
                    </li>
                    <li>
                      If you have any doubts about the procedure, arrange a free
                      consultation by phone.
                    </li>
                    <li>
                      The Client has the right to cancel the appointment 24
                      hours before the scheduled date. Last-minute cancellation,
                      i.e. on the same day, results in being placed on our
                      &quot;Blacklist&quot;. We understand exceptional situations
                      and unforeseen circumstances (which should be confirmed
                      e.g. with a medical certificate).
                    </li>
                    <li>
                      The Client has the right to reschedule the appointment no
                      later than 24 hours before the scheduled visit.
                    </li>
                    <li>
                      The Specialist has the right to refuse performing the
                      procedure if health or skin contraindications are found
                      that prevent safely carrying out the treatment.
                    </li>
                    <li>
                      The Client is obliged to inform the Specialist about any
                      changes in health status, medications taken and allergies
                      before the procedure.
                    </li>
                    <li>
                      The Salon is not responsible for consequences resulting
                      from not following the post-treatment recommendations
                      provided by the Specialist.
                    </li>
                    <li>
                      We reserve the right to change individual points of the
                      regulations.
                    </li>
                    <li>
                      We reserve the right to change a previously scheduled
                      appointment date after agreeing with the Client on another
                      date convenient for both parties.
                    </li>
                  </ol>
                </div>
              </section>

              {/* Declarations */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    8
                  </span>
                  Declarations
                </h2>
                <div className="bg-ui-bg p-5 rounded-xl mb-6 border border-[#D4AF37]">
                  <h4 className="font-serif text-brand text-lg mb-4 uppercase tracking-wider">
                    DECLARATION AND INFORMED CONSENT FOR FACIAL CLEANSING
                    PROCEDURE
                  </h4>
                  <p className="text-sm text-ui-textSecondary mb-4 italic">
                    I, the undersigned, after a detailed interview and
                    consultation with the Specialist, declare that:
                  </p>

                  <div className="space-y-4 text-sm text-ui-textSecondary leading-relaxed">
                    <p>
                      <strong>Health status and responsibility:</strong> The
                      Specialist informed me about contraindications for the
                      procedure. I declare that none of them apply to me
                      (including pregnancy, epilepsy, cancer, active
                      tuberculosis, hyperthyroidism, metal implants in the
                      treatment area).
                    </p>
                    <p>
                      I have provided full and truthful information about my
                      health status. I am fully aware that concealing
                      information or providing false data will be treated as my
                      contribution to any potential harm. In case of concealing
                      contraindications, I take full responsibility for the
                      negative effects of the procedure and waive all claims
                      against the person performing the procedure.
                    </p>

                    <p>
                      <strong>Treatment information and hygiene:</strong> I have
                      received comprehensive information about the facial
                      cleansing procedure, the technique of its performance and
                      its purpose. I had the opportunity to ask questions and
                      received clear answers.
                    </p>
                    <p>
                      I confirm that the equipment and materials used for the
                      procedure are clean and disinfected. The highest hygiene
                      standards are maintained at the Salon.
                    </p>

                    <p>
                      <strong>Procedure and recovery:</strong> I have been
                      informed that after the procedure, natural symptoms may
                      include skin redness, slight irritation or a feeling of
                      tightness, which usually subside within a few hours to 2
                      days.
                    </p>
                    <p>
                      I know that I can return to daily activities after the
                      procedure, however I commit to limiting the use of makeup
                      and irritating cosmetics for 12 hours and using sun
                      protection.
                    </p>

                    <p>
                      <strong>Frequency and durability of effects:</strong> I
                      have been informed that the duration of the procedure
                      depends on the chosen method and skin condition (averaging
                      45 min – 1.5h).
                    </p>
                    <p>
                      For optimal results, regular treatments at intervals of
                      3–4 weeks are recommended.
                    </p>

                    <p>
                      <strong>
                        No guarantee and individual factors:
                      </strong>{" "}
                      I have been informed that the treatment effects depend on
                      many factors (age, biochemistry, skin type, lifestyle) and
                      it is not possible to fully guarantee identical results for
                      every client.
                    </p>
                    <p>
                      I declare that failure to achieve my expected subjective
                      result will not be grounds for claims, provided the
                      procedure was performed according to professional
                      standards.
                    </p>

                    <p>
                      <strong>Qualifications and decision:</strong> I declare
                      that I am aware that the Specialist performing the
                      procedure has the appropriate qualifications and training
                      in the cosmetic procedures performed.
                    </p>
                    <p>
                      I make the decision to undergo the procedure consciously,
                      voluntarily and at my own responsibility, accepting the
                      procedural risk.
                    </p>

                    <p className="font-bold border-t border-[#D4AF37]/50 pt-4 mt-4">
                      ACCEPTANCE OF REGULATIONS: I declare that I have read the
                      Salon Regulations available on the website and at
                      reception. I fully accept its provisions, including rules
                      regarding reservations, deposits, corrections and
                      complaints.
                    </p>

                    <p className="mt-4 font-medium text-brand">
                      * In the case of a minor, the signature of a parent or
                      legal guardian is required.
                    </p>
                  </div>
                </div>

                {/* Treatment Consent Signature */}
                <div className="bg-ui-bg backdrop-blur-sm rounded-2xl border border-[#D4AF37] p-6 md:p-8 mt-8">
                  <h2 className="text-xl font-serif text-marble-text mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-brand text-black rounded-full flex items-center justify-center text-xs font-sans font-bold">
                      9
                    </span>
                    Treatment Consent Confirmation
                  </h2>
                  <p className="text-sm text-ui-textSecondary mb-6 italic">
                    By signing below, I confirm that I have read the above
                    information, risks and recommendations and give informed
                    consent for the procedure.
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
                  Next (Additional consents) →
                </button>
              </div>
            </div>
          )}

          {/* KROK 4: MARKETING */}
          {currentStep === "MARKETING" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    7
                  </span>
                  Additional Consents
                </h2>
                <p className="text-sm text-ui-textSecondary mb-6">
                  The following consents are <strong>optional</strong>.
                </p>

                {/* Zgoda na marketing */}
                <div className="bg-ui-bg backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-[#D4AF37] hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h4 className="font-serif text-marble-text text-lg mb-3">
                      Marketing Consent
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-6">
                      I consent to receiving information about news, promotions
                      and special offers from{" "}
                      <strong>{rodoInfo.firmaNazwa}</strong> via electronic
                      means (SMS / E-mail).
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
                <div className="bg-ui-bg backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-[#D4AF37] hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h4 className="font-serif text-marble-text text-lg mb-3">
                      Consent for Use of Image
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                      I give free consent for recording and distributing my
                      image (photos/videos of treatment results) for promotional
                      purposes of {SALON_CONFIG.name} salon.
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

              <div className="flex justify-between pt-4 pb-12 items-center border-t border-[#D4AF37]/50 mt-8">
                <button
                  type="button"
                  onClick={() => setCurrentStep("TREATMENT")}
                  className="text-brand hover:text-brand-dark px-6 py-3 font-medium transition-colors"
                >
                  ← Back to treatment
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
                    "Confirm and Submit Form"
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
