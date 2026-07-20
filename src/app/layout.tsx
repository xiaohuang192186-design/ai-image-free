import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Free Image Generator - Create Stunning Images Free",
  description:
    "Free AI image generator powered by Z-Image-Turbo. Create beautiful images from text prompts. No sign-up, unlimited generations.",
  keywords: [
    "AI image generator",
    "free AI image generator",
    "text to image",
    "AI art",
    "image generation",
    "Z-Image-Turbo",
    "free AI art generator",
    "no sign-up image generator",
  ],
  openGraph: {
    title: "AI Free Image Generator - Create Stunning Images Free",
    description:
      "Free AI image generator powered by Z-Image-Turbo. Create beautiful images from text prompts. No sign-up, unlimited generations.",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google AdSense — replace ca-pub-XXXXXXXXXX with your publisher ID
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
          crossOrigin="anonymous"
        />
        */}

        {/* Google Analytics — replace G-XXXXXXXXXX with your measurement ID
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" />
        <script dangerouslySetInnerHTML={{__html:`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `}} />
        */}
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
