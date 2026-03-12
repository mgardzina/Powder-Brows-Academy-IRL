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
import BackButton from "../BackButton";
import { SALON_CONFIG } from "@/app/config/salon";
import {
  ConsentFormData,
  ContraindicationWithFollowUp,
  wolumetriaTwarzyContraindications,
  wolumetriaTwarzyNaturalReactions,
  wolumetriaTwarzyComplications,
  wolumetriaTwarzyPostCare,
  rodoInfo,
} from "../../../types/booking";

interface FacialVolumetryFormProps {
  onBack: () => void;
}

const initialFormData: ConsentFormData = {
  type: "FACIAL_VOLUMETRY",
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
  przeciwwskazania: Object.entries(wolumetriaTwarzyContraindications).reduce(
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

  // Form Steps: DATA -> SMS -> GDPR -> TREATMENT -> MARKETING
  type Step = "DATA" | "GDPR" | "GDPR2" | "TREATMENT" | "MARKETING";
  const [currentStep, setCurrentStep] = useState<Step>("DATA");

  // Digital Signature State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSignatureVerified, setIsSignatureVerified] = useState(false);
  const [auditLog, setAuditLog] = useState<AuditLogData | null>(null);

  const contraindicationKeys = Object.keys(wolumetriaTwarzyContraindications);
  const currentContraindicationKey =
    contraindicationKeys[currentContraindicationIndex];
  const currentContraindicationValue =
    wolumetriaTwarzyContraindications[currentContraindicationKey];
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
    setCurrentStep("GDPR");
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
              Fill in again
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
                1. Data
              </span>
              <span className="text-marble-textSecondary">→</span>
              <span
                className={
                  currentStep === "GDPR"
                    ? "text-brand font-bold"
                    : "text-marble-textSecondary"
                }
              >
                2. GDPR
              </span>
              <span className="text-marble-textSecondary">→</span>
              <span
                className={
                  currentStep === "GDPR2"
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
              Facial Filling with{" "}
              <span className="text-brand">Hyaluronic Acid</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-brand"></div>
              <p className="text-brand text-sm md:text-lg font-light tracking-[0.3em] uppercase drop-shadow-sm">
                Hyaluronic Acid
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
                        Ulica i numer
                      </label>
                      <input
                        type="text"
                        value={formData.ulica}
                        onChange={(e) =>
                          handleInputChange("ulica", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 text-marble-text placeholder-marble-textSecondary outline-none transition-all"
                        placeholder="Street Name 1/2"
                        autoComplete="street-address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                        Kod pocztowy
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
                        Miasto
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

              {/* Informacja o Zabiegu */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    2
                  </span>
                  Treatment Information
                </h2>
                <div className="prose prose-sm max-w-none text-ui-textSecondary leading-relaxed space-y-4">
                  <p>
                    Facial volumetry is an aesthetic medicine procedure aimed at
                    restoring or improving the volume of soft facial tissues,
                    modeling contours, and reducing signs of aging, such as loss
                    of firmness and sagging oval. The procedure is performed
                    using hyaluronic acid or tissue stimulators. It is an
                    invasive procedure associated with breaking the continuity
                    of the epidermis, therefore it is not without risk.
                  </p>
                  <p>
                    The procedure always takes place after excluding all
                    contraindications. In a conversation with the Client, their
                    needs and expectations are determined, and the specialist
                    selects the appropriate preparation and its amount.
                  </p>
                  <p>
                    The next stage is anesthesia, which minimizes discomfort
                    during the procedure. The pain threshold is felt
                    individually. The use of anesthesia guarantees
                    zminimalizowanie bólu. Czas zabiegu zależny jest od obszaru
                    aplikacji oraz cech indywidualnych skóry, ale średnio trwa
                    około godziny. Efekt końcowy widoczny jest po kilku dniach
                    (kwas hialuronowy) lub kilku tygodniach (stymulatory
                    tkankowe) od przeprowadzonego zabiegu.
                  </p>
                  <p>
                    The effects of facial volumetry treatment are not permanent.
                    In the case of hyaluronic acid, they last from 6 to 18
                    months, while in the case of tissue stimulators from 12 to
                    24 months. The duration of the effect depends on the type of
                    preparation, injected amount, injection technique, as well
                    as individual organism characteristics and lifestyle. The
                    specialist informs the Client that the effects of the
                    procedure are not identical for every Client.
                  </p>
                </div>
              </section>

              {/* Szczegóły Zabiegu */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    3
                  </span>
                  Treatment Details
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Product Name
                    </label>
                    <div className="space-y-4">
                      {/* Product Selection */}
                      <div className="flex flex-col gap-3">
                        {[
                          {
                            name: "Revolax Deep ",
                            desc: "A thicker gel that maintains shape exceptionally well. Recommended for clients expecting more pronounced lip augmentation or filling of nasolabial folds.",
                          },
                          {
                            name: "Revolax Sub-Q",
                            desc: "The thickest preparation, mimicking the hardness of bone. Used for sharpening features: jawline and chin.",
                          },
                          {
                            name: "Neuramis Deep",
                            desc: "Malleable and soft gel. Excellent for clients who value a subtle, natural lip look (soft lips) and for smoothing medium wrinkles.",
                          },
                          {
                            name: "Neuramis Volume",
                            desc: "A lifting preparation. Used for restoring lost volume in cheeks and improving the facial oval.",
                          },
                        ].map((product) => {
                          const currentName = formData.nazwaProduktu || "";
                          const baseName = currentName
                            .split(" (")[0]
                            .split(" - ")[0];
                          const isSelectedProduct = baseName === product.name;

                          return (
                            <div
                              key={product.name}
                              onClick={() => {
                                // Select product only, reset volume if switching to new product
                                if (!isSelectedProduct) {
                                  handleInputChange(
                                    "nazwaProduktu",
                                    product.name,
                                  );
                                }
                              }}
                              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                isSelectedProduct
                                  ? "border-brand bg-brand/10 gold-glow"
                                  : "border-[#D4AF37] bg-ui-bg hover:border-brand/60"
                              } shadow-xl shadow-brand/5`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span
                                  className={`font-serif text-lg font-medium ${
                                    isSelectedProduct
                                      ? "text-marble-text"
                                      : "text-marble-text"
                                  }`}
                                >
                                  {product.name}
                                </span>
                                {isSelectedProduct && (
                                  <div className="w-6 h-6 bg-brand rounded flex items-center justify-center">
                                    <Check className="w-4 h-4 text-black" />
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                                {product.desc}
                              </p>

                              {/* Volume Selection inside Product Card */}
                              {isSelectedProduct && (
                                <div className="border-t border-[#D4AF37] pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <p className="text-xs font-medium text-brand mb-2 uppercase tracking-wide">
                                    Select amount:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {["1.0", "2.0", "3.0", "4.0"].map((vol) => {
                                      const isSelectedVolume =
                                        currentName ===
                                        `${product.name} - ${vol}ml`;
                                      return (
                                        <button
                                          key={vol}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation(); // Prevent bubbling
                                            handleInputChange(
                                              "nazwaProduktu",
                                              `${product.name} - ${vol}ml`,
                                            );
                                          }}
                                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                                            isSelectedVolume
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
                  </div>

                  {/* Obszar Zabiegu - Anatomy Face Selector */}
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Treatment Area
                    </label>
                    <div className="bg-ui-bg p-4 rounded-xl border border-[#D4AF37]">
                      <p className="text-xs text-ui-textSecondary mb-4 text-center">
                        Select areas on the diagram to be treated.
                      </p>
                      <AnatomyFaceSelector
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

                  {/* Additional History Section */}
                  <div>
                    <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37] mb-6 space-y-4">
                      <h3 className="font-serif text-marble-text text-lg mb-2">
                        Volumetric Treatment History
                      </h3>
                      <p className="text-xs text-brand uppercase tracking-widest font-medium">
                        Information required for safety
                      </p>
                      <div className="space-y-3">
                        {[
                          "First time treatment",
                          "Second time treatment, in the same salon",
                          "Second time treatment, first time in another salon",
                        ].map((option) => (
                          <label
                            key={option}
                            className="flex items-start gap-3 cursor-pointer group"
                          >
                            <div className="relative flex items-center pt-1">
                              <input
                                type="checkbox"
                                checked={(
                                  formData.informacjaDodatkowa || ""
                                ).includes(option)}
                                onChange={(e) => {
                                  let parts = (
                                    formData.informacjaDodatkowa || ""
                                  )
                                    .split("\n")
                                    .filter(Boolean);

                                  if (e.target.checked) {
                                    // Remove other exclusive options if checked
                                    const exclusiveGroup = [
                                      "First time treatment",
                                      "Second time treatment, in the same salon",
                                      "Second time treatment, first time in another salon",
                                    ];
                                    // Also remove the "Multiple times" option which starts with the prefix
                                    const multipleTimesPrefix =
                                      "Treatment performed multiple times";

                                    parts = parts.filter(
                                      (p) =>
                                        !exclusiveGroup.includes(p) &&
                                        !p.startsWith(multipleTimesPrefix),
                                    );
                                    parts.push(option);
                                  } else {
                                    parts = parts.filter((p) => p !== option);
                                  }
                                  handleInputChange(
                                    "informacjaDodatkowa",
                                    parts.join("\n"),
                                  );
                                }}
                                className="w-5 h-5 rounded border-[#D4AF37] text-brand focus:ring-brand focus:ring-offset-0 accent-brand"
                              />
                            </div>
                            <span className="text-ui-textSecondary text-sm group-hover:text-brand transition-colors">
                              {option}
                            </span>
                          </label>
                        ))}

                        {/* Multiple Times with customized input */}
                        <div className="space-y-2">
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative flex items-center pt-1">
                              <input
                                type="checkbox"
                                checked={(
                                  formData.informacjaDodatkowa || ""
                                ).includes("Zabieg wykonywany więcej razy")}
                                onChange={(e) => {
                                  let parts = (
                                    formData.informacjaDodatkowa || ""
                                  ).split("\n");
                                  const prefix =
                                    "Treatment performed multiple times: ";
                                  if (e.target.checked) {
                                    // Remove other exclusive options
                                    const exclusiveGroup = [
                                      "First time treatment",
                                      "Second time treatment, in the same salon",
                                      "Second time treatment, first time in another salon",
                                    ];
                                    parts = parts.filter(
                                      (p) => !exclusiveGroup.includes(p),
                                    );
                                    parts.push(prefix);
                                  } else {
                                    parts = parts.filter(
                                      (p) => !p.startsWith(prefix),
                                    );
                                  }
                                  handleInputChange(
                                    "informacjaDodatkowa",
                                    parts.filter(Boolean).join("\n"),
                                  );
                                }}
                                className="w-5 h-5 rounded border-[#D4AF37] text-brand focus:ring-brand focus:ring-offset-0 accent-brand"
                              />
                            </div>
                            <span className="text-ui-textSecondary text-sm group-hover:text-brand transition-colors">
                              Treatment performed multiple times
                            </span>
                          </label>
                          {(formData.informacjaDodatkowa || "").includes(
                            "Treatment performed multiple times",
                          ) && (
                            <input
                              type="text"
                              className="w-full ml-8 px-3 py-2 text-sm bg-ui-bg border border-[#D4AF37] rounded-lg focus:border-brand outline-none"
                              placeholder="When, what product, how many times?"
                              value={
                                (formData.informacjaDodatkowa || "")
                                  .split("\n")
                                  .find((p) =>
                                    p.startsWith(
                                      "Treatment performed multiple times: ",
                                    ),
                                  )
                                  ?.replace(
                                    "Treatment performed multiple times: ",
                                    "",
                                  ) || ""
                              }
                              onChange={(e) => {
                                const parts = (
                                  formData.informacjaDodatkowa || ""
                                ).split("\n");
                                const index = parts.findIndex((p) =>
                                  p.startsWith(
                                    "Treatment performed multiple times: ",
                                  ),
                                );
                                if (index !== -1) {
                                  parts[index] =
                                    `Treatment performed multiple times: ${e.target.value}`;
                                  handleInputChange(
                                    "informacjaDodatkowa",
                                    parts.join("\n"),
                                  );
                                }
                              }}
                            />
                          )}
                        </div>

                        {/* Other */}
                        <div className="pt-2">
                          <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                            Other information
                          </label>
                          <textarea
                            rows={3}
                            className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand outline-none text-sm"
                            placeholder="Additional notes..."
                            value={
                              (formData.informacjaDodatkowa || "")
                                .split("\n")
                                .find((p) => p.startsWith("Other: "))
                                ?.replace("Other: ", "") || ""
                            }
                            onChange={(e) => {
                              const parts = (
                                formData.informacjaDodatkowa || ""
                              ).split("\n");
                              const newVal = `Other: ${e.target.value}`;
                              const index = parts.findIndex((p) =>
                                p.startsWith("Other: "),
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
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Expected effect
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {[
                        "Improvement of facial oval",
                        "Filling volume loss",
                        "Wrinkle reduction",
                        "Skin firmness improvement",
                      ].map((effect) => (
                        <button
                          key={effect}
                          type="button"
                          onClick={() => {
                            const current = formData.celEfektu
                              ? formData.celEfektu.split(", ")
                              : [];
                            const newValue = current.includes(effect)
                              ? current.filter((i) => i !== effect).join(", ")
                              : [...current, effect].join(", ");
                            handleInputChange("celEfektu", newValue);
                          }}
                          className={`py-3 px-4 rounded-xl border-2 transition-all font-medium text-sm ${
                            formData.celEfektu.split(", ").includes(effect)
                              ? "border-brand bg-brand text-white"
                              : "border-[#D4AF37] bg-ui-bg text-ui-textSecondary hover:border-brand hover:text-brand"
                          }`}
                        >
                          {effect}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Wywiad Medyczny Hyaluronic */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
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
                    Please enter a list of all medications taken in the last 6
                    months
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-gradient-emerald border border-[#D4AF37] rounded-xl focus:border-brand outline-none text-sm text-marble-text placeholder-marble-textSecondary"
                    placeholder="Enter medications or type 'NONE'..."
                    value={
                      (formData.informacjaDodatkowa || "")
                        .split("\n")
                        .find((p) => p.startsWith("Meds (6 months): "))
                        ?.replace("Meds (6 months): ", "") || ""
                    }
                    onChange={(e) => {
                      const parts = (formData.informacjaDodatkowa || "").split(
                        "\n",
                      );
                      const prefix = "Meds (6 months): ";
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
                        {typeof wolumetriaTwarzyContraindications[
                          currentContraindicationKey
                        ] === "string"
                          ? (wolumetriaTwarzyContraindications[
                              currentContraindicationKey
                            ] as string)
                          : (
                              wolumetriaTwarzyContraindications[
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
                              Dalej →
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

                      {Object.entries(wolumetriaTwarzyContraindications).map(
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
                    5
                  </span>
                  Information about Side Effects and Complications
                </h2>

                <div className="space-y-6">
                  {/* Częste skutki uboczne */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      MOŻLIWE DO WYSTĄPIENIA SKUTKI UBOCZNE PO PRZEPROWADZONYM
                      ZABIEGU - CZĘSTE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {wolumetriaTwarzyNaturalReactions.map(
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
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      MOŻLIWE POWIKŁANIA PO PRZEPROWADZONYM ZABIEGU – RZADKIE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {wolumetriaTwarzyComplications.rzadkie.map(
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
                      MOŻLIWE POWIKŁANIA PO PRZEPROWADZONYM ZABIEGU – BARDZO
                      RZADKIE
                    </p>
                    <ul className="space-y-2 text-sm text-ui-textSecondary">
                      {wolumetriaTwarzyComplications.bardzoRzadkie.map(
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
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 gold-glow-sm">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center text-sm font-sans">
                    6
                  </span>
                  Zalecenia Pozabiegowe
                </h2>

                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37] mb-6">
                  <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                    <strong>
                      I hereby declare that I have been informed of the
                      necessity to follow these recommendations after the
                      procedure:
                    </strong>
                  </p>
                  <ul className="space-y-2 text-sm text-ui-textSecondary">
                    {wolumetriaTwarzyPostCare.map((instruction, index) => (
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

          {/* STEP 2: GDPR */}
          {currentStep === "GDPR" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] overflow-hidden gold-glow-sm">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6">
                    {rodoInfo.consentTitle}
                  </h3>
                  <div className="bg-ui-bg p-6 rounded-xl text-sm text-ui-textSecondary leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto mb-6 border border-[#D4AF37]">
                    {rodoInfo.consentText}
                  </div>
                  {/* Signature Area for GDPR */}
                  <div className="mt-8">
                    <SignaturePad
                      label="Client Signature (GDPR Consent)"
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
                  onClick={() => setCurrentStep("GDPR2")}
                  disabled={!formData.podpisRodo}
                  className="bg-brand text-white py-3 px-8 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: GDPR 2 */}
          {currentStep === "GDPR2" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] overflow-hidden gold-glow-sm">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6">
                    {rodoInfo.clauseTitle}
                  </h3>
                  <div className="bg-ui-bg p-6 rounded-xl text-sm text-ui-textSecondary leading-relaxed whitespace-pre-line max-h-[60vh] overflow-y-auto mb-6 border border-[#D4AF37]">
                    {rodoInfo.clauseText}
                  </div>
                  {/* Signature Area for GDPR 2 */}
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
                      Signing is equivalent to being informed with the above
                      GDPR clause.
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex justify-between pt-4 pb-12">
                <button
                  type="button"
                  onClick={() => setCurrentStep("GDPR")}
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
                    I have been informed about the course of the procedure and
                    the possibility of natural occurrence of risk:
                  </p>

                  <div className="space-y-6">
                    <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                      <p className="text-sm font-medium text-marble-text mb-3">
                        Possible natural reactions:
                      </p>
                      <ul className="space-y-2 text-sm text-ui-textSecondary">
                        {wolumetriaTwarzyNaturalReactions.map(
                          (reaction, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-brand">•</span>
                              {reaction}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                      <p className="text-sm font-medium text-marble-text mb-3">
                        Possible complications:
                      </p>
                      <div className="space-y-3 text-sm text-ui-textSecondary">
                        <p>
                          <span className="font-medium">Common:</span>{" "}
                          {wolumetriaTwarzyComplications.czeste.join(", ")}
                        </p>
                        <p>
                          <span className="font-medium">Rare:</span>{" "}
                          {wolumetriaTwarzyComplications.rzadkie.join(", ")}
                        </p>
                        <p>
                          <span className="font-medium">Very rare:</span>{" "}
                          {wolumetriaTwarzyComplications.bardzoRzadkie.join(
                            ", ",
                          )}
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
                    Post-Treatment Commitments
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I commit to follow the following recommendations:
                  </p>
                  <ul className="space-y-2 text-ui-textSecondary text-sm bg-ui-bg p-4 rounded-xl border border-[#D4AF37]/30">
                    {wolumetriaTwarzyPostCare.map((instruction, index) => (
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
                    STATEMENT AND INFORMED CONSENT FOR FACIAL VOLUMETRY
                    TREATMENT (HYALURONIC ACID MODELING)
                  </h4>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I, the undersigned, after a detailed interview and
                    consultation with the Specialist, declare that:
                  </p>

                  <div className="space-y-4 text-sm text-ui-textSecondary leading-relaxed">
                    <p>
                      <strong>Health status and awareness:</strong> I have
                      provided full and true answers to questions regarding my
                      health status. I declare that I do not have any medical,
                      physical, or mental contraindications that could affect my
                      decision. I am aware of the risk of an allergic reaction
                      to the anesthetic or the injected preparation (hyaluronic
                      acid). I accept this risk and in case of an allergic
                      reaction, I take responsibility for the consequences of
                      its occurrence. The decision to undergo volumetry
                      treatment is made fully consciously, voluntarily, and
                      thoughtfully.
                    </p>
                    <p>
                      <strong>
                        Information about the procedure and hygiene:
                      </strong>{" "}
                      I have received exhaustive information about the
                      procedure, the technique of its performance, indications,
                      and course. I had the opportunity to ask questions and
                      received understandable answers to them. I confirm that
                      the materials (including the pre-filled syringe with
                      hyaluronic acid) used for the procedure are sterile,
                      disposable, and were opened in my presence. The highest
                      hygienic standards are maintained in the Salon.
                    </p>
                    <p>
                      <strong>Risks and complications:</strong> I have been
                      informed about possible side effects, such as: swelling,
                      redness, bruising (hematomas), tenderness, which may
                      persist for several days depending on my lifestyle. I
                      declare that understanding the risk of complications, I
                      will not bring claims for compensation in the event of
                      typical consequences of the procedure, which I have been
                      warned about.
                    </p>
                    <p>
                      <strong>
                        Effects, durability, and lack of guarantee:
                      </strong>{" "}
                      I have been informed that the final effect depends on
                      individual organism characteristics (biochemistry, skin
                      type, amount of injected preparation) and the technique
                      used. I acknowledge that the effects of volumetry
                      treatment usually last from 1 to 2 years, which is an
                      individual matter, and the treatment should be repeated to
                      maintain the result. I understand that no guarantee is
                      given for obtaining an identical effect as in other
                      people, nor for 100% satisfaction with the aesthetic
                      result. The discrepancy between my expectations and the
                      real result (defined by the Specialist as possible to
                      achieve) does not constitute grounds for claims.
                    </p>
                    <p>
                      <strong>Post-treatment recommendations:</strong> I commit
                      to strictly follow the post-treatment recommendations that
                      have been provided and explained to me. I am aware that
                      non-compliance with the recommendations can lead to
                      serious complications, such as infections or scarring, for
                      which the Specialist bears no responsibility.
                    </p>
                    <p>
                      <strong>Qualifications of the performer:</strong> I
                      declare that I am fully aware that the Specialist
                      performing the procedure is not an aesthetic medicine
                      doctor, but has extensive experience and training in the
                      scope of performed procedures. I accept this fact and in
                      case of performing the procedure in accordance with the
                      principles and ethics of work, but not obtaining the
                      expected effect, I will not bring claims against the
                      person performing the procedure.
                    </p>
                    <p className="mt-4 font-medium text-brand">
                      * In the case of a minor, the signature of a parent or
                      legal guardian is required.
                    </p>
                  </div>
                </div>

                {/* Podpis pod Zabiegiem (Nowy, obowiązkowy) */}
                <div className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8 mt-8 gold-glow-sm">
                  <h3 className="text-xl font-serif text-marble-text mb-4 border-b border-[#D4AF37] pb-2">
                    Treatment Consent Confirmation
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-6">
                    By providing my signature below, I confirm that I have read
                    the above information, risks, and recommendations and give
                    informed consent to the procedure.
                  </p>
                  <SignaturePad
                    label="Client Signature (Required)"
                    value={formData.podpisDane}
                    onChange={(sig) => {
                      handleInputChange("podpisDane", sig);
                      // We can also set a consent flag here, e.g., zgodaPomocPrawna (repurposed) or simply rely on the signature
                      // For consistency with the backend, let's set zgodaPomocPrawna to true
                      handleInputChange("zgodaPomocPrawna", !!sig);
                    }}
                    date={formData.miejscowoscData}
                  />
                </div>
              </section>

              <div className="flex justify-between pt-4 pb-12">
                <button
                  type="button"
                  onClick={() => setCurrentStep("GDPR")}
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
                    7
                  </span>
                  Additional Consents
                </h3>
                <p className="text-sm text-ui-textSecondary mb-6">
                  The consents below are <strong>optional</strong>.
                </p>

                {/* Zgoda na marketing */}
                <div className="bg-ui-bg/60 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-brand/50 hover:shadow-md transition-shadow gold-glow-sm">
                  <div className="p-6">
                    <h4 className="font-serif text-marble-text text-lg mb-3">
                      Marketing Consent
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-6">
                      I agree to receive information about news, promotions and
                      special offers from the company{" "}
                      <strong>{rodoInfo.firmaNazwa}</strong> by electronic means
                      (SMS / E-mail).
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
                      Likeness Use Consent
                    </h4>
                    <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                      I give free of charge consent for the recording and
                      dissemination of my likeness (photos/videos of treatment
                      effects) for the promotional purposes of{" "}
                      {SALON_CONFIG.name} salon.
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
                    "Confirm and Send Form"
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
