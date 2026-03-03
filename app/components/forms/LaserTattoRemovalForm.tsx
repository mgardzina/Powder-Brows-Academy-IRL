import { useState, useEffect } from "react";
import Image from "next/image";
import AnatomyBodySelector from "../AnatomyBodySelector";
import AnatomyFaceSelector from "../AnatomyFaceSelector";
import { BODY_ZONES } from "@/types/body-zones";
import { ZONES as FACE_ZONES } from "@/types/face-zones";
import {
  Phone,
  Check,
  ArrowLeft,
  ArrowRight,
  Instagram,
  Mail,
  Shield,
} from "lucide-react";
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
  laseroweUsuwanieContraindications,
  laseroweUsuwanieNaturalReactions,
  laseroweUsuwanieComplications,
  laseroweUsuwaniePostCare,
  laseroweUsuwaniePreCare,
  rodoInfo,
} from "@/types/booking";
import { SALON_CONFIG } from "@/app/config/salon";

interface LaserTattoRemovalFormProps {
  onBack: () => void;
}

const initialFormData: ConsentFormData = {
  type: "LASER_TATTOO_REMOVAL",
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
  przeciwwskazania: Object.entries(laseroweUsuwanieContraindications).reduce(
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

export default function LaserTattoRemovalForm({
  onBack,
}: LaserTattoRemovalFormProps) {
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

  const contraindicationKeys = Object.keys(laseroweUsuwanieContraindications);
  const currentContraindicationKey =
    contraindicationKeys[currentContraindicationIndex];
  const currentContraindicationValue = laseroweUsuwanieContraindications[
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

  // Handler for advancing after filling in follow-up details
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
              Laser <span className="text-brand">Removal</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-brand"></div>
              <p className="text-brand text-sm md:text-lg font-light tracking-[0.3em] uppercase drop-shadow-sm">
                Laser removal treatment
              </p>
              <div className="h-px w-12 bg-brand"></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: DETAILS & INTERVIEW */}
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
                      Email address
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
                      Date of birth * (min. 16 years old)
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
                    The laser removal treatment for permanent makeup or tattoos
                    involves destroying the pigment with an appropriate beam of
                    light and breaking it down into smaller particles. These are
                    then absorbed by special cells in the human body — so-called
                    macrophages — which cleanse the body of various harmful
                    substances.
                  </p>
                  <p>
                    The indication for the procedure is the desire to remove
                    permanent makeup or a tattoo, and to improve psychological
                    well-being and self-acceptance.
                  </p>
                  <p>
                    After ruling out contraindications, the Specialist performs
                    a laser patch test to check the client's reaction to the
                    light beam. If no adverse reactions occur, the actual
                    treatment can begin.
                  </p>
                  <p>
                    The Picosecond Laser — Oshun Technology method used in the
                    treatment works rapidly, measured in nanoseconds, and
                    delivers the appropriate laser wavelength deep into the
                    skin. The beam absorbed by the makeup or tattoo pigment
                    breaks the pigment down into fine fragments, small enough to
                    be completely removed from the skin over the next few weeks
                    after the procedure. Some particles located very
                    superficially in the skin will be removed along with the
                    surface shedding of the epidermis. The second part of the
                    dispersed pigments in deeper skin layers will be absorbed by
                    the body and drained to the lymph nodes. The macrophage
                    breakdown of pigment molecules lasts up to several weeks,
                    which is why performing the next session shortly after the
                    last one is not recommended. Changes are visible after the
                    first treatment — not always immediately, but within 3–4
                    weeks.
                  </p>
                  <p>
                    During laser operation, "shots" can be heard when the laser
                    hits the pigment. This is a safe procedure. The amount of
                    heat generated is small, so the treatment carries no risk of
                    thermal damage to surrounding tissue. During laser sessions
                    — depending on the type of pigment — under the influence of
                    the laser beam, the pigment may change its shade to salmon,
                    orange, or grey. When removing pigment from the lip line,
                    the pigment may become darker. This is temporary due to the
                    pigment's reaction to the laser beam.
                  </p>
                  <p>
                    The treatment is performed in multiple sessions, through
                    which the pigment is gradually lightened. For tattoos, 3–10
                    sessions are required for amateur tattoos and 6 sessions for
                    professional tattoos.
                  </p>
                  <p>
                    For permanent makeup removal, 2–4 sessions are required.
                    There must be a break of at least 4 weeks between sessions.
                    This is the necessary time for the broken pigment to be
                    absorbed and for the skin to regenerate. With each repeated
                    session, the makeup or tattoo fades more until it disappears
                    completely. The treatment may last from a few minutes to
                    approximately 1 hour, depending on the surface area from
                    which the pigment is to be removed. The treatment is not
                    comfortable, and individual sensations will depend on each
                    client's pain tolerance. There are no contraindications to
                    using anaesthesia, but its use may cause it to block the
                    laser beam from reaching the deeper layers of the skin,
                    which may make the treatment less effective.
                  </p>
                  <p>The number of sessions depends on:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>pigment colour</li>
                    <li>size and density of pigment contained in the skin</li>
                    <li>type of pigment</li>
                    <li>depth of the pigment</li>
                    <li>
                      skin tone (the less tanned the skin, the safer, more
                      effective and less prone to discolouration the treatment
                      will be)
                    </li>
                    <li>individual immunological response to the laser</li>
                  </ul>
                  <p>
                    It is impossible to determine in advance the exact number of
                    sessions required. The next session can only be performed
                    after a minimum 4-week break.
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
                <div className="bg-ui-bg p-4 rounded-xl border border-[#D4AF37]/50 space-y-6">
                  {/* Treatment Type */}
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Treatment concerns *
                    </label>
                    <div className="flex flex-col gap-3">
                      {[
                        {
                          value: "Permanent Makeup",
                          desc: "Removal of pigment from eyebrows, lips, eyeliner, etc.",
                        },
                        {
                          value: "Tattoo",
                          desc: "Removal of artistic tattoos from various body areas.",
                        },
                      ].map((option) => {
                        const isSelected =
                          formData.nazwaProduktu === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              handleInputChange("nazwaProduktu", option.value)
                            }
                            className={`text-left p-4 rounded-xl border-2 transition-all ${
                              isSelected
                                ? "border-brand bg-brand/10 gold-glow"
                                : "border-[#D4AF37] bg-ui-bg hover:border-brand"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span
                                className={`font-serif text-lg font-medium ${
                                  isSelected
                                    ? "text-marble-text"
                                    : "text-marble-text"
                                }`}
                              >
                                {option.value}
                              </span>
                              {isSelected && (
                                <div className="w-6 h-6 bg-brand rounded flex items-center justify-center">
                                  <Check className="w-4 h-4 text-black" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-ui-textSecondary leading-relaxed">
                              {option.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm text-ui-textSecondary mb-4 font-medium">
                      Select treatment area (Interactive Model)
                    </label>

                    {formData.nazwaProduktu === "Tattoo" ? (
                      <AnatomyBodySelector
                        initialSelected={
                          formData.obszarZabiegu
                            ? formData.obszarZabiegu
                                .split(", ")
                                .map(
                                  (name) =>
                                    BODY_ZONES.find((z) => z.name === name)
                                      ?.id || "",
                                )
                                .filter(Boolean)
                            : []
                        }
                        onSelect={(ids) => {
                          const names = ids
                            .map(
                              (id) => BODY_ZONES.find((z) => z.id === id)?.name,
                            )
                            .filter(Boolean)
                            .join(", ");
                          handleInputChange("obszarZabiegu", names);
                        }}
                      />
                    ) : (
                      <AnatomyFaceSelector
                        initialSelected={
                          formData.obszarZabiegu
                            ? formData.obszarZabiegu
                                .split(", ")
                                .map(
                                  (name) =>
                                    FACE_ZONES.find((z) => z.name === name)
                                      ?.id || "",
                                )
                                .filter(Boolean)
                            : []
                        }
                        onSelect={(ids) => {
                          const names = ids
                            .map(
                              (id) => FACE_ZONES.find((z) => z.id === id)?.name,
                            )
                            .filter(Boolean)
                            .join(", ");
                          handleInputChange("obszarZabiegu", names);
                        }}
                      />
                    )}
                  </div>
                  {/* Other - text input */}
                  <div className="mt-3">
                    <input
                      type="text"
                      value={
                        (formData.obszarZabiegu || "")
                          .split(", ")
                          .find((p) => p.startsWith("Other: "))
                          ?.replace("Other: ", "") || ""
                      }
                      onChange={(e) => {
                        const currentParts = (formData.obszarZabiegu || "")
                          .split(", ")
                          .filter((p) => !p.startsWith("Other: "));
                        if (e.target.value) {
                          currentParts.push(`Other: ${e.target.value}`);
                        }
                        handleInputChange(
                          "obszarZabiegu",
                          currentParts.filter(Boolean).join(", "),
                        );
                      }}
                      className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                      placeholder="Other (enter manually)..."
                    />
                  </div>
                </div>
              </section>

              {/* Medical Interview */}
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
                    CONTRAINDICATIONS TO THE TREATMENT
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
                        .find((p) => p.startsWith("Medications (6 mo): "))
                        ?.replace("Medications (6 mo): ", "") || ""
                    }
                    onChange={(e) => {
                      const parts = (formData.informacjaDodatkowa || "").split(
                        "\n",
                      );
                      const prefix = "Medications (6 mo): ";
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

                {/* Contraindications Wizard */}
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

                      {/* Show follow-up input if user answered YES and question has follow-up */}
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
                              ? "border-green-600 bg-green-600 text-marble-text"
                              : "bg-ui-bg border-[#D4AF37] text-ui-textSecondary hover:border-green-600 hover:bg-green-600 hover:text-brand"
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
                              : "bg-ui-bg border-[#D4AF37] text-ui-textSecondary hover:border-red-500 hover:bg-red-500 hover:text-brand"
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
                      <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6 shadow-lg shadow-green-500/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="text-green-800 font-medium">
                            Medical interview completed
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
                        {/* Display medications list in summary */}
                        {(formData.informacjaDodatkowa || "").includes(
                          "Medications (6 mo): ",
                        ) && (
                          <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 mb-4">
                            <p className="text-xs text-brand uppercase tracking-wider font-bold mb-1">
                              Medications taken (6 mo):
                            </p>
                            <p className="text-marble-text text-sm">
                              {(formData.informacjaDodatkowa || "")
                                .split("\n")
                                .find((p) =>
                                  p.startsWith("Medications (6 mo): "),
                                )
                                ?.replace("Medications (6 mo): ", "")}
                            </p>
                          </div>
                        )}

                        {Object.entries(laseroweUsuwanieContraindications).map(
                          ([key, val], index) => {
                            const value = val as
                              | string
                              | ContraindicationWithFollowUp;
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
                                      {isYes ? "YES" : "NO"}
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
                  Information on Side Effects and Complications
                </h2>

                <div className="space-y-6">
                  {/* Common side effects */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE SIDE EFFECTS AFTER THE TREATMENT — COMMON
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {laseroweUsuwanieNaturalReactions.map(
                        (reaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{reaction}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* Rare complications */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE COMPLICATIONS AFTER THE TREATMENT — RARE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {laseroweUsuwanieComplications.rzadkie.map(
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
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      POSSIBLE COMPLICATIONS AFTER THE TREATMENT — VERY RARE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {laseroweUsuwanieComplications.bardzoRzadkie.map(
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

              {/* Post-Treatment Instructions */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    6
                  </span>
                  Post-Treatment Instructions
                </h2>

                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/50 mb-6">
                  <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                    <strong>
                      I hereby declare that I have been informed of the
                      obligation to follow these post-treatment instructions:
                    </strong>
                  </p>
                  <ul className="space-y-2 text-sm text-ui-textSecondary">
                    {laseroweUsuwaniePostCare.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-brand">∙</span>
                        <span
                          className={
                            instruction.startsWith("WARNING")
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
                  className="bg-brand text-black py-4 px-8 rounded-xl text-lg font-bold shadow-lg hover:bg-brand-dark hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3"
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
              {/* Card 1: CONSENT */}
              <section className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6">
                    {rodoInfo.consentTitle}
                  </h3>
                  <div className="bg-ui-bg p-6 rounded-xl text-sm text-ui-textSecondary leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto mb-6 border border-[#D4AF37]">
                    {rodoInfo.consentText}
                  </div>
                  <div className="mt-8">
                    <p className="text-sm text-ui-textSecondary mb-4 font-medium uppercase tracking-wide">
                      Client Signature (Consent to data processing):
                    </p>
                    <div className="bg-ui-bg rounded-xl overflow-hidden border border-[#D4AF37]">
                      <SignaturePad
                        label=""
                        value={formData.podpisRodo || ""}
                        onChange={(sig) => {
                          handleInputChange("podpisRodo", sig);
                          if (sig && !formData.zgodaPrzetwarzanieDanych) {
                            handleInputChange("zgodaPrzetwarzanieDanych", true);
                          }
                        }}
                        date={formData.miejscowoscData}
                        hasBorder={false}
                      />
                    </div>
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
              {/* Card 2: CLAUSE */}
              <section className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
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

          {currentStep === "TREATMENT" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Side Effects and Complications - Section 4 */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    4
                  </span>
                  Side Effects and Complications
                </h2>
                <div className="space-y-6">
                  <p className="text-sm text-ui-textSecondary mb-4 italic leading-relaxed">
                    I have been informed about the course of the treatment and
                    the possibility of the following risks occurring naturally:
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/20 shadow-inner">
                      <p className="text-sm font-bold text-marble-text mb-3 uppercase tracking-wider">
                        Possible natural reactions:
                      </p>
                      <ul className="space-y-2 text-sm text-ui-textSecondary">
                        {laseroweUsuwanieNaturalReactions.map(
                          (reaction, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-brand font-bold">∙</span>
                              {reaction}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]/20 shadow-inner">
                      <p className="text-sm font-bold text-marble-text mb-3 uppercase tracking-wider">
                        Possible complications:
                      </p>
                      <div className="space-y-3 text-sm text-ui-textSecondary">
                        <p>
                          <span className="font-bold text-brand/80">
                            Common:
                          </span>{" "}
                          {laseroweUsuwanieComplications.czeste.join(", ")}
                        </p>
                        <p>
                          <span className="font-bold text-brand/80">Rare:</span>{" "}
                          {laseroweUsuwanieComplications.rzadkie.join(", ")}
                        </p>
                        <p>
                          <span className="font-bold text-brand/80">
                            Very rare:
                          </span>{" "}
                          {laseroweUsuwanieComplications.bardzoRzadkie.join(
                            ", ",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Pre-Treatment Instructions - Section 5 */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    5
                  </span>
                  Pre-Treatment Instructions
                </h2>
                <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37]/20 shadow-inner">
                  <ul className="space-y-3">
                    {laseroweUsuwaniePreCare.map((instruction, index) => (
                      <li key={index} className="flex items-start gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(212,175,55,0.4)] group-hover:scale-125 transition-transform" />
                        <span className="text-ui-textSecondary text-sm leading-relaxed">
                          {instruction}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Post-Treatment Instructions - Section 6 */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    6
                  </span>
                  Post-Treatment Instructions
                </h2>
                <div className="space-y-6">
                  <p className="text-sm text-ui-textSecondary mb-4 italic leading-relaxed">
                    I commit to following these instructions:
                  </p>
                  <div className="bg-ui-bg p-6 rounded-xl border border-[#D4AF37]/20 shadow-inner">
                    <ul className="space-y-3">
                      {laseroweUsuwaniePostCare.map((instruction, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0" />
                          <span
                            className={`text-ui-textSecondary text-sm leading-relaxed ${
                              instruction.startsWith("WARNING")
                                ? "font-bold text-brand"
                                : ""
                            }`}
                          >
                            {instruction}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Declarations - Section 7 */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    7
                  </span>
                  Declarations
                </h2>
                <div className="bg-ui-bg p-6 md:p-8 rounded-xl border border-[#D4AF37]/20 shadow-inner overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <h4 className="font-serif text-marble-text text-lg mb-6 uppercase tracking-tight border-b border-[#D4AF37]/20 pb-4">
                    DECLARATION AND INFORMED CONSENT TO THE TREATMENT
                  </h4>
                  <div className="space-y-6 text-sm text-ui-textSecondary leading-relaxed max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                    <p>
                      <strong>Health status and responsibility:</strong> I
                      declare that the Specialist has informed me of the
                      contraindications to the treatment. I confirm that none of
                      the listed factors apply to me (e.g. pregnancy, fresh tan,
                      photosensitising medications, active infections).
                    </p>
                    <p>
                      <strong>Treatment information and risk:</strong> I have
                      received comprehensive information about the course of the
                      treatment, the technique used and the potential pain. I
                      had the opportunity to ask questions and received clear
                      answers.
                    </p>
                    <p>
                      <strong>Results and no guarantee:</strong> I have been
                      informed that the effectiveness of pigment removal depends
                      on many individual factors. I understand that the
                      treatment must be performed in a series and that 100%
                      removal of pigment cannot be fully guaranteed.
                    </p>
                    <p>
                      <strong>Instructions and hygiene:</strong> I confirm that
                      the materials used in the treatment are
                      sterile/disposable. I have received post-treatment care
                      instructions and commit to following them strictly.
                    </p>
                    <p>
                      <strong>Qualifications and decision:</strong> I declare
                      that I am aware that the Specialist performing the
                      treatment has appropriate training and experience in laser
                      operation. I make the decision to undergo the treatment
                      consciously, voluntarily and at my own responsibility.
                    </p>
                    <p className="mt-4 font-bold text-brand italic">
                      * In the case of a minor, the signature of a parent or
                      legal guardian is required.
                    </p>
                  </div>
                </div>
              </section>

              {/* Consent Confirmation - Section 8 */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    8
                  </span>
                  Consent Confirmation
                </h2>
                <div className="bg-ui-bg p-6 md:p-8 rounded-2xl border border-[#D4AF37]/50 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent opacity-30" />
                  <p className="text-sm text-ui-textSecondary mb-8 leading-relaxed italic text-center max-w-2xl mx-auto">
                    By signing below, I confirm that I have read the above
                    information, risks and instructions, and I give my informed
                    consent to the treatment.
                  </p>
                  <SignaturePad
                    label="Date and legible Client Signature (Required)"
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
                  onClick={() => setCurrentStep("RODO2")}
                  className="text-brand hover:text-brand-dark px-6 py-3 font-medium transition-colors flex items-center gap-2"
                >
                  ← Back to GDPR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("MARKETING")}
                  disabled={!formData.podpisDane}
                  className="bg-brand text-black py-4 px-10 rounded-xl text-lg font-bold shadow-xl hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  Next (Additional consents) →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MARKETING */}
          {currentStep === "MARKETING" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8">
                <h3 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    9
                  </span>
                  Additional Consents
                </h3>
                <p className="text-sm text-ui-textSecondary mb-6">
                  The following consents are <strong>optional</strong>.
                </p>

                {/* Marketing consent */}
                <div className="bg-ui-bg backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-[#D4AF37] hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h4 className="font-serif text-marble-text text-lg mb-3">
                      Marketing Consent
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-6">
                      I consent to receiving information about news, promotions
                      and special offers from{" "}
                      <strong>{rodoInfo.firmaNazwa}</strong> by electronic means
                      (SMS / Email).
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
                <div className="bg-ui-bg backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-[#D4AF37] hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <h4 className="font-serif text-marble-text text-lg mb-3">
                      Image Usage Consent
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                      I give free consent to the recording and distribution of
                      my image (photos/video of treatment results) for
                      promotional purposes of {SALON_CONFIG.name} salon.
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
                    "Confirm and Submit Form"
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
