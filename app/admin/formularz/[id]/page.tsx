"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Check,
  X,
  Mail,
  Pencil,
  Save,
  XCircle,
  FileDown,
} from "lucide-react";

import { contraindicationsByFormType, FormType } from "@/types/booking";
import AnatomyFaceSelector from "@/app/components/AnatomyFaceSelector";
import AnatomyBodySelector from "@/app/components/AnatomyBodySelector";
import { ZONES } from "@/types/face-zones";
import { ZONES as PMU_ZONES } from "@/types/face-zone-pernament";
import { ZONES as TISSUE_ZONES } from "@/types/face-zones-tissue";
import { BODY_ZONES } from "@/types/body-zones";
import { BODY_ZONES as TATTOO_BODY_ZONES } from "@/types/body-zonest-tatto";

// Helper do tłumaczenia stref
const ALL_ZONE_LOOKUPS = [...ZONES, ...PMU_ZONES, ...BODY_ZONES, ...TATTOO_BODY_ZONES, ...TISSUE_ZONES];
const translateZones = (zonesString: string | null): string => {
  if (!zonesString) return "Not provided";

  const selectedIds = zonesString.split(",").map((s) => s.trim());

  return selectedIds
    .map((id) => {
      const zone = ALL_ZONE_LOOKUPS.find((z) => z.id === id);
      return zone ? zone.name : id;
    })
    .join(", ");
};

// Funkcja do czyszczenia starego formatu nazwaProduktu (usuwanie emaila)
const cleanNazwaProduktu = (nazwa: string | null): string | null => {
  if (!nazwa) return null;
  // Usuń " | Email: xxx" lub "Email: xxx" ze starego formatu
  const cleaned = nazwa
    .replace(/\s*\|\s*Email:\s*[^\s|]+/gi, "")
    .replace(/^Email:\s*[^\s|]+\s*\|?\s*/gi, "")
    .trim();
  return cleaned || null;
};

interface TreatmentHistory {
  id: string;
  date: string;
  description: string;
}

interface ConsentFormFull {
  id: string;
  type: string;
  createdAt: string;
  imieNazwisko: string;
  email: string | null;
  ulica: string | null;
  kodPocztowy: string | null;
  miasto: string | null;
  pesel: string | null;
  telefon: string;
  miejscowoscData: string;
  nazwaProduktu: string | null;
  obszarZabiegu: string | null;
  celEfektu: string | null;
  metodaZabiegu: string | null;
  przeciwwskazania: Record<string, boolean | string | null>;
  zgodaPrzetwarzanieDanych: boolean;
  zgodaMarketing: boolean;
  zgodaFotografie: boolean;
  zgodaPomocPrawna: boolean;
  miejscaPublikacjiFotografii: string | null;
  podpisDane: string | null;
  podpisMarketing: string | null;
  podpisFotografie: string | null;
  podpisRodo: string | null;
  podpisRodo2: string | null;
  informacjaDodatkowa: string | null;
  osobaPrzeprowadzajacaZabieg: string | null;
  clientId: string | null;
  planowanaIloscZabiegow: string | null;
  odstepMiedzyZabiegami: string | null;
  kolejneZabiegiOdstepy: string | null;
  iloscProduktu: string | null;
}

const formTypeLabels: Record<string, string> = {
  LIP_AUGMENTATION: "Lip modeling",
  FACIAL_VOLUMETRY: "Facial volumetry",
  WRINKLE_REDUCTION: "Wrinkle reduction",
  NEEDLE_MESOTHERAPY: "Needle mesotherapy",
  INJECTION_LIPOLYSIS: "Injection lipolysis",
  TISSUE_STIMULATION: "Tissue stimulation",
  PERMANENT_MAKEUP: "Permanent makeup",
  LASER_HAIR_REMOVAL: "Laser hair removal",
  LASER_TATTOO_REMOVAL: "Laser tattoo removal",
  EYEBROW_TINTING: "Eyebrow tinting",
  EYEBROW_LAMINATION: "Eyebrow lamination",
  EYELASH_EXTENSION: "Eyelash extension",
  EYELID_LIFT: "Eyelid lift",
  FACIAL_CLEANSING: "Facial cleansing",
};

export default function FormDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<ConsentFormFull | null>(null);
  const [history, setHistory] = useState<TreatmentHistory[]>([]);
  const [newHistory, setNewHistory] = useState({ date: "", description: "" });
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [editedForm, setEditedForm] = useState<Partial<ConsentFormFull>>({});
  const [activeTab, setActiveTab] = useState<
    "details" | "contraindications" | "consents"
  >("details");

  useEffect(() => {
    fetchForm();
    fetchHistory();
  }, [params.id]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/consent-forms/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setForm(data.form);
        // Oczyść nazwaProduktu ze starego formatu z emailem
        setEditedForm({
          ...data.form,
          nazwaProduktu: cleanNazwaProduktu(data.form.nazwaProduktu) || "",
        });
      }
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/consent-forms/${params.id}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleAddHistory = async () => {
    if (!newHistory.date || !newHistory.description) return;

    setIsAddingHistory(true);
    try {
      const response = await fetch(`/api/consent-forms/${params.id}/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHistory),
      });

      if (response.ok) {
        await fetchHistory();
        setNewHistory({ date: "", description: "" });
      }
    } catch (error) {
      console.error("Error adding history:", error);
    } finally {
      setIsAddingHistory(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/consent-forms/${params.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        router.push("/admin");
      }
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/consent-forms/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedForm),
      });
      const data = await response.json();
      if (data.success) {
        setForm(data.form);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedForm({
      ...(form || {}),
      nazwaProduktu: cleanNazwaProduktu(form?.nazwaProduktu || null) || "",
    });
    setIsEditing(false);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const response = await fetch(`/api/consent-forms/${params.id}/pdf`);
      if (!response.ok) throw new Error("Error generating PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const cd = response.headers.get("content-disposition") || "";
      const match = cd.match(/filename\*=UTF-8''(.+)/);
      link.download = match
        ? decodeURIComponent(match[1])
        : `karta_zgody_${params.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate PDF. Please check the console.");
      console.error(err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Assuming 'status' and 'error' are defined elsewhere, e.g., from useSession or a global state
  // For this diff, we'll assume 'status' is not available and only use 'isLoading'
  // and 'error' is not explicitly defined in the original snippet, so we'll use '!form' for error state.
  // If 'status' and 'error' are meant to be new variables, they would need to be declared.
  // For now, I'll adapt the provided diff to the existing context as closely as possible.

  if (isLoading) {
    // Original: if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-brand text-lg">Loading...</div>
      </div>
    );
  }

  if (!form) {
    // Original: if (!form)
    return (
      <div className="min-h-screen p-8 text-center">
        <div className="max-w-md mx-auto bg-gradient-emerald backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-red-500/20">
          <p className="text-red-400 mb-6">{"Failed to load data"}</p>{" "}
          <Link
            href="/admin/klientki"
            className="text-brand hover:text-brand-dark transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to list
          </Link>
        </div>
      </div>
    );
  }

  // Renaming 'form' to 'formData' to match the diff's new structure, if that's the intent.
  // However, the rest of the code uses 'form', so I'll keep 'form' and adjust the diff's class names.
  const formData = form; // Alias for consistency with the diff's new structure

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-emerald backdrop-blur-sm sticky top-0 z-50 shadow-lg border-b border-brand">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <BackButton onClick={() => router.push("/admin")} />
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 text-marble-text/60 hover:text-brand transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  <span className="hidden md:inline">Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  <span className="hidden md:inline">
                    {isSaving ? "Saving..." : "Save"}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  title="Download PDF"
                  className="flex items-center gap-2 text-brand hover:text-brand-light transition-colors disabled:opacity-50"
                >
                  <FileDown className="w-5 h-5" />
                  <span className="hidden md:inline">
                    {isDownloadingPdf ? "Generating..." : "Download PDF"}
                  </span>
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-marble-text/80 hover:text-brand transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                  <span className="hidden md:inline">Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 text-red-300 hover:text-red-200 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="hidden md:inline">
                    {isDeleting ? "Deleting..." : "Delete"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header Info - Always Visible */}
        <div className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-8 border border-brand/15">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-serif text-marble-text">
                  {form.imieNazwisko}
                </h1>
                <span className="px-3 py-1 bg-brand/10 text-brand rounded-lg text-sm font-medium">
                  {formTypeLabels[form.type] || form.type}
                </span>
                {form.clientId && (
                  <Link
                    href={`/admin/klientki/${form.clientId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 text-brand hover:bg-brand/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Client Profile
                  </Link>
                )}
              </div>
              <p className="text-ui-textSecondary mt-1">
                Form filled: {formatDate(form.createdAt)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-marble-text">
              <Phone className="w-5 h-5 text-brand flex-shrink-0" />
              {isEditing ? (
                <input
                  type="text"
                  value={editedForm.telefon || ""}
                  onChange={(e) =>
                    setEditedForm({ ...editedForm, telefon: e.target.value })
                  }
                  className="flex-1 px-3 py-1.5 bg-marble-border/40 border border-brand/20 rounded-lg text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text"
                  placeholder="Phone"
                />
              ) : (
                <span>+48 {form.telefon}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-marble-text">
              <Mail className="w-5 h-5 text-brand flex-shrink-0" />
              {isEditing ? (
                <input
                  type="email"
                  value={editedForm.email || ""}
                  onChange={(e) =>
                    setEditedForm({ ...editedForm, email: e.target.value })
                  }
                  className="flex-1 px-3 py-1.5 bg-marble-border/40 border border-brand/20 rounded-lg text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text"
                  placeholder="Email"
                />
              ) : (
                <span>{form.email || "No email"}</span>
              )}
            </div>
            <div className="flex items-start gap-3 text-marble-text">
              <MapPin className="w-5 h-5 text-brand flex-shrink-0 mt-1" />
              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editedForm.ulica || ""}
                    onChange={(e) =>
                      setEditedForm({ ...editedForm, ulica: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-marble-border/40 border border-brand/20 rounded-lg text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text"
                    placeholder="Street"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editedForm.kodPocztowy || ""}
                      onChange={(e) =>
                        setEditedForm({
                          ...editedForm,
                          kodPocztowy: e.target.value,
                        })
                      }
                      className="w-24 px-3 py-1.5 bg-marble-border/40 border border-brand/20 rounded-lg text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text"
                      placeholder="Zip"
                    />
                    <input
                      type="text"
                      value={editedForm.miasto || ""}
                      onChange={(e) =>
                        setEditedForm({ ...editedForm, miasto: e.target.value })
                      }
                      className="flex-1 px-3 py-1.5 bg-marble-border/40 border border-brand/20 rounded-lg text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text"
                      placeholder="City"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col">
                  {form.ulica || form.miasto ? (
                    <>
                      <span className="text-marble-text">{form.ulica}</span>
                      <span className="text-ui-textSecondary">
                        {form.kodPocztowy} {form.miasto}
                      </span>
                    </>
                  ) : (
                    <span className="text-ui-textSecondary italic">
                      No address provided
                    </span>
                  )}
                </div>
              )}
            </div>
            {form.pesel && (
              <div className="flex items-center gap-3 text-marble-text">
                <User className="w-5 h-5 text-brand" />
                <span>PESEL: {form.pesel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-brand/20 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "details"
                ? "text-brand border-b-2 border-brand"
                : "text-ui-textSecondary hover:text-brand"
            }`}
          >
            Treatment Details
          </button>
          <button
            onClick={() => setActiveTab("contraindications")}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "contraindications"
                ? "text-brand border-b-2 border-brand"
                : "text-ui-textSecondary hover:text-brand"
            }`}
          >
            Contraindications
          </button>
          <button
            onClick={() => setActiveTab("consents")}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "consents"
                ? "text-brand border-b-2 border-brand"
                : "text-ui-textSecondary hover:text-brand"
            }`}
          >
            Consents & Signatures
          </button>
        </div>

        {/* Tab Content: Details */}
        {activeTab === "details" && (
          <div className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300 border border-brand/15">
            <h2 className="text-xl font-serif text-marble-text mb-4 pb-3 border-b border-brand/20">
              Treatment Details
            </h2>
            <div className="space-y-4">
              {form.metodaZabiegu && (
                <div>
                  <label className="block text-sm font-medium text-ui-textSecondary mb-1">
                    Treatment Method
                  </label>
                  <p className="text-marble-text">
                    {form.metodaZabiegu}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-ui-textSecondary mb-1">
                  Product/Preparation
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedForm.nazwaProduktu || ""}
                    onChange={(e) =>
                      setEditedForm({
                        ...editedForm,
                        nazwaProduktu: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-marble-border/40 border border-brand/20 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text"
                    placeholder="Product name"
                  />
                ) : (
                  <p className="text-marble-text">
                    {cleanNazwaProduktu(form.nazwaProduktu) || "Not provided"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-ui-textSecondary mb-1">
                  Treatment Area
                </label>
                {isEditing ? (
                  (() => {
                    const BODY_FORM_TYPES = ["LASER_HAIR_REMOVAL", "LASER_TATTOO_REMOVAL"];
                    const isBodyForm = BODY_FORM_TYPES.includes(form.type);
                    const isPMU = form.type === "PERMANENT_MAKEUP";
                    const isTissue = form.type === "TISSUE_STIMULATION";

                    const availableZones = isBodyForm
                      ? (form.type === "LASER_TATTOO_REMOVAL" ? TATTOO_BODY_ZONES : BODY_ZONES)
                      : isPMU
                        ? PMU_ZONES
                        : isTissue
                          ? TISSUE_ZONES
                          : ZONES;

                    const selectedZones = (editedForm.obszarZabiegu || "")
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);

                    const toggleZone = (zoneId: string) => {
                      const newSelected = selectedZones.includes(zoneId)
                        ? selectedZones.filter((id) => id !== zoneId)
                        : [...selectedZones, zoneId];
                      setEditedForm({
                        ...editedForm,
                        obszarZabiegu: newSelected.join(", "),
                      });
                    };

                    return (
                      <div className="flex flex-wrap gap-2">
                        {availableZones.map((zone) => (
                          <button
                            key={zone.id}
                            type="button"
                            onClick={() => toggleZone(zone.id)}
                            className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                              selectedZones.includes(zone.id)
                                ? "bg-brand text-black border-brand font-medium shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                                : "bg-marble-border/40 border-brand/20 text-marble-text hover:border-brand hover:text-brand"
                            }`}
                          >
                            {zone.name}
                          </button>
                        ))}
                        {selectedZones.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditedForm({ ...editedForm, obszarZabiegu: "" })
                            }
                            className="px-3 py-2 rounded-lg text-sm transition-all border border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-marble-text">
                    {translateZones(form.obszarZabiegu)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-ui-textSecondary mb-2">
                  Practitioner
                </label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Malwa Zięba- owner",
                      "Żaneta Baran- cosmetologist",
                      "Julia Dudzińska- cosmetologist",
                      "Weronika Kopeć- lash stylist",
                    ].map((person) => (
                      <button
                        key={person}
                        type="button"
                        onClick={() =>
                          setEditedForm({
                            ...editedForm,
                            osobaPrzeprowadzajacaZabieg: person,
                          })
                        }
                        className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                          editedForm.osobaPrzeprowadzajacaZabieg === person
                            ? "bg-brand text-black border-brand font-medium shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                            : "bg-marble-border/40 border-brand/20 text-marble-text hover:border-brand hover:text-brand"
                        }`}
                      >
                        {person}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-marble-text text-lg font-medium">
                    {form.osobaPrzeprowadzajacaZabieg || "Not assigned"}
                  </p>
                )}
              </div>

              {/* Visual Zone Selector for Admin - Face or Body depending on form type */}
              {(() => {
                const BODY_FORM_TYPES = [
                  "LASER_HAIR_REMOVAL",
                  "LASER_TATTOO_REMOVAL",
                ];
                const isBodyForm = BODY_FORM_TYPES.includes(form.type);
                const isPMU = form.type === "PERMANENT_MAKEUP";
                const isTissue = form.type === "TISSUE_STIMULATION";
                const currentZones = isEditing
                  ? (editedForm.obszarZabiegu || "").split(",").map((s) => s.trim()).filter(Boolean)
                  : form.obszarZabiegu
                    ? form.obszarZabiegu.split(",").map((s) => s.trim())
                    : [];
                return (
                  <div className="mt-4 border-t border-brand/20 pt-4">
                    <label className="block text-sm font-medium text-ui-textSecondary mb-4">
                      Treatment Area Visualization
                    </label>
                    <div className={`bg-marble-border/20 rounded-xl border border-brand/15 p-6 flex justify-center ${isEditing ? "" : "pointer-events-none"}`}>
                      <div
                        className={`w-full max-w-lg ${isBodyForm ? "aspect-[724/1024]" : "aspect-square"} relative`}
                      >
                        {isBodyForm ? (
                          <AnatomyBodySelector
                            initialSelected={currentZones}
                            onSelect={isEditing ? (selectedIds) => {
                              setEditedForm({
                                ...editedForm,
                                obszarZabiegu: selectedIds.join(", "),
                              });
                            } : undefined}
                          />
                        ) : (
                          <AnatomyFaceSelector
                            initialSelected={currentZones}
                            customZones={isPMU ? PMU_ZONES : isTissue ? TISSUE_ZONES : undefined}
                            onSelect={isEditing ? (selectedIds) => {
                              setEditedForm({
                                ...editedForm,
                                obszarZabiegu: selectedIds.join(", "),
                              });
                            } : undefined}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Seria Zabiegowa (Tylko dla Stymulacji Tkankowej / Wolumetrii) */}
              {(form.type === "FACIAL_VOLUMETRY" ||
                form.type === "TISSUE_STIMULATION") && (
                <div className="mt-4 border-t border-brand/20 pt-4">
                  <label className="block text-sm font-medium text-ui-textSecondary mb-4">
                    Treatment Series
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-ui-textSecondary mb-1">
                        Number of treatments
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedForm.planowanaIloscZabiegow || ""}
                          onChange={(e) =>
                            setEditedForm({
                              ...editedForm,
                              planowanaIloscZabiegow: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-marble-border/40 border border-brand/20 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text text-sm"
                          placeholder="Np. 3"
                        />
                      ) : (
                        <p className="text-marble-text">
                          {form.planowanaIloscZabiegow || "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-ui-textSecondary mb-1">
                        Interval (second treatment)
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedForm.odstepMiedzyZabiegami || ""}
                          onChange={(e) =>
                            setEditedForm({
                              ...editedForm,
                              odstepMiedzyZabiegami: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-marble-border/40 border border-brand/20 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text text-sm"
                          placeholder="Np. 4 tygodnie"
                        />
                      ) : (
                        <p className="text-marble-text">
                          {form.odstepMiedzyZabiegami || "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-ui-textSecondary mb-1">
                        Next session interval
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedForm.kolejneZabiegiOdstepy || ""}
                          onChange={(e) =>
                            setEditedForm({
                              ...editedForm,
                              kolejneZabiegiOdstepy: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-marble-border/40 border border-brand/20 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text text-sm"
                          placeholder="e.g. 6 months"
                        />
                      ) : (
                        <p className="text-marble-text">
                          {form.kolejneZabiegiOdstepy || "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-ui-textSecondary mb-1">
                        Amount of product (ml)
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedForm.iloscProduktu || ""}
                          onChange={(e) =>
                            setEditedForm({
                              ...editedForm,
                              iloscProduktu: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-marble-border/40 border border-brand/20 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text text-sm"
                          placeholder="e.g. 1.5 ml"
                        />
                      ) : (
                        <p className="text-marble-text">
                          {form.iloscProduktu || "-"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-ui-textSecondary mb-1">
                  Goal / Effect
                </label>
                {isEditing ? (
                  <textarea
                    value={editedForm.celEfektu || ""}
                    onChange={(e) =>
                      setEditedForm({
                        ...editedForm,
                        celEfektu: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-marble-border/40 border border-brand/20 rounded-lg focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-marble-text resize-none h-20"
                    placeholder="Describe the expected effect..."
                  />
                ) : (
                  <p className="text-marble-text">
                    {form.celEfektu || "Not provided"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-ui-textSecondary mb-1">
                  Additional Notes
                </label>

                {/* Logic to separate history/meds from notes */}
                {(() => {
                  const rawNotes = form.informacjaDodatkowa || "";
                  const lines = rawNotes.split("\n");
                  const historyInfo: string[] = [];
                  const medications: string[] = [];
                  const otherNotes: string[] = [];

                  lines.forEach((line) => {
                    const trimmed = line.trim();
                    if (!trimmed) return;

                    if (
                      trimmed.startsWith("Usta modelowane") ||
                      trimmed.startsWith("Zabieg wykonywany")
                    ) {
                      historyInfo.push(trimmed);
                    } else if (trimmed.startsWith("Leki (6 m-cy):")) {
                      medications.push(trimmed);
                    } else {
                      otherNotes.push(trimmed);
                    }
                  });

                  return (
                    <div className="space-y-4">
                      {/* 1. History Section */}
                      {historyInfo.length > 0 && (
                        <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            Treatment History (from interview)
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {historyInfo.map((info, i) => (
                              <li
                                key={i}
                                className="text-sm text-blue-100 font-medium"
                              >
                                {info}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 2. Medications Section */}
                      {medications.length > 0 && (
                        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <User className="w-3 h-3" />
                            Medications Taken (last 6 months)
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {medications.map((med, i) => (
                              <li
                                key={i}
                                className="text-sm text-red-100 font-medium"
                              >
                                {med.replace("Leki (6 m-cy):", "").trim() ||
                                  "BRAK"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 3. General Notes */}
                      <div className="bg-marble-border/20 p-3 rounded-lg border border-brand/15 min-h-[60px]">
                        {otherNotes.length > 0 ? (
                          <div className="text-marble-text text-sm whitespace-pre-line">
                            {otherNotes.join("\n")}
                          </div>
                        ) : (
                          <p className="text-ui-textSecondary text-sm italic">
                            No additional notes.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Contraindications */}
        {activeTab === "contraindications" && (
          <div className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg p-4 md:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300 border border-brand/15">
            <h2 className="text-xl font-serif text-marble-text mb-4 pb-3 border-b border-brand/20">
              Contraindications
            </h2>
            <div className="space-y-2">
              {Object.entries(form.przeciwwskazania).map(([key, value]) => {
                const labels =
                  contraindicationsByFormType[form.type as FormType] ||
                  contraindicationsByFormType["LIP_AUGMENTATION"];
                const label = labels[key] || key;
                const currentValue =
                  editedForm.przeciwwskazania?.[key] ?? value;

                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 py-2 border-b border-brand/10 last:border-0"
                  >
                    {isEditing ? (
                      <div className="flex gap-1 flex-shrink-0">
                        {/* Edycja jest uproszczona - tylko bool, dla tekstowych trzeba by dodać input */}
                        <button
                          type="button"
                          onClick={() =>
                            setEditedForm({
                              ...editedForm,
                              przeciwwskazania: {
                                ...editedForm.przeciwwskazania,
                                [key]: true,
                              },
                            })
                          }
                          className={`min-w-[40px] text-center px-2 py-1 text-xs rounded font-medium transition-colors ${
                            currentValue === true ||
                            typeof currentValue === "string"
                              ? "bg-red-500 text-white"
                              : "bg-red-100 text-red-600 hover:bg-red-200"
                          }`}
                        >
                          YES
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditedForm({
                              ...editedForm,
                              przeciwwskazania: {
                                ...editedForm.przeciwwskazania,
                                [key]: false,
                              },
                            })
                          }
                          className={`min-w-[40px] text-center px-2 py-1 text-xs rounded font-medium transition-colors ${
                            currentValue === false
                              ? "bg-green-500 text-white"
                              : "bg-green-100 text-green-600 hover:bg-green-200"
                          }`}
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <>
                        {typeof value === "string" ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="min-w-[44px] text-center px-2 py-1 bg-red-100 text-red-600 text-xs rounded font-medium flex-shrink-0">
                              YES
                            </span>
                            <span className="text-xs text-brand font-medium italic">
                              "{value}"
                            </span>
                          </div>
                        ) : value === true ? (
                          <span className="min-w-[44px] text-center px-2 py-1 bg-red-100 text-red-600 text-xs rounded font-medium flex-shrink-0">
                            YES
                          </span>
                        ) : value === false ? (
                          <span className="min-w-[44px] text-center px-2 py-1 bg-green-100 text-green-600 text-xs rounded font-medium flex-shrink-0">
                            NO
                          </span>
                        ) : (
                          <span className="min-w-[44px] text-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded font-medium flex-shrink-0">
                            -
                          </span>
                        )}
                      </>
                    )}
                    <span className="text-sm text-marble-text">
                      {typeof label === "string" ? label : label.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content: Consents & Signatures (New Card Style) */}
        {activeTab === "consents" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* RODO / Główne */}
            <div className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg border border-brand/15 p-6">
              <div className="flex justify-between items-center mb-4 border-b border-brand/20 pb-2 text-marble-text font-serif">
                GDPR Consent
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${form.podpisRodo ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
                >
                  {form.podpisRodo ? "CONSENT GIVEN" : "NO CONSENT/SIGNATURE"}
                </span>
              </div>
              <div className="flex items-start gap-4 mb-4">
                {form.zgodaPrzetwarzanieDanych ? (
                  <Check className="w-5 h-5 text-green-400 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-red-400 mt-0.5" />
                )}
                <p className="text-sm text-ui-textSecondary">
                  Confirmation: Informed consent for the procedure and data
                  processing for the purpose of service delivery.
                </p>
              </div>

              {form.podpisRodo ? (
                <div className="p-4 rounded-xl bg-marble-border/30 border border-brand/10">
                  <p className="text-xs text-ui-textSecondary uppercase tracking-wider mb-2 font-medium">
                    GDPR Signature
                  </p>
                  <img
                    src={form.podpisRodo}
                    alt="Podpis RODO"
                    className="h-40 max-w-full object-contain mx-auto md:mx-0 "
                  />
                  {form.miejscowoscData && (
                    <p className="text-xs text-ui-textSecondary mt-2 text-center md:text-left">
                      Signed:{" "}
                      <span className="text-brand font-medium">
                        {form.miejscowoscData}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-400 text-sm italic">
                  No main signature.
                </div>
              )}
            </div>

            {/* RODO Clause (Section 2) */}
            <div className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg border border-brand/15 p-6">
              <div className="flex justify-between items-center mb-4 border-b border-brand/20 pb-2 text-marble-text font-serif">
                GDPR Information Clause
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                    (form as any).podpisRodo2
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {(form as any).podpisRodo2 ? "CONSENT GIVEN" : "NO SIGNATURE"}
                </span>
              </div>
              <p className="text-sm text-ui-textSecondary mb-4">
                Acknowledgment: Familiarization with the GDPR information
                clause.
              </p>
              {(form as any).podpisRodo2 ? (
                <div className="p-4 rounded-xl bg-marble-border/30 border border-brand/10">
                  <p className="text-xs text-ui-textSecondary uppercase tracking-wider mb-2 font-medium">
                    GDPR Signature (Clause)
                  </p>
                  <img
                    src={(form as any).podpisRodo2}
                    alt="Podpis RODO 2"
                    className="h-40 max-w-full object-contain mx-auto md:mx-0 "
                  />
                  {form.miejscowoscData && (
                    <p className="text-xs text-ui-textSecondary mt-2 text-center md:text-left">
                      Signed:{" "}
                      <span className="text-brand font-medium">
                        {form.miejscowoscData}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-400 text-sm italic">
                  No clause signature.
                </div>
              )}
            </div>

            {/* Marketing */}
            <div className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg border border-brand/15 p-6">
              <div className="flex justify-between items-center mb-4 border-b border-brand/20 pb-2">
                <h3 className="text-lg font-serif text-marble-text">
                  Marketing Consent
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${form.zgodaMarketing ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-ui-bg text-ui-textSecondary border border-brand/20"}`}
                >
                  {form.zgodaMarketing ? "CONSENT GIVEN" : "NO CONSENT"}
                </span>
              </div>
              <p className="text-sm text-ui-textSecondary mb-4">
                Consent to receive information about news and promotions
                (SMS/Email).
              </p>
              {form.zgodaMarketing && form.podpisMarketing ? (
                <div className="p-4 rounded-xl bg-marble-border/30 border border-brand/10">
                  <p className="text-xs text-ui-textSecondary uppercase tracking-wider mb-2 font-medium">
                    Marketing Signature
                  </p>
                  <img
                    src={form.podpisMarketing}
                    alt="Podpis Marketing"
                    className="h-40 max-w-full object-contain mx-auto md:mx-0 "
                  />
                  {form.miejscowoscData && (
                    <p className="text-xs text-ui-textSecondary mt-2 text-center md:text-left">
                      Signed:{" "}
                      <span className="text-brand font-medium">
                        {form.miejscowoscData}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ui-textSecondary italic">
                  Client did not give consent.
                </p>
              )}
            </div>

            {/* Wizerunek */}
            <div className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg border border-brand/15 p-6">
              <div className="flex justify-between items-center mb-4 border-b border-brand/20 pb-2">
                <h3 className="text-lg font-serif text-marble-text">
                  Photo / Image Consent
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${form.zgodaFotografie ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-ui-bg text-ui-textSecondary border border-brand/20"}`}
                >
                  {form.zgodaFotografie ? "CONSENT GIVEN" : "NO CONSENT"}
                </span>
              </div>
              <p className="text-sm text-ui-textSecondary mb-2">
                Consent for publication of photos/videos from the procedure.
              </p>
              {form.miejscaPublikacjiFotografii && (
                <p className="text-sm text-marble-text mb-4 font-medium">
                  Publication restrictions:{" "}
                  <span className="text-brand">
                    {form.miejscaPublikacjiFotografii}
                  </span>
                </p>
              )}
              {form.zgodaFotografie && form.podpisFotografie ? (
                <div className="p-4 rounded-xl bg-marble-border/30 border border-brand/10">
                  <p className="text-xs text-ui-textSecondary uppercase tracking-wider mb-2 font-medium">
                    Photo / Image Signature
                  </p>
                  <img
                    src={form.podpisFotografie}
                    alt="Podpis Foto"
                    className="h-40 max-w-full object-contain mx-auto md:mx-0 "
                  />
                  {form.miejscowoscData && (
                    <p className="text-xs text-ui-textSecondary mt-2 text-center md:text-left">
                      Signed:{" "}
                      <span className="text-brand font-medium">
                        {form.miejscowoscData}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ui-textSecondary italic">
                  Client did not give consent.
                </p>
              )}
            </div>

            {/* Zgoda na Zabieg (dawniej Pomoc Prawna) */}
            <div className="bg-gradient-emerald backdrop-blur-sm rounded-2xl shadow-lg border border-brand/15 p-6">
              <div className="flex justify-between items-center mb-4 border-b border-brand/20 pb-2">
                <h3 className="text-lg font-serif text-marble-text">
                  Treatment Consent
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${form.zgodaPomocPrawna ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-ui-bg text-ui-textSecondary border border-brand/20"}`}
                >
                  {form.zgodaPomocPrawna ? "CONSENT GIVEN" : "NO CONSENT"}
                </span>
              </div>
              <p className="text-sm text-ui-textSecondary mb-4">
                Confirmation: Informed consent to undergo the procedure after
                familiarizing with the information and risks.
              </p>
              {form.zgodaPomocPrawna && form.podpisDane ? (
                <div className="p-4 rounded-xl bg-marble-border/30 border border-brand/10">
                  <p className="text-xs text-ui-textSecondary uppercase tracking-wider mb-2 font-medium">
                    Client Signature
                  </p>
                  <img
                    src={form.podpisDane}
                    alt="Podpis Zabieg"
                    className="h-40 max-w-full object-contain mx-auto md:mx-0 "
                  />
                  {form.miejscowoscData && (
                    <p className="text-xs text-ui-textSecondary mt-2 text-center md:text-left">
                      Signed:{" "}
                      <span className="text-brand font-medium">
                        {form.miejscowoscData}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ui-textSecondary italic">
                  Client did not give consent.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
