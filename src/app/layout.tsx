import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AI Free Image Generator - Text to Image",
    template: "%s | AI Free Image",
  },
  description:
    "Free AI image generator. Create images from text prompts. No sign-up required. Rate limits apply.",
  keywords: [
    "AI image generator",
    "free AI image generator",
    "text to image",
    "AI art",
    "Z-Image-Turbo",
  ],
  openGraph: {
    title: "AI Free Image Generator",
    description: "Create images from text. Free to use with fair rate limits.",
    type: "website",
  },
  robots: { index: true, follow: true },
  alternates: {
    languages: {
      en: "/",
      zh: "/zh",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsense = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const ga = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {adsense ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense}`}
            crossOrigin="anonymous"
          />
        ) : null}
        {ga ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${ga}');
                `,
              }}
            />
          </>
        ) : null}
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
