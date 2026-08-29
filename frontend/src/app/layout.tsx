import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { EmergencyBanner } from "@/components/EmergencyBanner";

export const metadata: Metadata = {
  title: "TriageFlow | Mission-Critical AI Emergency Patient Triage",
  description: "Production-oriented full-stack AI emergency department triage co-pilot with deterministic red-flag safety rules.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-100/60 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <EmergencyBanner />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <p className="font-semibold text-slate-700">TriageFlow AI &bull; Production Healthcare Decision-Support Platform</p>
            <p>Clinical decision-support only. Not a diagnostic device. Licensed clinician confirmation required.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
