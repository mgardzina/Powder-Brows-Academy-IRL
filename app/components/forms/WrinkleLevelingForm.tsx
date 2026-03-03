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
  niwelowaineZmarszczekPostCare,
  rodoInfo,
} from "../../../types/booking";

interface FacialVolumetryFormProps {
  onBack: () => void;
}

const initialFormData: ConsentFormData = {
  type: "WRINKLE_REDUCTION",
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

  // Form Steps: DATA -> RODO -> RODO2 -> TREATMENT -> MARKETING
  const [currentStep, setCurrentStep] = useState<
    "DATA" | "RODO" | "RODO2" | "TREATMENT" | "MARKETING"
  >("DATA");

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
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

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
        <div className="bg-gradient-emerald backdrop-blur-sm rounded-3xl shadow-2xl p-12 max-w-lg text-center border border-[#D4AF37]">
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
              className="bg-brand text-black px-8 py-3 rounded-xl hover:bg-brand-dark hover:text-brand transition-colors font-medium"
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
              Wrinkle <span className="text-brand">Reduction</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-brand"></div>
              <p className="text-brand text-sm md:text-lg font-light tracking-[0.3em] uppercase drop-shadow-sm">
                Zabieg z zakresu niwelowania zmarszczek
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
                      className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary"
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
                      className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary"
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
                        className="w-full pl-12 pr-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary"
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
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary"
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
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary"
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
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary"
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
                        className="w-full px-4 py-3 bg-ui-bg border border-[#D4AF37] rounded-r-xl focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-marble-text placeholder-marble-textSecondary"
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
                <div className="prose prose-sm max-w-none text-ui-textSecondary leading-relaxed space-y-4">
                  <p>
                    Wolumetria twarzy to zabieg medycyny estetycznej, którego
                    celem jest przywrócenie lub poprawa objętości tkanek
                    miękkich twarzy, modelowanie konturów oraz redukcja oznak
                    starzenia się, takich jak utrata jędrności i opadanie owalu.
                    Zabieg wykonywany jest przy użyciu kwasu hialuronowego lub
                    stymulatorów tkankowych. Jest to zabieg inwazyjny, związany
                    z przerwaniem ciągłości naskórka, dlatego nie jest
                    pozbawiony ryzyka.
                  </p>
                  <p>
                    Zabieg polega na wstrzyknięciu preparatu za pomocą igły lub
                    kaniuli w wybrane obszary twarzy, takie jak kości
                    policzkowe, linia żuchwy, broda, skronie czy dolina łez.
                    Celem zabiegu jest przywrócenie młodzieńczego wyglądu,
                    poprawa proporcji twarzy, wypełnienie ubytków objętości,
                    redukcja zmarszczek oraz poprawa ogólnej kondycji i
                    jędrności skóry.
                  </p>
                  <p>
                    Zabieg wykonywany jest przy użyciu produktów takich jak:
                    Stylage L, Stylage XL (kwas hialuronowy) lub Neauvia
                    Stimulate, Radiesse (stymulatory tkankowe). Wybór preparatu
                    zależy od indywidualnych potrzeb klienta i oczekiwanych
                    efektów.
                  </p>
                  <p>
                    Zabieg odbywa się zawsze po wykluczeniu wszelkich
                    przeciwwskazań. W rozmowie z Klientem określane są potrzeby
                    i oczekiwania, a specjalista dobiera odpowiedni preparat i
                    jego ilość.
                  </p>
                  <p>
                    Kolejnym etapem jest znieczulenie, które minimalizuje
                    dyskomfort podczas zabiegu. Próg bólu odczuwany jest
                    indywidualnie. Zastosowanie znieczulenia gwarantuje
                    zminimalizowanie bólu. Czas zabiegu zależny jest od obszaru
                    aplikacji oraz cech indywidualnych skóry, ale średnio trwa
                    około godziny. Efekt końcowy widoczny jest po kilku dniach
                    (kwas hialuronowy) lub kilku tygodniach (stymulatory
                    tkankowe) od przeprowadzonego zabiegu.
                  </p>
                  <p>
                    Efekty zabiegu wolumetrii twarzy nie są trwałe. W przypadku
                    kwasu hialuronowego utrzymują się od 6 do 18 miesięcy,
                    natomiast w przypadku stymulatorów tkankowych od 12 do 24
                    miesięcy. Czas utrzymywania się efektu zależy od rodzaju
                    preparatu, wstrzykniętej ilości, techniki iniekcji, a także
                    od indywidualnych cech organizmu i stylu życia. Specjalista
                    informuje Klienta, że efekty zabiegu nie są identyczne w
                    przypadku każdego Klienta.
                  </p>
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
                  {/* Obszar Zabiegu - Anatomy Face Selector */}
                  <div>
                    <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                      Treatment Area
                    </label>
                    <div className="bg-ui-bg p-4 rounded-xl border border-[#D4AF37]">
                      <p className="text-xs text-ui-textSecondary mb-4 text-center">
                        Mark the areas to be treated on the diagram.
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
                </div>
              </section>

              {/* Wywiad Medyczny Hyaluronic */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    4
                  </span>
                  Medical Interview
                </h2>
                <p className="text-sm text-ui-textSecondary mb-6">
                  Czy posiadasz którekolwiek z poniższych przeciwwskazań?
                </p>

                {/* Medications Input */}
                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37] mb-6">
                  <h3 className="font-serif text-marble-text text-lg mb-2">
                    PRZECIWSKAZANIA DO WYKONANIA ZABIEGU
                  </h3>
                  <label className="block text-sm text-ui-textSecondary mb-2 font-medium">
                    Proszę wpisać wykaz wszystkich leków przyjmowanych w ciągu
                    ostatnich 6 miesięcy
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
                          Pytanie {currentContraindicationIndex + 1} z{" "}
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
                              className="w-full px-4 py-3 text-base bg-ui-bg border-2 border-[#D4AF37] rounded-xl focus:border-brand outline-none transition-colors text-marble-text placeholder-marble-textSecondary"
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
                          className={`py-4 px-6 rounded-xl border transition-all text-lg font-medium shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center ${
                            currentContraindicationObject?.hasFollowUp &&
                            formData.przeciwwskazania[
                              currentContraindicationKey
                            ] === false
                              ? "border-green-600 bg-green-600 text-marble-text"
                              : "bg-ui-bg border-[#D4AF37] text-ui-textSecondary active:border-green-600 active:bg-green-600 active:text-white md:hover:border-green-600 md:hover:bg-green-600 md:hover:text-brand"
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
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    5
                  </span>
                  Information on Side Effects and Complications
                </h2>

                <div className="space-y-6">
                  {/* Częste skutki uboczne */}
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
                    <p className="text-sm font-medium text-marble-text mb-3">
                      MOŻLIWE DO WYSTĄPIENIA SKUTKI UBOCZNE PO PRZEPROWADZONYM
                      ZABIEGU - CZĘSTE
                    </p>
                    <div className="space-y-4">
                      {wolumetriaTwarzyNaturalReactions.map(
                        (reaction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-brand">∙</span>
                            <span>{reaction}</span>
                          </li>
                        ),
                      )}
                    </div>
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
                  <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37]">
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
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h2 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    6
                  </span>
                  Post-Procedure Instructions
                </h2>

                <div className="bg-ui-bg p-5 rounded-xl border border-[#D4AF37] mb-6">
                  <p className="text-sm text-ui-textSecondary leading-relaxed mb-4">
                    <strong>
                      Niniejszym oświadczam, że zostałam/em poinformowana/y o
                      konieczności stosowania się po przeprowadzonym zabiegu do
                      przestrzegania następujących zaleceń:
                    </strong>
                  </p>
                  <ul className="space-y-2 text-sm text-ui-textSecondary">
                    {niwelowaineZmarszczekPostCare.map((instruction, index) => (
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
                  className="bg-brand text-black py-4 px-8 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3"
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
                  className="text-brand hover:text-brand-light px-6 py-3 font-medium transition-colors"
                >
                  ← Back to data
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("RODO2")}
                  disabled={!formData.podpisRodo}
                  className="bg-brand text-black py-3 px-8 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                      Złożenie podpisu jest równoznaczne z zapoznaniem się z
                      powyższą klauzulą informacyjną RODO.
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex justify-between pt-4 pb-12">
                <button
                  type="button"
                  onClick={() => setCurrentStep("RODO")}
                  className="text-brand hover:text-brand-light px-6 py-3 font-medium transition-colors"
                >
                  ← Back to GDPR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("TREATMENT")}
                  disabled={!formData.podpisRodo2}
                  className="bg-brand text-black py-3 px-8 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* KROK 4: ZABIEG */}
          {currentStep === "TREATMENT" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Ryzyko Hyaluronic */}
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37]">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                    Risk Awareness
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    Zostałam/em poinformowana/y o przebiegu zabiegu i możliwości
                    naturalnego wystąpienia ryzyka:
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
                          <span className="font-medium text-brand">
                            Częste:
                          </span>{" "}
                          {wolumetriaTwarzyComplications.czeste.join(", ")}
                        </p>
                        <p>
                          <span className="font-medium text-brand">
                            Rzadkie:
                          </span>{" "}
                          {wolumetriaTwarzyComplications.rzadkie.join(", ")}
                        </p>
                        <p>
                          <span className="font-medium text-brand">
                            Bardzo rzadkie:
                          </span>{" "}
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
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37]">
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                    Post-Procedure Commitments
                  </h3>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I commit to following these post-procedure instructions:
                  </p>
                  <ul className="space-y-2 text-ui-textSecondary text-sm bg-ui-bg p-4 rounded-xl border border-[#D4AF37]">
                    {niwelowaineZmarszczekPostCare.map((instruction, index) => (
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
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h3 className="text-2xl font-serif text-marble-text mb-6 border-b border-[#D4AF37] pb-2">
                  Declarations
                </h3>
                <div className="bg-ui-bg p-5 rounded-xl mb-6 border border-[#D4AF37]">
                  <h4 className="font-serif text-marble-text text-lg mb-4">
                    DECLARATION AND INFORMED CONSENT FOR WRINKLE REDUCTION
                    PROCEDURE (FILLING / BIOSTIMULATION)
                  </h4>
                  <p className="text-sm text-ui-textSecondary mb-4">
                    I, the undersigned, after a detailed interview and
                    consultation with the Specialist, declare that:
                  </p>

                  <div className="space-y-4 text-sm text-ui-textSecondary leading-relaxed">
                    <p>
                      <strong className="text-marble-text">
                        Health status and awareness:
                      </strong>{" "}
                      I have provided full and truthful answers to the health
                      questionnaire. I declare that I have not concealed any
                      diseases, allergies, or medications that could be a
                      contraindication to the procedure. At the time of signing
                      this document I am not under the influence of alcohol,
                      drugs, or other intoxicants. I make the decision to
                      undergo the wrinkle reduction procedure fully consciously,
                      voluntarily, and deliberately, without pressure from third
                      parties.
                    </p>
                    <p>
                      <strong className="text-marble-text">
                        Procedure information and hygiene:
                      </strong>{" "}
                      I received comprehensive information about the procedure,
                      the injection technique, indications, and the course of
                      the procedure. I had the opportunity to ask questions and
                      received clear answers. I confirm that the materials
                      (including the pre-filled syringe) used for the procedure
                      are sterile, single-use, and were opened in my presence.
                      The highest hygiene standards are maintained at the Salon.
                    </p>
                    <p>
                      <strong className="text-marble-text">
                        Risk and complications:
                      </strong>{" "}
                      I have been informed about possible side effects such as
                      swelling, redness, bruising (hematomas), small lumps, and
                      tenderness at the injection site, which are natural
                      reactions of the body and may last for several days. I am
                      aware of the risk of an allergic reaction to the product
                      components or anesthetic. I accept this risk. I declare
                      that, understanding the risk of complications, I will not
                      make compensation claims in the event of typical
                      consequences of the procedure about which I was warned
                      before it began.
                    </p>
                    <p>
                      <strong className="text-marble-text">
                        Effects, durability, and no guarantee:
                      </strong>{" "}
                      I have been informed that the final result depends on
                      individual characteristics (depth of wrinkles, skin
                      condition, age, lifestyle) and the amount of product used.
                      I acknowledge that the effects of the procedure usually
                      last 6 to 12 months (depending on the product type and
                      patient metabolism), and the procedure must be repeated to
                      maintain results. I understand that complete smoothing of
                      deep lines may require more than one session. No guarantee
                      is given for 100% removal of wrinkles or for an identical
                      result as in other individuals. A discrepancy between my
                      expectations and the actual result determined by the
                      Specialist does not constitute grounds for a complaint.
                    </p>
                    <p>
                      <strong className="text-marble-text">
                        Post-procedure instructions:
                      </strong>{" "}
                      I commit to strictly following the post-procedure
                      instructions (including avoiding sauna, sunbed, makeup at
                      the injection site, and massaging the treated area —
                      unless otherwise instructed). I am aware that failure to
                      follow instructions may lead to complications such as
                      infections, inflammation, product migration, or
                      irregularities, for which the Specialist bears no
                      responsibility.
                    </p>
                    <p>
                      <strong className="text-marble-text">
                        Practitioner qualifications:
                      </strong>{" "}
                      I declare that I am fully aware that the Specialist
                      performing the procedure is not a medical doctor, but has
                      appropriate training and extensive experience in the
                      procedures performed. I accept this fact and, in the event
                      that the procedure is performed in accordance with
                      professional standards but the expected result is not
                      achieved, I will not make claims against the person
                      performing the procedure.
                    </p>
                    <p className="mt-4 font-medium text-brand">
                      * For minors, a signature from a parent or legal guardian
                      is required.
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
                  className="text-brand hover:text-brand-light px-6 py-3 font-medium transition-colors"
                >
                  ← Back to GDPR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep("MARKETING")}
                  disabled={!formData.podpisDane}
                  className="bg-brand text-black py-3 px-8 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next (Additional Consents) →
                </button>
              </div>
            </div>
          )}

          {/* KROK 4: MARKETING */}
          {currentStep === "MARKETING" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="bg-gradient-emerald rounded-2xl border border-[#D4AF37] p-6 md:p-8">
                <h3 className="text-2xl font-serif text-marble-text mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand text-black rounded-full flex items-center justify-center text-sm font-sans font-bold">
                    7
                  </span>
                  Additional Consents
                </h3>
                <p className="text-sm text-ui-textSecondary mb-6">
                  The following consents are <strong>optional</strong>.
                </p>

                {/* Zgoda na marketing */}
                <div className="bg-ui-bg rounded-xl shadow-sm overflow-hidden border border-[#D4AF37] hover:border-[#D4AF37] transition-all">
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
                <div className="bg-ui-bg rounded-xl shadow-sm overflow-hidden border border-[#D4AF37] hover:border-[#D4AF37] transition-all mt-6">
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
                        className="w-full px-4 py-2 bg-ui-bg border-b border-[#D4AF37] focus:border-brand outline-none text-sm transition-colors text-marble-text placeholder-marble-textSecondary"
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
                  className="text-brand hover:text-brand-light px-6 py-3 font-medium transition-colors"
                >
                  ← Back to procedure
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isSignatureVerified}
                  className="bg-brand text-black py-4 px-12 rounded-xl text-lg font-medium shadow-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
