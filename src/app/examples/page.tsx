import type { Metadata } from "next";
import Link from "next/link";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Examples",
  description: "Example prompts for free AI image generation.",
};

const EXAMPLES = [
  {
    title: "Street violinist",
    prompt:
      "A weathered street musician playing violin on a rainy cobblestone alley, soft neon reflections, cinematic, shallow depth of field",
  },
  {
    title: "Product watch",
    prompt:
      "Luxury watch on white marble surface, soft shadow, product photography, studio lighting, minimalist, high-end",
  },
  {
    title: "Botanical study",
    prompt:
      "Scientific botanical illustration of exotic flowers, hand-drawn style, detailed linework, vintage field guide aesthetic",
  },
  {
    title: "Misty forest",
    prompt:
      "Misty forest path in autumn, golden light filtering through trees, fog, peaceful atmosphere, fine art photography",
  },
];

export default function ExamplesEn() {
  return (
    <SiteChrome locale="en">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">
          <span className="gradient-text">Examples</span>
        </h1>
        <p className="text-[#a0a0a0] text-sm mb-8">
          Copy a prompt and try it on the homepage.
        </p>
        <div className="space-y-4">
          {EXAMPLES.map((ex) => (
            <div key={ex.title} className="glass-card rounded-xl p-5">
              <h2 className="text-white font-medium text-sm">{ex.title}</h2>
              <p className="text-[#9a9a9a] text-xs sm:text-sm mt-2 leading-relaxed">
                {ex.prompt}
              </p>
              <Link
                href={`/?q=${encodeURIComponent(ex.prompt)}`}
                className="inline-block mt-3 text-xs text-[#8b5cf6] hover:underline"
              >
                Use this prompt →
              </Link>
            </div>
          ))}
        </div>
      </main>
    </SiteChrome>
  );
}
