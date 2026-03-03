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
  makijazPermanentnyNaturalReactions,
  makijazPermanentnyComplications,
  makijazPermanentnyPostCare,
  rodoInfo,
  makijazPermanentnyContraindications,
} from "../../../types/booking";
import { SALON_CONFIG } from "@/app/config/salon";
import AnatomyFaceSelector from "../AnatomyFaceSelector";
import { ZONES as PMU_ZONES } from "@/types/face-zone-pernament";

interface LipModelingFormProps {
  onBack: () => void;
}

const initialFormData: ConsentFormData = {
  type: "PERMANENT_MAKEUP",
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
  przeciwwskazania: Object.entries(makijazPermanentnyContraindications).reduce(
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

export default function LipModelingForm({ onBack }: LipModelingFormProps) {
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

  const contraindicationKeys = Object.keys(makijazPermanentnyContraindications);
  const currentContraindicationKey =
    contraindicationKeys[currentContraindicationIndex];
  const currentContraindicationValue = makijazPermanentnyContraindications[
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

  // Calculate age based on date of birth

  const isAgeValid = calculateAge(formData.dataUrodzenia) >= 16;

  const handleContraindicationChange = (key: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      przeciwwskazania: { ...prev.przeciwwskazania, [key]: value },
    }));
  };

  // Handler for verified signature
  // Handler for verified signature
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

  // Generate document content for hashing
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
      auditLog: auditLog, // Add audit log to data
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
            <h1 className="text-4xl md:text-6xl font-serif text-marble-text mb-3 tracking-tighter drop-shadow-lg">
              Permanent <span className="text-brand">Makeup</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brand"></div>
              <p className="text-brand text-xs md:text-base font-light tracking-[0.4em] uppercase">
                Permanent makeup procedure
              </p>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brand"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* KROK 1: DANE I WYWIAD */}
          {currentStep === "DATA" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    2
                  </span>
                  Procedure Information
                </h2>
                <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] text-ui-textSecondary leading-relaxed space-y-4">
                  <p>
                    Permanent makeup is an invasive procedure as it involves
                    breaking the continuity of the epidermis and therefore
                    carries some risk. The procedure involves introducing color
                    pigments into the skin using a needle.
                  </p>
                  <p>
                    The purpose of permanent makeup is to enhance eye framing,
                    correct the shape of the eyebrow arch, or define and balance
                    lip asymmetry as well as enhance their natural color. The
                    main goal is also to improve the aesthetic qualities and
                    well-being of the client.
                  </p>
                  <p>
                    The procedure is always performed after ruling out all
                    contraindications. The client's needs and expectations are
                    then discussed. The Specialist and the client together
                    select the appropriate pigment color, and then the
                    Specialist creates a preliminary drawing simulating the
                    effect of the permanent makeup. A condition for proceeding
                    with the permanent makeup procedure is acceptance of the
                    preliminary drawing.
                  </p>
                  <p>
                    The next stage is anesthesia, which minimizes discomfort
                    during the procedure. The pain threshold is experienced
                    individually and depends on the area of the face being
                    pigmented.
                  </p>
                  <p>
                    The choice of technique used in the procedure depends on the
                    predispositions and individual needs of the client.
                  </p>
                  <div className="bg-ui-bg p-4 rounded-xl border border-[#D4AF37]/50 space-y-4">
                    <div>
                      <p className="font-medium text-marble-text mb-1">
                        EYEBROWS
                      </p>
                      <p>
                        We do not perform permanent eyebrow makeup in black
                        because of the combination of cool tones, which over
                        time wash out into cool shades: graphite and blue. Brown
                        is a combination of black and orange, so eyebrows may
                        tint to a salmon color. Very cool browns tend to tint
                        gray due to the higher amount of black pigment. When a
                        client opts for an eyebrow correction in a reddish hue,
                        they must be aware that this dye may reappear after some
                        time following pigmentation.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-marble-text mb-1">LIPS</p>
                      <p>
                        For lip pigmentation, very light shades are not
                        recommended as after healing the shade becomes
                        unnoticeable. If a cold sore appears on the lips and the
                        pigment washes out, which is independent of the
                        practitioner, a 3rd touch-up may be needed, which is
                        free of charge.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-marble-text mb-1">
                        EYELINER
                      </p>
                      <p>
                        Permanent upper and lower eyeliner is usually applied in
                        black, which is a cool pigment — under the skin,
                        especially fair skin, it may tint to graphite or appear
                        to have specks of navy.
                      </p>
                    </div>
                  </div>

                  <p className="font-medium text-marble-text">
                    Additional information:
                  </p>
                  <ul className="list-disc pl-5 space-y-3">
                    <li>
                      Permanent makeup changes its intensity in the months
                      following the procedure, so after 1 year a paid touch-up
                      is recommended, the cost of which according to the price
                      list is 50% of the current permanent makeup price. A
                      touch-up after a minimum of 2 years from the last
                      permanent makeup procedure costs 100% of the current price
                      or in exceptional situations is priced individually. The
                      touch-up after approximately one year mainly applies to
                      permanent eyebrow makeup, as the pigment on other areas of
                      the face lasts longer — for example, lips after one year
                      are clearly tinted and do not require a touch-up.
                      Eyebrows, however, are in the T-zone, which results in
                      faster pigment fading.
                    </li>
                    <li>
                      A permanent makeup touch-up intended as a correction after
                      another salon is always priced individually and is usually
                      treated as a service performed from scratch, plus the cost
                      of laser/remover removal priced individually.
                    </li>
                    <li>
                      If a client who used permanent makeup services at our
                      salon has comments about the color/shape etc., within 2
                      months of the procedure they have the right to file a
                      complaint. If the complaint is resolved positively, the
                      defects will be corrected free of charge. Any suggestions
                      after 2 months from the procedure will be priced
                      individually.
                    </li>
                    <li>
                      If a client who had permanent eyebrow makeup at our Salon
                      discovers she is pregnant after the procedure and
                      postpones the touch-up until after giving birth, and
                      wishes to have the touch-up e.g. after approx. 1 year, the
                      procedure price is 50% of the current permanent makeup
                      price.
                    </li>
                  </ul>

                  <div className="bg-ui-bg p-4 rounded-xl border border-[#D4AF37]/50">
                    <p className="font-medium text-marble-text mb-2">
                      ALTERNATIVE WAYS TO ACHIEVE THE EFFECT
                    </p>
                    <p>
                      There are no alternative methods for permanent makeup
                      procedures due to their non-permanent effect. Procedures
                      that produce similar effects to permanent makeup — but are
                      not permanent — include: henna brows; classic makeup of
                      lips, brows, or eyelids.
                    </p>
                  </div>
                </div>
              </section>

              {/* Szczegóły Zabiegu */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    3
                  </span>
                  Procedure Details
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Anatomy (select treatment area)
                    </label>
                    <AnatomyFaceSelector
                      customZones={PMU_ZONES}
                      initialSelected={(formData.obszarZabiegu || "")
                        .split(", ")
                        .filter(Boolean)}
                      onSelect={(selectedIds) => {
                        handleInputChange(
                          "obszarZabiegu",
                          selectedIds.join(", "),
                        );
                      }}
                    />
                  </div>
                  {/* Obszar zabiegu */}
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      The procedure concerns permanent makeup of:
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {[
                        { id: "lips", label: "Lips" },
                        {
                          id: "eyebrows",
                          label: "Eyebrows",
                          ids: ["eyebrow_left", "eyebrow_right"],
                        },
                        {
                          id: "eyelids",
                          label: "Eyelids",
                          ids: ["eyelid_left", "eyelid_right"],
                        },
                      ].map((item) => {
                        const currentZones = (formData.obszarZabiegu || "")
                          .split(", ")
                          .filter(Boolean);
                        const isSelected = item.ids
                          ? item.ids.every((id) => currentZones.includes(id))
                          : currentZones.includes(item.id);

                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              let newZones = [...currentZones];
                              const targets = item.ids || [item.id];

                              if (isSelected) {
                                // Remove all targets
                                newZones = newZones.filter(
                                  (z) => !targets.includes(z),
                                );
                              } else {
                                // Add missing targets
                                targets.forEach((t) => {
                                  if (!newZones.includes(t)) newZones.push(t);
                                });
                              }

                              handleInputChange(
                                "obszarZabiegu",
                                newZones.join(", "),
                              );
                            }}
                            className={`py-3 px-4 rounded-xl border-2 transition-all font-medium text-sm ${
                              isSelected
                                ? "border-brand bg-brand text-black shadow-lg shadow-brand/20 scale-[1.02]"
                                : "border-[#D4AF37] bg-ui-bg text-ui-textSecondary hover:border-brand hover:text-brand"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Oczekiwany efekt */}
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      After the procedure I expect the effect to be:
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {["Intense / strong", "Medium", "Delicate / subtle"].map(
                        (effect) => (
                          <button
                            key={effect}
                            type="button"
                            onClick={() => {
                              const newValue =
                                formData.celEfektu === effect ? "" : effect;
                              handleInputChange("celEfektu", newValue);
                            }}
                            className={`py-3 px-4 rounded-xl border-2 transition-all font-medium text-sm ${
                              formData.celEfektu === effect
                                ? "border-brand bg-brand text-black shadow-lg shadow-brand/20 scale-[1.02]"
                                : "border-[#D4AF37] bg-ui-bg text-ui-textSecondary hover:border-brand hover:text-brand"
                            }`}
                          >
                            {effect}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Wywiad Medyczny */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    4
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
                  {showContraindicationsWizard && !isWizardComplete ? (
                    <div
                      key={currentContraindicationIndex}
                      className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] max-w-2xl mx-auto shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-medium text-brand">
                          Question {currentContraindicationIndex + 1} of{" "}
                          {contraindicationKeys.length}
                        </span>
                        <div className="h-2 w-24 bg-gradient-emerald rounded-full border border-brand/20 overflow-hidden">
                          <div
                            className="h-full bg-brand transition-all duration-300 shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                            style={{
                              width: `${Math.round(((currentContraindicationIndex + 1) / contraindicationKeys.length) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <h4 className="text-xl md:text-2xl font-serif text-marble-text mb-8 min-h-[5rem] flex items-center justify-center text-center">
                        {typeof currentContraindicationValue === "string"
                          ? currentContraindicationValue
                          : currentContraindicationValue.text}
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

                      {Object.entries(makijazPermanentnyContraindications).map(
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
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Skutki Uboczne i Powikłania */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    5
                  </span>
                  Information on Side Effects and Complications
                </h2>

                <div className="space-y-6">
                  {/* Częste skutki uboczne */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE SIDE EFFECTS AFTER THE PROCEDURE – COMMON
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {makijazPermanentnyNaturalReactions.map(
                        (reaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{reaction}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Rzadkie powikłania */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE COMPLICATIONS AFTER THE PROCEDURE – RARE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {makijazPermanentnyComplications.rzadkie.map(
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
                      {makijazPermanentnyComplications.bardzoRzadkie.map(
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

              {/* Zalecenia Pozabiegowe */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    6
                  </span>
                  Post-Procedure Instructions
                </h2>

                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50 mb-6">
                  <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                    <strong>
                      I hereby declare that I have been informed of the need to
                      follow these post-procedure instructions:
                    </strong>
                  </p>
                  <ul className="space-y-2 text-sm text-ui-textSecondary">
                    {makijazPermanentnyPostCare.map((instruction, index) => (
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

          {currentStep === "TREATMENT" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Świadomość Ryzyka */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <div className="p-0">
                  <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                    Risk Awareness
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I have been informed about the procedure and the possibility
                    of natural risks:
                  </p>

                  <div className="space-y-6">
                    <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50">
                      <p className="text-sm font-medium text-marble-text mb-3">
                        Possible natural reactions:
                      </p>
                      <ul className="space-y-2 text-sm text-ui-textSecondary">
                        {makijazPermanentnyNaturalReactions.map(
                          (reaction, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-brand">•</span>
                              {reaction}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50">
                      <p className="text-sm font-medium text-marble-text mb-3">
                        Possible complications:
                      </p>
                      <div className="space-y-3 text-sm text-ui-textSecondary">
                        <p>
                          <span className="font-medium">Common:</span>{" "}
                          {makijazPermanentnyComplications.czeste.join(", ")}
                        </p>
                        <p>
                          <span className="font-medium">Rare:</span>{" "}
                          {makijazPermanentnyComplications.rzadkie.join(", ")}
                        </p>
                        <p>
                          <span className="font-medium">Very rare:</span>{" "}
                          {makijazPermanentnyComplications.bardzoRzadkie.join(
                            ", ",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Zalecenia Pozabiegowe */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <div className="p-0">
                  <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                    Post-Procedure Commitments
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I commit to following these instructions:
                  </p>
                  <ul className="space-y-2 text-ui-textSecondary text-sm bg-ui-bg p-4 rounded-xl border border-[#D4AF37]/30">
                    {makijazPermanentnyPostCare.map((instruction, index) => (
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

              {/* Regulamin Salonu */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                  Salon Terms & Conditions
                </h3>
                <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37]/50">
                  <p className="text-sm text-ui-textSecondary mb-4 font-medium">
                    I am aware of the following rules arising from the Salon's
                    terms and conditions:
                  </p>
                  <ol className="list-decimal pl-5 space-y-3 text-sm text-ui-textSecondary leading-relaxed">
                    <li>
                      Booking a procedure appointment means full acceptance of
                      the terms and conditions and the rules listed below.
                    </li>
                    <li>
                      When booking a permanent makeup appointment, a deposit of
                      50% of the procedure value is required.
                    </li>
                    <li>
                      The client has 3 days from the time of booking to pay the
                      deposit. If not paid, the reservation is automatically
                      cancelled and the previously reserved slot becomes
                      available to other clients.
                    </li>
                    <li>
                      If the procedure takes place, its price is reduced by the
                      deposit amount.
                    </li>
                    <li>
                      The deposit can be paid by bank transfer. The account
                      number is available on the website, on-site, by phone, or
                      on FB:{" "}
                      <span className="font-medium text-marble-text">
                        ACCOUNT NUMBER 76249000050000460039252048
                      </span>{" "}
                      — in the transfer title, please include the procedure date
                      and the client's full name.
                    </li>
                    <li>
                      When booking an appointment it is worth making sure there
                      are no contraindications to the procedure.
                    </li>
                    <li>
                      Consultation regarding a permanent makeup procedure is
                      always free of charge. If you have any doubts about the
                      procedure, book a free consultation by phone.
                    </li>
                    <li>
                      The client may cancel an appointment up to 3 days before
                      the scheduled date. If the cancellation occurs less than 3
                      days before the scheduled procedure, the client must find
                      another person to take their slot. If no one is found for
                      the reserved appointment, the deposit is forfeited.
                    </li>
                    <li>
                      The client may reschedule their appointment no later than
                      24 hours before the planned visit. Last-minute
                      cancellation on the same day results in being placed on
                      our "Blacklist". We understand exceptional situations and
                      random events (these must be confirmed e.g. with a medical
                      certificate).
                    </li>
                    <li>
                      Clients who have ever had permanent makeup in a given area
                      (even barely visible) must inform the reception at the
                      time of booking, as the permanent makeup procedure may
                      need to be preceded by laser removal of traces of the old
                      pigment, which requires different timing and equipment.
                    </li>
                    <li>
                      During the permanent makeup procedure, a visualization is
                      performed and the appropriate permanent makeup method is
                      selected. The type of method and pigments are chosen by
                      the liner artist and matched to the client's natural
                      beauty.
                    </li>
                    <li>
                      The liner artist has the right to refuse to perform the
                      service if the client's shape expectations are
                      inconsistent with the classic eyebrow layout.
                    </li>
                    <li>
                      When deciding to have the procedure, one should
                      familiarize oneself with the works, style, and techniques
                      of the salon's liner artists.
                    </li>
                    <li>
                      If the client does not accept the proposed shape, method,
                      and pigment color and decides to cancel the procedure
                      during the appointment — the deposit is non-refundable.
                    </li>
                    <li>
                      If a client who used permanent makeup services at our
                      salon has comments regarding color/shape etc., they may
                      report them within 2 months of the procedure (and they
                      will be corrected free of charge); any suggestions after 2
                      months from the procedure will be priced individually.
                    </li>
                    <li>
                      If a client has a free touch-up scheduled within 50 days
                      of the permanent makeup procedure date and does not attend
                      / does not cancel 24 hours in advance, the touch-up is
                      considered completed and the next scheduled touch-up is
                      payable — the exact price is determined by the liner
                      artist during the visit. Each 1 month of delay incurs an
                      additional fee of 100 PLN.
                    </li>
                    <li>
                      If a client is from abroad and cannot attend the touch-up
                      within 50 days of the first procedure date, it is possible
                      to extend the contractual period to 3 months after the
                      first pigmentation. However, the fact of residing abroad
                      must be reported to the liner artist, who will note it in
                      the system — only on this basis is the touch-up period
                      extended. If the client does not come for the touch-up
                      within 3 months of the first visit, the touch-up after
                      that time is payable. The price is set by the liner artist
                      during the visit.
                    </li>
                    <li>
                      If a client who had permanent eyebrow makeup at our Salon
                      discovers she is pregnant after the procedure and
                      postpones the touch-up until after giving birth, and
                      wishes to have a touch-up e.g. after approx. one year, the
                      procedure price is 50% of the current permanent makeup
                      price.
                    </li>
                    <li>
                      Permanent makeup changes its intensity in the months
                      following the procedure, so after one year a paid touch-up
                      is recommended, the cost of which is 50% of the current
                      permanent makeup price. If additional pigmentation is
                      needed, its cost is 200 PLN. A touch-up after a minimum of
                      2 years from the last permanent makeup procedure costs
                      100% of the current price or in exceptional situations is
                      priced individually.
                    </li>
                    <li>
                      Touch-ups of permanent makeup after other salons are
                      always priced individually and usually treated as a
                      service performed from scratch, plus the cost of laser
                      removal priced individually.
                    </li>
                    <li>
                      We reserve the right to change individual points of the
                      terms and conditions.
                    </li>
                    <li>
                      We reserve the right to change a previously agreed
                      appointment time by arrangement with the client on another
                      date convenient for both parties.
                    </li>
                    <li>
                      The touch-up after approximately one year mainly applies
                      to permanent eyebrow makeup, as the pigment in other areas
                      lasts longer — for example, lips after one year are
                      clearly tinted and do not require a touch-up. Eyebrows,
                      however, are in the T-zone, which results in faster
                      pigment fading.
                    </li>
                  </ol>
                </div>
              </section>

              {/* Oświadczenia */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                  Declarations
                </h3>
                <div className="bg-ui-bg p-5 rounded-xl mb-6 border border-[#D4AF37]/50">
                  <h4 className="font-serif text-marble-text text-lg mb-4">
                    DECLARATION AND INFORMED CONSENT FOR PERMANENT MAKEUP
                    PROCEDURE
                  </h4>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I, the undersigned, after a detailed interview and
                    consultation with the Specialist, declare that:
                  </p>

                  <div className="space-y-4 text-sm text-ui-textSecondary leading-relaxed">
                    <p>
                      <strong>Health status and responsibility:</strong> I
                      declare that the Specialist has informed me about
                      contraindications to the procedure. I confirm that I have
                      none of the listed factors (e.g. pregnancy, infections,
                      unstabilized diabetes, skin conditions).
                    </p>
                    <p>
                      I provided full and truthful information about my health.
                      I am aware that concealing information or providing false
                      information will be treated as my contribution to any
                      potential damage. In the case of concealing
                      contraindications, I take full responsibility for any
                      negative effects of the procedure and waive all claims
                      against the person performing the procedure.
                    </p>
                    <p>
                      <strong>
                        Procedure information and design approval:
                      </strong>{" "}
                      I received comprehensive information regarding the makeup
                      technique, indications, and procedure course. I had the
                      opportunity to ask questions and received clear answers.
                    </p>
                    <p>
                      I declare that the preliminary design (shape and form) has
                      been fully refined by the Specialist and I fully accept
                      it. I understand that this is a key stage and that after
                      pigmentation has started, changing the shape may be
                      impossible.
                    </p>
                    <p>
                      <strong>Healing process and effects:</strong> I have been
                      informed that immediately after the procedure the pigment
                      is intense and darker, and swelling and redness are a
                      natural reaction that subsides within a few days.
                    </p>
                    <p>
                      I understand that the healing and stabilization of the
                      pigment in the skin takes approximately 4–6 weeks. I know
                      that the makeup will lighten during the peeling process
                      (by up to 50%), and the final color will be visible after
                      approximately{" "}
                      <input
                        type="text"
                        className="inline-block w-16 px-2 py-0.5 text-center bg-ui-bg border-b-2 border-[#D4AF37] focus:border-brand outline-none text-sm"
                        placeholder="..."
                        value={formData.numerZabiegu || ""}
                        onChange={(e) =>
                          handleInputChange("numerZabiegu", e.target.value)
                        }
                      />{" "}
                      weeks.
                    </p>
                    <p>
                      <strong>No guarantee and individual factors:</strong> I
                      have been informed that the durability and acceptance of
                      the pigment depends on many individual factors, such as:
                      body biochemistry, skin type (e.g. oily/porous skin
                      accepts pigment less effectively), age, hormones, and
                      skincare used.
                    </p>
                    <p>
                      I acknowledge that due to the above, no guarantee is given
                      for identical results for every client, nor for the
                      duration of the makeup. I understand that in some cases
                      (e.g. difficult skin) the pigment may shed more intensely
                      or unevenly, which is not a practitioner's error but an
                      individual characteristic of the organism.
                    </p>
                    <p>
                      <strong>Risk and hygiene:</strong> I am aware of the risk
                      of an allergic reaction to the anesthetic (e.g. lidocaine)
                      or the pigment. In the event of an allergy, I accept
                      responsibility for the consequences.
                    </p>
                    <p>
                      I declare that the materials used for the procedure
                      (needles/cartridges) are sterile, single-use, and were
                      opened in my presence.
                    </p>
                    <p>
                      <strong>Instructions and decision:</strong> I have
                      received post-procedure care instructions and commit to
                      following them. I understand that picking scabs,
                      sunbathing, or wetting the treated area may destroy the
                      effect, for which the Specialist is not responsible.
                    </p>
                    <p>
                      I make the decision to undergo the procedure consciously
                      and voluntarily. I declare that in the event the procedure
                      is performed in accordance with professional and ethical
                      standards, and the expected result is not achieved, I
                      waive all claims against the person performing the
                      procedure.
                    </p>

                    <p className="mt-4 font-medium text-brand">
                      * In the case of a minor, the signature of a parent or
                      legal guardian is required.
                    </p>
                  </div>
                </div>

                {/* Podpis pod Zabiegiem (Nowy, obowiązkowy) */}
                <div className="bg-ui-bg rounded-2xl border border-[#D4AF37] p-6 md:p-8 mt-8">
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
                  ← Back to RODO
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

          {/* KROK 5: MARKETING */}
          {currentStep === "MARKETING" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h3 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    7
                  </span>
                  Additional Consents
                </h3>
                <p className="text-sm text-ui-textSecondary mb-6">
                  The following consents are <strong>optional</strong>.
                </p>

                {/* Zgoda na marketing */}
                <div className="bg-ui-bg rounded-xl border border-[#D4AF37] overflow-hidden hover:shadow-lg transition-shadow">
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
                <div className="bg-ui-bg rounded-xl border border-[#D4AF37] overflow-hidden hover:shadow-lg transition-shadow">
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

              <div className="flex justify-between pt-4 pb-12 items-center border-t border-[#D4AF37]/50 mt-8">
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
