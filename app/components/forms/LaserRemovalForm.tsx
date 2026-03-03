import { useState, useEffect } from "react";
import Image from "next/image";
import AnatomyBodySelector from "../AnatomyBodySelector";
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
  depilacjaLaserowaNaturalReactions,
  depilacjaLaserowaComplications,
  depilacjaLaserowaPostCare,
  depilacjaLaserowaPreCare,
  rodoInfo,
} from "../../../types/booking";
import { depilacjaLaserowaContraindications } from "../../../types/booking";
import { SALON_CONFIG } from "@/app/config/salon";
import { BODY_ZONES } from "@/types/body-zones";

interface LaserRemovalFormProps {
  onBack: () => void;
}

const initialFormData: ConsentFormData = {
  type: "LASER_HAIR_REMOVAL",
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
  przeciwwskazania: Object.entries(depilacjaLaserowaContraindications).reduce(
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

export default function LaserRemovalForm({ onBack }: LaserRemovalFormProps) {
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

  const contraindicationKeys = Object.keys(depilacjaLaserowaContraindications);
  const currentContraindicationKey =
    contraindicationKeys[currentContraindicationIndex];
  const currentContraindicationValue = depilacjaLaserowaContraindications[
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

    // For follow-up questions, user must click "Kontynuuj"
    const hasFollowUp = currentContraindicationObject?.hasFollowUp;

    // If TAK (true) is selected on a follow-up question, stay to wait for details
    if (hasFollowUp && value === true) {
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
    value: string | boolean | null,
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

  const isAgeValid = calculateAge(formData.dataUrodzenia) >= 16;

  const handleContraindicationChange = (key: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      przeciwwskazania: { ...prev.przeciwwskazania, [key]: value },
    }));
  };

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
      auditLog: auditLog,
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
          <p className="text-ui-textSecondary mb-8">The form has been saved.</p>
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
              label="Back to treatment selection"
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
                1. Details
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
            <h1 className="text-4xl md:text-6xl font-serif text-marble-text mb-3 tracking-tight">
              Laser <span className="text-brand">Hair Removal</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-brand"></div>
              <p className="text-brand text-sm md:text-lg font-light tracking-[0.3em] uppercase drop-shadow-sm">
                Diode Laser
              </p>
              <div className="h-px w-12 bg-brand"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: DATA & INTERVIEW */}
          {currentStep === "DATA" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Personal Details */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    1
                  </span>
                  Personal Details
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
                      className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary shadow-sm shadow-black/20"
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
                      E-mail Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marble-textSecondary" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary shadow-sm shadow-black/20"
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
                        placeholder="123 Main St"
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
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-r-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary shadow-sm shadow-black/20"
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
                <div className="prose prose-sm max-w-none text-ui-textSecondary leading-relaxed space-y-4">
                  <p>
                    Laser hair removal using a diode laser is a cosmetological
                    procedure aimed at permanent hair reduction. The laser works
                    by selectively absorbing light energy by the melanin
                    contained in the hair, which is then converted into heat.
                    The resulting heat damages the hair follicle, inhibiting
                    further hair growth. The diode laser penetrates deeper into
                    the skin than other types of lasers, making it effective on
                    darker and deeper-rooted hairs, with minimal impact on the
                    surrounding skin.
                  </p>
                  <p>
                    The procedure is most effective on hairs in the growth
                    phase, known as the anagen phase. For this reason, achieving
                    optimal results requires a series of treatments at intervals
                    of several weeks to cover all hairs in different phases of
                    the growth cycle. The duration of a single session depends
                    on the size of the treated area and can range from several
                    minutes to about an hour.
                  </p>
                  <p>
                    The effects of laser hair removal may vary depending on the
                    type of hair, skin phototype, hormonal balance, and
                    individual body predispositions. The procedure usually leads
                    to a significant reduction in hair after several sessions,
                    but does not guarantee complete and permanent hair removal.
                  </p>
                  <p>
                    After the procedure, the skin may react with redness,
                    swelling, burning, or itching, and in some cases, scabs,
                    blisters, or temporary discoloration may appear. These
                    reactions are individual and may occur even with proper
                    procedure execution and adherence to care instructions.
                  </p>
                </div>
              </section>

              {/* Treatment Details */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    3
                  </span>
                  Treatment Details
                </h2>
                <div className="space-y-6">
                  <div>
                    <div>
                      <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                        Treatment Area
                      </label>
                      <AnatomyBodySelector
                        initialSelected={
                          formData.obszarZabiegu
                            ? formData.obszarZabiegu
                                .split(", ")
                                .map(
                                  (name) =>
                                    BODY_ZONES.find((z) => z.name === name)?.id,
                                )
                                .filter((id): id is string => !!id)
                            : []
                        }
                        onSelect={(ids: string[]) => {
                          const names = ids
                            .map(
                              (id) => BODY_ZONES.find((z) => z.id === id)?.name,
                            )
                            .filter(Boolean)
                            .join(", ");
                          handleInputChange("obszarZabiegu", names);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Medical Interview - Laser Removal */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    4
                  </span>
                  Medical History
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

                {/* Medications Input */}
                <div className="space-y-3">
                  {showContraindicationsWizard && !isWizardComplete ? (
                    <div
                      key={currentContraindicationIndex}
                      className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37] max-w-2xl mx-auto shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-sm font-medium text-brand uppercase tracking-widest">
                          Question {currentContraindicationIndex + 1} of{" "}
                          {contraindicationKeys.length}
                        </span>
                        <div className="h-2 w-24 bg-ui-bgSecondary rounded-full overflow-hidden border border-[#D4AF37]/30">
                          <div
                            className="h-full bg-brand transition-all duration-500 shadow-[0_0_10px_rgba(212,175,55,0.5)]"
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

                      <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-md mx-auto">
                        <button
                          type="button"
                          onClick={() => handleWizardAnswer(false)}
                          className={`py-4 px-6 rounded-xl border-2 transition-all text-lg font-medium shadow-sm hover:shadow-brand/20 active:scale-95 flex items-center justify-center ${
                            formData.przeciwwskazania[
                              currentContraindicationKey
                            ] === false
                              ? "border-green-500 bg-green-500 text-white shadow-lg shadow-green-500/20"
                              : "bg-ui-bg border-[#D4AF37] text-ui-textSecondary hover:border-green-500 hover:text-green-500"
                          }`}
                        >
                          NIE
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWizardAnswer(true)}
                          className={`py-4 px-6 rounded-xl border-2 transition-all text-lg font-medium shadow-sm hover:shadow-brand/20 active:scale-95 flex items-center justify-center ${
                            formData.przeciwwskazania[
                              currentContraindicationKey
                            ] === true
                              ? "border-red-500 bg-red-500 text-white shadow-lg shadow-red-500/20"
                              : "bg-ui-bg border-[#D4AF37] text-ui-textSecondary hover:border-red-500 hover:text-red-500"
                          }`}
                        >
                          TAK
                        </button>
                      </div>

                      {currentContraindicationObject?.hasFollowUp &&
                        formData.przeciwwskazania[
                          currentContraindicationKey
                        ] === true && (
                          <div className="max-w-md mx-auto mt-6 animate-in fade-in zoom-in-95 duration-300">
                            <button
                              type="button"
                              onClick={handleWizardNext}
                              className="w-full py-4 px-6 rounded-xl bg-brand text-black transition-all text-lg font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                            >
                              Continue <Check className="w-5 h-5" />
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
                      <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6 shadow-lg shadow-green-500/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="text-green-800 font-medium">
                            Medical interview complete
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={resetWizard}
                          className="text-sm text-green-400/80 hover:text-green-400 font-medium underline transition-colors"
                        >
                          Edit answers
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Display medication list in summary */}
                        {(formData.informacjaDodatkowa || "").includes(
                          "Leki (6 m-cy): ",
                        ) && (
                          <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 mb-4">
                            <p className="text-xs text-brand uppercase tracking-wider font-bold mb-1">
                              Medications taken (6 months):
                            </p>
                            <p className="text-marble-text text-sm">
                              {(formData.informacjaDodatkowa || "")
                                .split("\n")
                                .find((p) => p.startsWith("Leki (6 m-cy): "))
                                ?.replace("Leki (6 m-cy): ", "")}
                            </p>
                          </div>
                        )}

                        {Object.entries(depilacjaLaserowaContraindications).map(
                          ([key, value], index) => {
                            const questionText =
                              typeof value === "string" ? value : value.text;
                            const hasFollowUp =
                              typeof value === "object" && value.hasFollowUp;
                            const followUpDetails =
                              formData.przeciwwskazania[`${key}_details`];
                            const isYes = formData.przeciwwskazania[key];

                            return (
                              <div
                                key={key}
                                className={`flex items-start gap-4 p-4 rounded-xl transition-all border ${
                                  isYes
                                    ? "bg-red-500/5 border-red-500/20"
                                    : "bg-green-500/5 border-green-500/15"
                                }`}
                              >
                                <span
                                  className={`font-serif font-bold min-w-[1.5rem] mt-0.5 ${isYes ? "text-red-400" : "text-brand/60"}`}
                                >
                                  {index + 1}.
                                </span>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start gap-4">
                                    <p className="text-ui-textSecondary text-sm leading-relaxed">
                                      {questionText}
                                    </p>
                                    <span
                                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                        isYes
                                          ? "bg-red-500/10 border-red-500/20 text-red-400"
                                          : "bg-green-500/10 border-green-500/20 text-green-400"
                                      }`}
                                    >
                                      {isYes ? "TAK" : "NIE"}
                                    </span>
                                  </div>
                                  {hasFollowUp && isYes && followUpDetails && (
                                    <div className="mt-3 pl-4 border-l-2 border-brand/20">
                                      <p className="text-xs text-brand/80 font-medium uppercase tracking-wider mb-1">
                                        Details:
                                      </p>
                                      <p className="text-sm text-marble-text font-medium">
                                        {followUpDetails}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Side Effects and Complications */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    5
                  </span>
                  Side Effects and Complications
                </h2>

                <div className="space-y-6">
                  {/* Common side effects */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE SIDE EFFECTS AFTER THE PROCEDURE — COMMON
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {depilacjaLaserowaNaturalReactions.map(
                        (reaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{reaction}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* POSSIBLE SKIN REACTIONS */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50 mt-6">
                    <p className="text-sm font-medium text-marble-text mb-3 uppercase tracking-wide">
                      POSSIBLE SKIN REACTIONS
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary mb-4">
                      {depilacjaLaserowaNaturalReactions.map(
                        (reaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{reaction}</span>
                          </li>
                        ),
                      )}
                    </ul>
                    <p className="text-sm text-brand italic">
                      These reactions are individual and may occur despite
                      proper procedure execution.
                    </p>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    6
                  </span>
                  Pre and Post Treatment Instructions
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-serif text-marble-text mb-4 flex items-center gap-2">
                      Before Treatment
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {depilacjaLaserowaPreCare.map((instruction, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 bg-ui-bg/50 p-3 rounded-lg border border-[#D4AF37]/30"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0" />
                          <span className="text-ui-textSecondary text-xs leading-relaxed">
                            {instruction}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-ui-bg/40 p-5 rounded-xl border border-[#D4AF37]/50">
                    <h3 className="text-lg font-serif text-marble-text mb-4">
                      After Treatment
                    </h3>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {depilacjaLaserowaPostCare.map((instruction, index) => (
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

          {/* STEP 2: GDPR */}
          {currentStep === "RODO" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-ui-bg/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6">
                    {rodoInfo.consentTitle}
                  </h3>
                  <div className="bg-ui-bg p-6 rounded-xl text-sm text-ui-textSecondary leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto mb-6 border border-[#D4AF37]">
                    {rodoInfo.consentText}
                  </div>
                  <div className="mt-8">
                    <SignaturePad
                      label="Client Signature (Data processing consent)"
                      value={formData.podpisRodo || ""}
                      onChange={(sig) => {
                        handleInputChange("podpisRodo", sig);
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
                  ← Back to details
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

          {/* STEP 3: GDPR 2 */}
          {currentStep === "RODO2" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-ui-bg/60 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6">
                    {rodoInfo.clauseTitle}
                  </h3>
                  <div className="bg-ui-bg p-6 rounded-xl text-sm text-ui-textSecondary leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto mb-6 border border-[#D4AF37]">
                    {rodoInfo.clauseText}
                  </div>
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
                      By signing, you confirm that you have read the above GDPR
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

          {/* STEP 4: TREATMENT */}
          {currentStep === "TREATMENT" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Risk Awareness */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 shadow-lg">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    7
                  </span>
                  Risk Awareness
                </h2>
                <p className="text-sm text-ui-textSecondary mb-6 italic">
                  I have been informed about the procedure and the possibility
                  of naturally occurring risks:
                </p>

                <div className="space-y-6">
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/30 shadow-sm shadow-black/20">
                    <p className="text-sm font-medium text-brand mb-3 uppercase tracking-wider">
                      Possible natural reactions:
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {depilacjaLaserowaNaturalReactions.map(
                        (reaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">•</span>
                            {reaction}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/30 shadow-sm shadow-black/20">
                    <p className="text-sm font-medium text-brand mb-3 uppercase tracking-wider">
                      Possible complications:
                    </p>
                    <div className="space-y-3 text-sm text-ui-textSecondary">
                      <p>
                        <span className="font-bold text-marble-text">
                          Common:
                        </span>{" "}
                        {depilacjaLaserowaComplications.czeste.join(", ")}
                      </p>
                      <p>
                        <span className="font-bold text-marble-text">
                          Rare:
                        </span>{" "}
                        {depilacjaLaserowaComplications.rzadkie.join(", ")}
                      </p>
                      <p>
                        <span className="font-bold text-marble-text">
                          Very rare:
                        </span>{" "}
                        {depilacjaLaserowaComplications.bardzoRzadkie.join(
                          ", ",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] overflow-hidden">
                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                      8
                    </span>
                    Post-Procedure Obligations
                  </h2>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I commit to following the post-procedure instructions:
                  </p>
                  <ul className="space-y-2 text-ui-textSecondary text-sm bg-ui-bg/50 p-4 rounded-xl border border-[#D4AF37]/30">
                    {depilacjaLaserowaPostCare.map((instruction, index) => (
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

              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    9
                  </span>
                  Declarations
                </h2>
                <div className="bg-ui-bg p-5 rounded-xl mb-6 border border-[#D4AF37]/50">
                  <h4 className="font-serif text-marble-text text-lg mb-4">
                    DECLARATION AND INFORMED CONSENT FOR LASER HAIR REMOVAL
                    PROCEDURE
                  </h4>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I, the undersigned, declare that:
                  </p>

                  <div className="space-y-4 text-sm text-ui-textSecondary leading-relaxed">
                    <p>
                      <strong>Health status:</strong> All information provided
                      by me in the health questionnaire and during the interview
                      is true, complete, and consistent with my current health
                      condition. I have not withheld any information about
                      diseases, allergies, sun/solarium exposure, or medications
                      and supplements taken (especially photosensitizing ones).
                      I am aware that withholding information may affect the
                      safety and effectiveness of the procedure and increase the
                      risk of complications.
                    </p>
                    <p>
                      <strong>Procedure information:</strong> I have received
                      comprehensive information about the diode laser hair
                      removal procedure, its course, indications, and
                      recommendations for skin care before and after the
                      procedure. I had the opportunity to ask questions and
                      received understandable answers.
                    </p>
                    <p>
                      <strong>Effects and no guarantee:</strong> I have been
                      informed that the effectiveness of the procedure depends
                      on individual body characteristics (including hormonal
                      balance, hair color and thickness, hair growth phase). I
                      understand that the procedure should be performed in a
                      series (usually every 4-8 weeks) and I acknowledge that it
                      is not possible to guarantee 100% removal of all hair
                      within a specified time. I declare that the lack of an
                      expected aesthetic result will not be grounds for claims.
                    </p>
                    <p>
                      <strong>Side effects and responsibility:</strong> I am
                      aware that after the procedure, temporary adverse
                      reactions may occur, such as: redness, swelling, burning,
                      or minor scabs. I accept this risk.
                    </p>
                    <p>
                      <strong>Decision:</strong> I make the decision to undergo
                      the procedure fully consciously and voluntarily. I declare
                      that in the case of the procedure being performed in
                      accordance with professional standards and ethics, I will
                      not make any financial or legal claims against the person
                      performing the procedure in connection with the occurrence
                      of typical post-procedure reactions or incomplete hair
                      removal.
                    </p>
                    <p className="mt-4 font-medium text-brand">
                      * In the case of a minor, the signature of a parent or
                      legal guardian is required.
                    </p>
                  </div>
                </div>
                <div className="bg-ui-bg/60 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8 mt-8">
                  <h3 className="text-xl font-serif text-marble-text mb-4 border-b border-[#D4AF37] pb-2">
                    Treatment Consent Confirmation
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-6">
                    By signing below, I confirm that I have read the above
                    information, risks, and recommendations, and I give my
                    informed consent to undergo the procedure.
                  </p>
                  <SignaturePad
                    label="Client Signature (Required)"
                    value={formData.podpisDane}
                    onChange={(sig) => {
                      handleInputChange("podpisDane", sig);
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

          {/* STEP 5: MARKETING */}
          {currentStep === "MARKETING" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    10
                  </span>
                  Additional Consents
                </h2>
                <p className="text-sm text-ui-textSecondary mb-6">
                  The following consents are <strong>optional</strong>.
                </p>

                {/* Marketing consent */}
                <div className="bg-ui-bg/60 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-[#D4AF37] hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h4 className="font-serif text-marble-text text-lg mb-3">
                      Marketing Consent
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-6">
                      I consent to receiving information about news, promotions,
                      and special offers from{" "}
                      <strong>{rodoInfo.firmaNazwa}</strong> electronically (SMS
                      / E-mail).
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

                {/* Image consent */}
                <div className="bg-ui-bg/60 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-[#D4AF37] hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h4 className="font-serif text-marble-text text-lg mb-3">
                      Consent to Use of Image
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                      I grant free consent for the recording and distribution of
                      my image (photos/video of treatment results) for
                      promotional purposes of {SALON_CONFIG.name}.
                    </p>

                    <div className="mb-6">
                      <label className="block text-xs uppercase tracking-wider text-marble-textSecondary mb-2 font-medium">
                        Where may we publish? (optional)
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
                        placeholder="e.g. Instagram, Facebook (leave blank = all)"
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
                    "Submit and Send Form"
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      <Footer />

      {/* Signature verification modal */}
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
