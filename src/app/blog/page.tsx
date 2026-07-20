import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips and notes about free AI image generation.",
};

export default function BlogEn() {
  return (
    <SiteChrome locale="en">
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">Blog</span>
        </h1>
        <p className="text-[#a0a0a0] text-sm mb-8">
          Short notes on prompts and free image tools. More posts coming soon.
        </p>
        <article className="glass-card rounded-xl p-5">
          <p className="text-[11px] text-[#6b6b6b]">July 2026</p>
          <h2 className="text-white font-medium mt-1">Write better prompts</h2>
          <p className="text-[#9a9a9a] text-sm mt-2 leading-relaxed">
            Lead with the subject, then add setting, lighting, materials and style.
            Concrete camera or lighting words often help more than “8K ultra HD” alone.
          </p>
          <Link href="/" className="text-xs text-[#8b5cf6] mt-3 inline-block">
            Try on the homepage →
          </Link>
        </article>
      </main>
    </SiteChrome>
  );
}
