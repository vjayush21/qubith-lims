import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuBith LIMS — Lab Management for Tier 2/3 Pathology Labs in India",
  description:
    "Patient booking, barcode tracking, branded PDF reports, WhatsApp sharing, GST billing. Built for solo and small pathology labs. DPDP compliant. Data hosted in India.",
  keywords: [
    "LIMS India",
    "pathology lab software",
    "lab management",
    "tier 2 city labs",
    "pathology software",
    "medical lab software India",
  ],
  openGraph: {
    title: "QuBith LIMS",
    description: "Modern LIMS for Indian pathology labs. Patient booking, barcode, WhatsApp, GST.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
