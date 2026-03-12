/**
 * Wysyłka emaila z kartą zgody jako załącznikiem PDF
 * Używa Resend (https://resend.com)
 *
 * Od: noreply@powderbrowsacademy.com.pl (lub sandbox jeśli domena niezweryfikowana)
 * To: client (if email provided) + admins
 */
import { Resend } from "resend";

// Adres admina / salonu — zawsze dostaje kopię
const SALON_EMAIL = process.env.SALON_EMAIL || "contact@powderbrowsacademy.com";
const SALON_NAME = "Powder Brows Academy";

// Adres nadawcy — musi być zweryfikowaną domeną w Resend
// Na start użyj onboarding@resend.dev jeśli domena nie jest zweryfikowana
const FROM_EMAIL = "form@powderbrowsacademy.com";
const FROM_DISPLAY = `${SALON_NAME} <${FROM_EMAIL}>`;

interface SendConsentEmailOptions {
  formId: string;
  clientName: string;
  clientEmail?: string | null;
  formTypeLabel: string;
  formDate: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}

function getFormTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LIP_AUGMENTATION: "Lip Modeling",
    FACIAL_VOLUMETRY: "Facial Volumetry",
    WRINKLE_REDUCTION: "Wrinkle Reduction",
    NEEDLE_MESOTHERAPY: "Needle Mesotherapy",
    INJECTION_LIPOLYSIS: "Injection Lipolysis",
    TISSUE_STIMULATION: "Tissue Stimulation",
    PERMANENT_MAKEUP: "Permanent Makeup",
    LASER_HAIR_REMOVAL: "Laser Hair Removal",
    LASER_TATTOO_REMOVAL: "Laser Tattoo Removal",
    EYEBROW_TINTING: "Eyebrow Tinting",
    EYEBROW_LAMINATION: "Eyebrow Lamination",
    EYELASH_EXTENSION: "Eyelash Extension",
    EYELID_LIFT: "Eyelid Lift",
    FACIAL_CLEANSING: "Facial Cleansing",
    HYALURONIC: "Hyaluronic Acid",
    PMU: "Permanent Makeup",
    LASER: "Laser",
  };
  return labels[type] || type;
}

// ─── Email to client ─────────────────────────────────────────────────────
function clientEmailHtml(clientName: string, formType: string, formDate: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consent Form Confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF8F5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color:#4A4038;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #D4AF37; box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(45deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C); padding:32px 40px; text-align:center;">
              <h1 style="margin:0; color:#2D2520; font-size:24px; font-weight:600; letter-spacing:2px; text-transform:uppercase;">
                ${SALON_NAME}
              </h1>
              <p style="margin:6px 0 0; color:#4A4038; font-size:13px; font-weight:500;">Treatment Documentation</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="color:#2D2520; font-size:20px; font-weight:500; margin:0 0 16px;">
                Dear ${clientName},
              </h2>
              <p style="color:#5A4F44; line-height:1.7; margin:0 0 16px;">
                Thank you for filling out the consent form for the 
                <strong style="color:#B5952F;">${formType}</strong>
                treatment on <strong>${formDate}</strong>.
              </p>
              <p style="color:#5A4F44; line-height:1.7; margin:0 0 24px;">
                Attached is your signed consent form in PDF format. 
                Please keep it for your records. This document confirms your
                informed consent for the procedure and contains all
                important information regarding the procedure and post-treatment recommendations.
              </p>
              <!-- Divider -->
              <hr style="border:none; border-top:1px solid #D1C9BF; margin:24px 0;">
              
              <div style="background:#F2EDE7; padding:16px; border-radius:8px; border-left:4px solid #D4AF37;">
                <p style="color:#4A4038; font-size:13px; line-height:1.6; margin:0;">
                  Open attachment: <strong style="color:#B5952F;">Consent_form_${clientName.replace(/\s+/g, "_")}.pdf</strong>
                </p>
              </div>

              <p style="color:#7A6E62; font-size:13px; line-height:1.6; margin:24px 0 0;">
                If you have any questions or concerns before the treatment, please contact us.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#FAF8F5; padding:20px 40px; border-top:1px solid #D1C9BF; text-align:center;">
              <p style="color:#7A6E62; font-size:11px; margin:0;">
                ${SALON_NAME} • Automatically generated message
              </p>
              <p style="color:#7A6E62; font-size:11px; margin:4px 0 0;">
                Please do not reply to this email address.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ─── Email do admina ──────────────────────────────────────────────────────
function adminEmailHtml(
  clientName: string,
  formType: string,
  formDate: string,
  formId: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Consent Form</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF8F5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color:#4A4038;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:12px; overflow:hidden; border:1px solid #D4AF37; box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);">
          <tr>
            <td style="padding:24px 30px; border-bottom:1px solid #D1C9BF; background:#FAF8F5;">
              <h2 style="margin:0; color:#2D2520; font-size:16px; text-transform:uppercase; letter-spacing:1px; display:flex; align-items:center;">
                <span style="color:#D4AF37; margin-right:8px;">📋</span> New Consent Form
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 30px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color:#7A6E62; font-size:12px; padding-bottom:6px; width:40%;">Client:</td>
                  <td style="color:#2D2520; font-size:14px; font-weight:600; padding-bottom:6px;">${clientName}</td>
                </tr>
                <tr>
                  <td style="color:#7A6E62; font-size:12px; padding-bottom:6px; padding-top:8px; border-top:1px solid #F2EDE7;">Treatment:</td>
                  <td style="color:#D4AF37; font-size:14px; font-weight:500; padding-bottom:6px; padding-top:8px; border-top:1px solid #F2EDE7;">${formType}</td>
                </tr>
                <tr>
                  <td style="color:#7A6E62; font-size:12px; padding-bottom:6px; padding-top:8px; border-top:1px solid #F2EDE7;">Consent date:</td>
                  <td style="color:#4A4038; font-size:13px; padding-bottom:6px; padding-top:8px; border-top:1px solid #F2EDE7;">${formDate}</td>
                </tr>
                <tr>
                  <td style="color:#7A6E62; font-size:12px; padding-top:8px; border-top:1px solid #F2EDE7;">Form ID:</td>
                  <td style="color:#7A6E62; font-size:11px; font-family:monospace; padding-top:8px; border-top:1px solid #F2EDE7;">${formId}</td>
                </tr>
              </table>
              <div style="margin-top:28px; padding:16px; background:#F2EDE7; border-left:4px solid #D4AF37; border-radius:0 8px 8px 0;">
                <p style="margin:0; color:#4A4038; font-size:13px; line-height:1.6;">
                  Medical interview details and client signature can be found in the attached PDF document.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 30px; background:#FAF8F5; border-top:1px solid #D1C9BF; text-align:center;">
              <p style="margin:0; color:#7A6E62; font-size:11px;">System Administration • ${SALON_NAME}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ─── Główna funkcja wysyłki ───────────────────────────────────────────────
export async function sendConsentFormEmail(
  opts: SendConsentEmailOptions
): Promise<{ success: boolean; error?: string }> {
  const {
    formId,
    clientName,
    clientEmail,
    formTypeLabel,
    formDate,
    pdfBuffer,
    pdfFilename,
  } = opts;

  const pdfAttachment = {
    filename: pdfFilename,
    content: pdfBuffer.toString("base64"),
  };

  // Lazy initialization — Resend wymaga klucza tylko w runtime, nie podczas build
  const apiKey = process.env.SMTP_TOKEN;
  if (!apiKey) {
    console.error("[Resend] Missing SMTP_TOKEN in env — email will not be sent");
    return { success: false, error: "Missing SMTP_TOKEN" };
  }
  const resend = new Resend(apiKey);

  try {
    // 1. Email to client (if provided)
    if (clientEmail) {
      const clientResult = await resend.emails.send({
        from: FROM_DISPLAY,
        to: [clientEmail],
        subject: `Your consent form — ${formTypeLabel} | ${SALON_NAME}`,
        html: clientEmailHtml(clientName, formTypeLabel, formDate),
        attachments: [pdfAttachment],
      });

      if (clientResult.error) {
        console.warn("[Resend] Error sending to client:", clientResult.error);
      } else {
        console.log("[Resend] Email to client sent:", clientResult.data?.id);
      }
    }

    // 2. Copy to admin / salon (always)
    const adminResult = await resend.emails.send({
      from: FROM_DISPLAY,
      to: [SALON_EMAIL],
      subject: `[New consent form] ${clientName} — ${formTypeLabel}`,
      html: adminEmailHtml(clientName, formTypeLabel, formDate, formId),
      attachments: [pdfAttachment],
    });

    if (adminResult.error) {
      console.error("[Resend] Error sending to admin:", adminResult.error);
      return { success: false, error: String(adminResult.error) };
    }

    console.log("[Resend] Email to admin sent:", adminResult.data?.id);
    return { success: true };
  } catch (error) {
    console.error("[Resend] Unexpected error:", error);
    return { success: false, error: String(error) };
  }
}

// Eksport helper do label
export { getFormTypeLabel };
