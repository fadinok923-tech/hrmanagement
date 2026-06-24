import type { Metadata } from "next";
import { Cairo, Geist } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/language-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tanoor Al Jazeera — HR System | نظام الموارد البشرية",
  description:
    "Bilingual Saudi-compliant HR management system for Tanoor Al Jazeera Industrial Factory. Employees, attendance, payroll, documents, recruitment and KPI modules.",
  authors: [{ name: "Tanoor Al Jazeera" }],
  keywords: [
    "HR",
    "Tanoor Al Jazeera",
    "Saudi HR",
    "Iqama",
    "Absher",
    "MODON",
    "Qiwa",
    "Mudad",
    "نظام الموارد البشرية",
  ],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${cairo.variable} font-sans antialiased bg-background text-foreground`}
      >
        <LanguageProvider>{children}</LanguageProvider>
        <SonnerToaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
