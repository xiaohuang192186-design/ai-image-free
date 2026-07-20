import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, H2, P, Ul, ContactMail } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for AI Free Image Generator.",
};

export default function TermsEn() {
  return (
    <LegalLayout
      locale="en"
      title="Terms of Service"
      subtitle="By using this free AI image generator you agree to these Terms. Last updated: July 2026."
    >
      <P>
        Also read our{" "}
        <Link href="/privacy" className="text-[#8b5cf6] hover:underline">
          Privacy Policy
        </Link>
        .
      </P>

      <H2>Service Description</H2>
      <P>
        This site provides text-to-image generation via third-party and open-weight
        models, plus hosting and a web UI. We integrate infrastructure and interfaces;
        we do not claim ownership of underlying open models where Apache or similar
        licenses apply.
      </P>

      <H2>AI-Generated Content</H2>
      <P>
        All outputs are AI-generated. You are responsible for labeling content as
        AI-generated where law requires, and for how you use or distribute results.
      </P>

      <H2>Your Content</H2>
      <P>
        Subject to third-party model licenses and applicable law, you may use images
        you generate. We do not add watermarks. We make no warranty of uniqueness or
        non-infringement of outputs.
      </P>

      <H2>User Responsibilities</H2>
      <Ul
        items={[
          "Do not infringe third-party IP or publicity rights",
          "Do not create illegal, harmful, or deceptive content",
          "Do not generate sexual content involving minors in any form",
          "Do not misuse the service to violate AI or content regulations",
          "Do not attempt to bypass rate limits or abuse infrastructure",
        ]}
      />

      <H2>Fair Use and Availability</H2>
      <P>
        Rate limits and quotas may apply to keep the service stable and control costs.
        The service is provided “as is” and “as available” without uptime guarantees.
      </P>

      <H2>Limitation of Liability</H2>
      <P>
        To the maximum extent permitted by law, we disclaim warranties and liability
        for damages arising from use of the service, including indirect or consequential
        damages. Review prompts and outputs before publishing.
      </P>

      <H2>Cooperation with Authorities</H2>
      <P>
        We may disclose information when required by valid legal process or to protect
        users and the service.
      </P>

      <H2>Changes</H2>
      <P>
        We may update these Terms. The “Last updated” date will change when we do.
      </P>

      <H2>Contact</H2>
      <P>
        <ContactMail locale="en" />
      </P>
    </LegalLayout>
  );
}
