"use client";

import Link from "next/link";
import { SALON_CONFIG } from "@/app/config/salon";
import BackButton from "@/app/components/BackButton";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function RegulaminPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-emerald backdrop-blur-sm border-b border-brand/20 shadow-marble">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl md:text-3xl font-serif font-light text-marble-text tracking-widest">
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
          <h1 className="text-4xl md:text-5xl font-serif font-light text-marble-text mb-2 tracking-wider uppercase">
            TERMS OF SERVICE
          </h1>
          <p className="text-lg text-brand font-light tracking-wide uppercase">
            Service Provision
          </p>
          <p className="text-sm text-marble-textSecondary font-light mt-2 italic">
            {SALON_CONFIG.name} – {SALON_CONFIG.owner}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-emerald backdrop-blur-sm p-8 md:p-12 space-y-10 rounded-2xl shadow-marble-lg border border-brand/20">
            {/* §1 */}
            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §1. General Provisions
              </h2>
              <div className="text-ui-textSecondary font-light leading-relaxed space-y-3">
                <p>
                  These Terms of Service define the rules for using the cosmetic
                  and permanent makeup services provided by
                  {SALON_CONFIG.name} – {SALON_CONFIG.owner}, with its
                  registered office at {SALON_CONFIG.address}, Tax ID (NIP):{" "}
                  {SALON_CONFIG.nip} (hereinafter referred to as the “Salon”).
                </p>
                <p>
                  Any adult may become a client of the Salon. Minors may use the
                  services only with the written consent of a parent or legal
                  guardian.
                </p>
                <p>
                  Proceeding with a procedure is equivalent to accepting the
                  provisions of these Terms of Service.
                </p>
                <p>
                  Service prices listed in the price list (on the website or in
                  the Salon) are gross prices and are expressed in Polish zloty.
                </p>
              </div>
            </div>

            {/* §2 */}
            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §2. Appointment Booking and Payments
              </h2>
              <div className="text-ui-textSecondary font-light leading-relaxed space-y-3">
                <p>Appointments can be booked:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>by phone,</li>
                  <li>via social media (Facebook/Instagram),</li>
                  <li>in person at the Salon.</li>
                </ul>
                <p>
                  Booking an appointment for a permanent makeup procedure
                  requires a deposit of{" "}
                  <strong>50% of the procedure price</strong>.
                </p>
                <p>
                  The deposit must be paid within <strong>3 days</strong> of the
                  initial booking. Failure to pay within this period results in
                  automatic cancellation of the reservation.
                </p>
                <p>Payment can be made by bank transfer to:</p>
                <div className="bg-marble-border/20 p-4 rounded-xl border border-brand/20 my-2 shadow-inner">
                  <p className="font-medium text-marble-text">
                    {SALON_CONFIG.accountNumber}
                  </p>
                  <p className="text-sm mt-1">
                    Transfer title: Procedure date and Client's first and last
                    name.
                  </p>
                </div>
                <p>
                  On the day of the procedure, the service price is reduced by
                  the deposit amount. The remaining balance is paid on-site by
                  cash or card.
                </p>
              </div>
            </div>

            {/* §3 */}
            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §3. Cancellation and Rescheduling
              </h2>
              <div className="text-ui-textSecondary font-light leading-relaxed space-y-3">
                <p>
                  The client may reschedule their appointment free of charge no
                  later than <strong>3 days</strong> before the scheduled
                  procedure. In such a case, the deposit carries over to the new
                  date.
                </p>
                <p>
                  If an appointment is cancelled or rescheduled less than 3 days
                  before the procedure, the deposit is forfeited (in accordance
                  with Art. 394 of the Civil Code as compensation for lost
                  working time).
                </p>
                <p>
                  Exceptions are made for unforeseen events and sudden illness,
                  confirmed by an appropriate document (e.g. a sick note), which
                  must be reported immediately. In such cases, the Salon may
                  agree to transfer the deposit to another date.
                </p>
                <p>
                  In the event of a no-show without prior notice, the deposit is
                  forfeited in full. The Salon also reserves the right to refuse
                  future bookings from such a client or to require 100%
                  prepayment for the service.
                </p>
                <p>
                  A client arriving more than 15 minutes late may have their
                  procedure shortened or may be required to reschedule (which
                  may result in forfeiture of the deposit if there is
                  insufficient time to complete the full service).
                </p>
              </div>
            </div>

            {/* §4 */}
            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §4. Contraindications and Procedure Eligibility
              </h2>
              <div className="text-ui-textSecondary font-light leading-relaxed space-y-3">
                <p>
                  Before the procedure, the client is required to complete a
                  Client Card and health questionnaire. Concealing information
                  about health conditions (contraindications) releases the Salon
                  from liability for any complications.
                </p>
                <p>Absolute contraindications include, among others:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>pregnancy, breastfeeding,</li>
                  <li>active cold sores (herpes),</li>
                  <li>cancer (without a doctor's approval),</li>
                  <li>unstabilised diabetes,</li>
                  <li>psoriasis in the treatment area,</li>
                  <li>use of blood-thinning medications.</li>
                </ul>
                <p>
                  Clients with existing permanent makeup (done at another salon)
                  are required to disclose this when booking. The Salon reserves
                  the right to refuse corrective pigmentation or to refer the
                  client for laser removal (at an additional charge).
                </p>
                <p>
                  Corrections of makeup done at other salons are treated as a
                  new procedure and are subject to individual pricing.
                </p>
              </div>
            </div>

            {/* §5 */}
            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §5. Procedure Process and Results (Guarantee)
              </h2>
              <div className="text-ui-textSecondary font-light leading-relaxed space-y-3">
                <p>
                  Every procedure is preceded by a free consultation, during
                  which the method and colour are selected and a preliminary
                  design (visualisation) is created.
                </p>
                <p>
                  The PMU artist reserves the right to refuse the procedure if
                  the client's expectations regarding shape or colour are
                  inconsistent with aesthetics, facial anatomy, or PMU artistry
                  principles.
                </p>
                <p>
                  If the client does not accept the proposed shape and decides
                  to cancel the procedure on the day of the appointment, the
                  deposit covers the cost of the consultation and the time
                  reserved for the specialist and is non-refundable.
                </p>
                <p>
                  The procedure result is individual and depends on skin type,
                  age, and adherence to aftercare recommendations. The Salon
                  does not guarantee the longevity of the makeup (it is not
                  possible to predict the exact duration of pigment retention in
                  the skin).
                </p>
              </div>
            </div>

            {/* §6 */}
            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §6. Touch-up (Re-pigmentation)
              </h2>
              <div className="text-ui-textSecondary font-light leading-relaxed space-y-3">
                <p>
                  The first touch-up (complementary) is included in the price of
                  the basic procedure (unless otherwise stated in the price
                  list) and should be performed between{" "}
                  <strong>4 and 8 weeks</strong> after the first procedure.
                </p>
                <p>
                  If the client does not attend the touch-up within the
                  scheduled timeframe (up to 8 weeks) or cancels it less than 24
                  hours before the appointment, the touch-up is forfeited.
                  Re-pigmentation at a later date is charged additionally (each
                  month of delay carries an extra charge of 100 PLN or according
                  to current pricing).
                </p>
                <p>
                  For clients permanently residing abroad, the free touch-up
                  window may be extended to 3 months, provided this is
                  communicated during the first procedure.
                </p>
                <div className="bg-marble-border/20 p-4 rounded-xl border border-brand/20 my-2 shadow-inner">
                  <p className="font-medium text-marble-text mb-2">
                    Annual Makeup Refresh:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>
                      Up to 1.5 years after the procedure: 50% of the current
                      price list price.
                    </li>
                    <li>
                      Over 2 years: 100% of the price (treated as a new
                      procedure).
                    </li>
                  </ul>
                </div>
                <p>
                  In the event of pregnancy discovered after the first
                  procedure, the client may have their touch-up performed after
                  delivery/breastfeeding (e.g. after a year) at 50% of the
                  current price.
                </p>
              </div>
            </div>

            {/* §7 */}
            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §7. Complaints
              </h2>
              <div className="text-ui-textSecondary font-light leading-relaxed space-y-3">
                <p>
                  The client has the right to submit a complaint in the event of
                  dissatisfaction with the service.
                </p>
                <p>
                  Complaints must be submitted in writing to:{" "}
                  <strong>{SALON_CONFIG.email}</strong> within{" "}
                  <strong>14 days</strong> of the service being performed. The
                  submission should include a description of the issue and
                  photographic documentation.
                </p>
                <p>
                  Any corrections under a complaint (if justified by technical
                  errors) are performed free of charge within 2 months of the
                  procedure. Any concerns raised after 2 months will be treated
                  as new, paid orders.
                </p>
              </div>
            </div>

            {/* §8 */}
            <div>
              <h2 className="text-xl font-serif font-light text-brand mb-4 tracking-wider uppercase">
                §8. Final Provisions
              </h2>
              <div className="text-ui-textSecondary font-light leading-relaxed space-y-3">
                <p>
                  The Salon reserves the right to change its price list and
                  opening hours. Changes do not apply to bookings for which a
                  deposit has already been paid (the price at the time of
                  booking applies, unless more than 6 months have elapsed).
                </p>
                <p>
                  Matters not governed by these Terms of Service are subject to
                  the provisions of the Civil Code.
                </p>
                <p>
                  These Terms of Service come into force on the date of
                  publication.
                </p>
              </div>
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
