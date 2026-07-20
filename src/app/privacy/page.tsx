import type { Metadata } from "next";
import { LegalLayout, H2, P, Ul, ContactMail } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for AI Free Image Generator.",
};

export default function PrivacyEn() {
  return (
    <LegalLayout
      locale="en"
      title="Privacy Policy"
      subtitle="What we collect, why we process it, and the choices you have. Effective: July 21, 2026."
    >
      <div className="grid sm:grid-cols-3 gap-3 not-prose mb-6">
        {[
          ["No account", "Use tools without signing up or payment details."],
          ["Operational data", "Prompts, results and technical logs as described below."],
          ["Optional ads", "Ads/analytics only if configured by the operator."],
        ].map(([t, d]) => (
          <div key={t} className="glass-card p-3 rounded-xl">
            <p className="text-white text-sm font-medium">{t}</p>
            <p className="text-[#7a7a7a] text-xs mt-1">{d}</p>
          </div>
        ))}
      </div>

      <H2>Information We Collect</H2>
      <P>
        When you use this service we may process: text prompts you submit; generated
        image results; technical request data (IP address, browser type, page URL);
        and usage events (page views, feature clicks). We do not require an account,
        name, email or payment card to use the generator.
      </P>

      <H2>How We Use Information</H2>
      <Ul
        items={[
          "Provide image generation and deliver results",
          "Prevent abuse and enforce rate limits",
          "Diagnose errors and improve reliability",
          "Understand aggregate usage (if analytics are enabled)",
          "Support optional advertising (if AdSense is enabled)",
        ]}
      />
      <P>
        We do not use your prompts or images to train our own foundation models.
      </P>

      <H2>Advertising and Cookies</H2>
      <P>
        If Google AdSense is enabled, Google and partners may use cookies, device
        identifiers or IP-derived signals to serve and measure ads. Manage choices at{" "}
        <a className="text-[#8b5cf6] hover:underline" href="https://adssettings.google.com/">
          Google Ads Settings
        </a>{" "}
        or industry tools such as{" "}
        <a className="text-[#8b5cf6] hover:underline" href="https://optout.aboutads.info/">
          aboutads.info
        </a>
        .
      </P>

      <H2>Analytics</H2>
      <P>
        If Google Analytics is enabled, it may process device information, approximate
        location from IP, page URLs and interaction events under Google’s policies.
      </P>

      <H2>Prompts, Results and Retention</H2>
      <P>
        Prompts and results are processed by third-party inference providers (for example
        hosting routes used for generation) and may be stored in object storage (e.g.
        Cloudflare R2) to return a downloadable URL. Rate-limit counters are short-lived
        operational records. Do not submit confidential, medical, or sensitive personal data.
      </P>

      <H2>Service Providers</H2>
      <P>
        Data may be processed by providers needed to run the service: cloud hosting
        (e.g. Vercel), object storage/CDN (e.g. Cloudflare R2), AI inference providers,
        and optional Google advertising/analytics. Providers may process data outside
        your country. We may disclose information when required by law or to protect
        the service and users.
      </P>

      <H2>Security</H2>
      <P>
        We use reasonable safeguards such as encrypted transport (HTTPS) and restricted
        server access. No online system is perfectly secure.
      </P>

      <H2>Children</H2>
      <P>
        This service is not directed to children under 13. We do not knowingly collect
        personal information from children under 13. Contact us if you believe such
        data was submitted.
      </P>

      <H2>Changes</H2>
      <P>
        We may update this policy when services or legal requirements change. The
        effective date at the top will be revised when we post updates.
      </P>

      <H2>Contact</H2>
      <P>
        Privacy questions: <ContactMail locale="en" />
      </P>
    </LegalLayout>
  );
}
