import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy of PowderBrows Academy. Learn how we process your personal data, what rights you have, and how we protect your privacy.",
  alternates: {
    canonical: "https://powderbrowsacademy.com/polityka-prywatnosci",
  },
  openGraph: {
    title: "Privacy Policy | PowderBrows Academy Dublin",
    description:
      "Privacy Policy of PowderBrows Academy - a permanent makeup salon in Dublin.",
    url: "https://powderbrowsacademy.com/polityka-prywatnosci",
  },
};

export default function PolitykaPrywatnosciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
