import type { Metadata } from "next";
import { AppNav } from "@/components/layout/AppNav";
import { IBM_Plex_Sans, Rajdhani } from "next/font/google";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const heading = Rajdhani({
  variable: "--font-raj",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Operational Production Monitoring",
  description: "Monitoring aktivitas mesin berbasis arus 3 phase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${heading.variable} h-full`}>
      <body className="min-h-full bg-[var(--color-bg)] font-sans text-slate-900 antialiased">
        <div className="mx-auto max-w-[1900px] px-4 py-5 md:px-6">
          <AppNav />
        </div>
        {children}
      </body>
    </html>
  );
}
