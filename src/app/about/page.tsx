import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "About",
  description: "About AI Free Image — free text-to-image without sign-up.",
};

export default function AboutEn() {
  return (
    <SiteChrome locale="en">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          <span className="gradient-text">About</span>
        </h1>
        <p className="text-[#a0a0a0] mb-10 leading-relaxed">
          A free AI image toolkit for creators who want visuals without friction.
          No sign-up, no watermarks on outputs we control.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {[
            ["100%", "Free to try"],
            ["0", "Sign-up required"],
            ["0", "Forced watermark"],
            ["24/7", "When online"],
          ].map(([a, b]) => (
            <div key={b} className="glass-card rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-white">{a}</p>
              <p className="text-[11px] text-[#7a7a7a] mt-1">{b}</p>
            </div>
          ))}
        </div>

        <section className="space-y-4 text-sm text-[#b0b0b0] leading-relaxed mb-10">
          <h2 className="text-white text-lg font-semibold">Our approach</h2>
          <p>
            Most AI image products ask you to register, burn free credits, then
            pay. We focus on opening the page, describing what you need, and getting
            a result—with fair rate limits so costs stay sustainable.
          </p>
          <p>
            Infrastructure may use serverless hosting, object storage, and
            third-party or open-weight inference. Optional advertising can help
            cover operating costs.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[#b0b0b0] mb-10">
          <h2 className="text-white text-lg font-semibold">What you can do</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Text-to-image with multiple aspect ratios</li>
            <li>Pick a use case (everyday, posters, commercial scenes)</li>
            <li>Download PNG results for personal or commercial projects (you remain responsible for lawful use)</li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#3b82f6] text-white text-sm font-medium"
          >
            Start creating
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm"
          >
            Contact
          </Link>
          <Link href="/privacy" className="px-5 py-2.5 rounded-xl text-[#8b5cf6] text-sm">
            Privacy
          </Link>
        </div>
      </main>
    </SiteChrome>
  );
}
