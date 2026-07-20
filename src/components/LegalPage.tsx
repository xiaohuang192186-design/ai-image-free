import Link from "next/link";
import SiteChrome, { type Locale } from "./SiteChrome";

export function LegalLayout({
  locale,
  title,
  subtitle,
  children,
}: {
  locale: Locale;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <SiteChrome locale={locale}>
      <main className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          <span className="gradient-text">{title}</span>
        </h1>
        {subtitle ? (
          <p className="text-[#a0a0a0] text-sm sm:text-base mb-8 leading-relaxed">
            {subtitle}
          </p>
        ) : (
          <div className="mb-8" />
        )}
        <article className="prose-legal space-y-6 text-sm sm:text-[15px] text-[#c8c8c8] leading-relaxed">
          {children}
        </article>
      </main>
    </SiteChrome>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-white mt-8 mb-2">{children}</h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[#b0b0b0]">{children}</p>;
}

export function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 text-[#b0b0b0]">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

export function ContactMail({ locale }: { locale: Locale }) {
  const email =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "xiaohuang192186@gmail.com";
  return (
    <Link href={`mailto:${email}`} className="text-[#8b5cf6] hover:underline">
      {email}
    </Link>
  );
}
