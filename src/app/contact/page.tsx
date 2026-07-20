import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";
import { ContactMail } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact AI Free Image support.",
};

export default function ContactEn() {
  return (
    <SiteChrome locale="en">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">Contact</span>
        </h1>
        <p className="text-[#a0a0a0] mb-8 text-sm">
          Questions, feedback, or privacy requests—reach out by email.
        </p>

        <div className="glass-card rounded-2xl p-6 mb-8">
          <p className="text-xs text-[#6b6b6b] uppercase tracking-wider mb-2">Email</p>
          <p className="text-lg">
            <ContactMail locale="en" />
          </p>
          <p className="text-xs text-[#6b6b6b] mt-4">
            We typically respond within 24–48 hours when possible.
          </p>
        </div>

        <h2 className="text-white font-semibold mb-3 text-sm">Quick answers</h2>
        <div className="space-y-3 text-sm text-[#b0b0b0]">
          <div className="glass-card rounded-xl p-4">
            <p className="text-white text-sm font-medium">Generation failed?</p>
            <p className="mt-1 text-xs">
              Try a simpler prompt, switch use case, or wait if the service is busy.
              Rate limits may apply.
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white text-sm font-medium">Better quality?</p>
            <p className="mt-1 text-xs">
              Describe subject, lighting, materials, composition and style clearly.
            </p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-white text-sm font-medium">Download issues?</p>
            <p className="mt-1 text-xs">
              Use the Download button, or right-click the image → Save As.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-block mt-8 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white text-sm"
        >
          Try the tools
        </Link>
      </main>
    </SiteChrome>
  );
}
