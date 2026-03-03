"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SALON_CONFIG } from "@/app/config/salon";
import BackButton from "@/app/components/BackButton";
import { useRouter } from "next/navigation";

export default function PolitykaPrywatnosciPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-emerald backdrop-blur-sm border-b border-brand/20 shadow-marble">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl md:text-3xl font-serif font-light text-marble-text tracking-widest uppercase">
                {SALON_CONFIG.name}
              </h1>
            </Link>
            <BackButton onClick={() => router.push("/")} />
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-40 pb-12 px-4 border-b border-marble-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-light text-marble-text mb-4 tracking-wider uppercase">
            PRIVACY POLICY
          </h1>
          <p className="text-sm text-marble-textSecondary font-light italic">
            Last updated: January 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-emerald backdrop-blur-sm p-8 md:p-12 space-y-8 rounded-2xl shadow-marble-lg border border-brand/20">
            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §1. Data Controller
              </h2>
              <p className="text-ui-textSecondary font-light leading-relaxed">
                The data controller of your personal data is {SALON_CONFIG.name}{" "}
                - {SALON_CONFIG.owner}, with its registered office at{" "}
                {SALON_CONFIG.address}, Tax ID (NIP): {SALON_CONFIG.nip}. The
                controller can be contacted by email: {SALON_CONFIG.email} or by
                phone: {SALON_CONFIG.phone}.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §2. Purposes of Data Processing
              </h2>
              <p className="text-ui-textSecondary font-light leading-relaxed mb-4">
                We process your personal data for the following purposes:
              </p>
              <ul className="list-disc list-inside text-ui-textSecondary font-light space-y-2 ml-4">
                <li>Processing reservations and scheduling appointments</li>
                <li>Contacting you regarding appointment confirmation</li>
                <li>Conducting a health interview before the procedure</li>
                <li>Sending marketing communications (with consent)</li>
                <li>Maintaining procedure documentation</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §3. Scope of Data Processed
              </h2>
              <p className="text-ui-textSecondary font-light leading-relaxed mb-4">
                To provide our services, we process the following categories of
                data:
              </p>
              <ul className="list-disc list-inside text-ui-textSecondary font-light space-y-2 ml-4">
                <li>
                  Identification data (first name, last name, date of birth)
                </li>
                <li>
                  Contact data (home address, phone number, email address)
                </li>
                <li>
                  Health data (information about allergies, diseases,
                  medications taken, previous procedures – so-called special
                  category data, necessary for the safe performance of the
                  service)
                </li>
                <li>Likeness (photos documenting procedure results)</li>
                <li>Transaction data (payment history)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §4. Legal Basis
              </h2>
              <p className="text-ui-textSecondary font-light leading-relaxed">
                Data processing is carried out on the basis of: your consent
                (Art. 6(1)(a) GDPR), performance of a contract (Art. 6(1)(b)
                GDPR), compliance with a legal obligation (Art. 6(1)(c) GDPR)
                and the legitimate interests of the controller (Art. 6 (1)(f)
                GDPR).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §5. Retention Period
              </h2>
              <p className="text-ui-textSecondary font-light leading-relaxed">
                We store personal data for the period necessary to fulfil the
                purposes for which they were collected, and subsequently for the
                period required by law (medical records – 20 years, accounting
                records – 5 years).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §6. Your Rights
              </h2>
              <p className="text-ui-textSecondary font-light leading-relaxed mb-4">
                You have the following rights:
              </p>
              <ul className="list-disc list-inside text-ui-textSecondary font-light space-y-2 ml-4">
                <li>Right of access to your data</li>
                <li>Right to rectification of data</li>
                <li>Right to erasure of data ("right to be forgotten")</li>
                <li>Right to restriction of processing</li>
                <li>Right to data portability</li>
                <li>Right to object</li>
                <li>Right to withdraw consent at any time</li>
                <li>
                  Right to lodge a complaint with a supervisory authority (UODO)
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §7. Data Recipients
              </h2>
              <p className="text-ui-textSecondary font-light leading-relaxed">
                Your data may be shared with entities providing services on
                behalf of the controller: hosting provider, booking system
                provider, email service provider. Data is not transferred to
                third countries.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §8. Cookies
              </h2>
              <p className="text-ui-textSecondary font-light leading-relaxed">
                The website uses cookies to ensure proper functioning, traffic
                analysis, and content personalisation. You can manage cookie
                settings in your browser.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §9. Contact
              </h2>
              <p className="text-ui-textSecondary font-light leading-relaxed">
                For matters related to personal data protection, you can contact
                us at: {SALON_CONFIG.email} or by phone: {SALON_CONFIG.phone}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-emerald text-marble-text py-16 border-t border-brand/20 shadow-marble">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <span className="text-xl font-serif font-light tracking-widest uppercase">
                {SALON_CONFIG.name}
              </span>
              <p className="text-xs text-ui-textSecondary mt-3 font-light tracking-wider uppercase">
                Professional permanent makeup
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-ui-textSecondary font-light tracking-wider italic">
                © {new Date().getFullYear()} {SALON_CONFIG.name}. All rights
                reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
