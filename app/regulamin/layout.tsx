import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service of PowderBrows Academy salon. Appointment booking rules, contraindications for permanent makeup procedures, payment and complaints information.",
  alternates: {
    canonical: "https://powderbrowsacademy.com/regulamin",
  },
  openGraph: {
    title: "Terms of Service | PowderBrows Academy Dublin",
    description:
      "Terms of Service of PowderBrows Academy salon - rules for using permanent makeup services.",
    url: "https://powderbrowsacademy.com/regulamin",
  },
};

export default function RegulaminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
