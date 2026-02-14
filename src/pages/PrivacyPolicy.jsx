import React from "react";
import { useTheme } from "../context/ThemeContext";
import Footer from "../components/Footer";

function PrivacyPolicy() {
  const { theme } = useTheme();

  // MUSIC THEME COLORS
  const bgColor = theme === "dark" ? "#1a1a1a" : "#fffdf9";
  const textColor = theme === "dark" ? "#e5e5e5" : "#444";
  const headingColor = theme === "dark" ? "#c8f9f2" : "#1f2a7a"; // music blue/teal
  const sectionTextColor = theme === "dark" ? "#cfcfcf" : "#666";

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <main className="flex-grow w-full max-w-3xl mx-auto px-6 py-12">
        <h1
          className="text-4xl font-bold text-center mb-10"
          style={{
            color: headingColor,
            textShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          Terms of Use & Privacy Policy
        </h1>

        {/* ---------------- TERMS ---------------- */}
        <section className="mb-12">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: headingColor }}
          >
            Terms of Use
          </h2>

          <p className="text-sm leading-relaxed mb-4" style={{ color: sectionTextColor }}>
            Welcome to <strong>ai-music</strong>. ai-music is an AI-powered music
            therapy and emotional wellness platform that allows users to browse,
            generate, and save music based on emotions and moods. By creating an
            account or using ai-music in any way, you agree to these Terms of Use.
            If you do not agree, you should not use the application.
          </p>

          <p className="text-sm leading-relaxed mb-4" style={{ color: sectionTextColor }}>
            ai-music is provided for personal, non-commercial use only. You may
            upload audio, images, and descriptions related to music that you own
            or have permission to use. You may not upload illegal, copyrighted,
            harmful, or offensive content, nor use the platform to impersonate
            others or violate their rights. You are solely responsible for all
            content you submit.
          </p>

          <p className="text-sm leading-relaxed mb-4" style={{ color: sectionTextColor }}>
            ai-music provides music suggestions and AI-generated content intended
            for emotional support and relaxation only. ai-music does <strong>not </strong> 
            provide medical, psychological, or therapeutic advice. The platform
            is not a substitute for professional healthcare. You use the content
            at your own discretion and risk.
          </p>

          <p className="text-sm leading-relaxed mb-4" style={{ color: sectionTextColor }}>
            ai-music is provided “as is” and “as available,” without warranties of
            any kind. We do not guarantee uninterrupted service, error-free
            operation, or permanent storage of uploaded content. Features may be
            updated or removed at any time.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: sectionTextColor }}>
            By using ai-music, you confirm that you are legally permitted to agree
            to these Terms. Continued use after updates constitutes acceptance
            of the revised Terms.
          </p>
        </section>

        {/* ---------------- PRIVACY ---------------- */}
        <section className="mb-12">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: headingColor }}
          >
            Privacy Policy
          </h2>

          <p className="text-sm leading-relaxed mb-4" style={{ color: sectionTextColor }}>
            This Privacy Policy explains how ai-music collects, stores, and uses
            information. By using ai-music, you agree to the practices described
            below.
          </p>

          <p className="text-sm leading-relaxed mb-4" style={{ color: sectionTextColor }}>
            When you create an account, we may collect information such as your
            email address and authentication credentials. We also store the
            content you create, including uploaded music, generated tracks,
            emotional categories, images, and descriptions. This data is used
            solely to operate core platform features.
          </p>

          <p className="text-sm leading-relaxed mb-4" style={{ color: sectionTextColor }}>
            ai-music does not sell your personal data. We may share limited data
            with trusted service providers (such as hosting or storage services)
            only as required to operate the platform. These providers are not
            permitted to use your data for their own purposes.
          </p>

          <p className="text-sm leading-relaxed mb-4" style={{ color: sectionTextColor }}>
            ai-music is not designed to collect sensitive medical or health data.
            You should avoid submitting highly sensitive personal information.
            While we apply reasonable security measures, no system can guarantee
            absolute security.
          </p>

          <p className="text-sm leading-relaxed mb-4" style={{ color: sectionTextColor }}>
            You may request deletion of your account and associated data at any
            time. Account deletion is permanent and will remove all uploaded and
            saved music associated with your profile.
          </p>

          <p className="text-sm leading-relaxed" style={{ color: sectionTextColor }}>
            This Privacy Policy may be updated as ai-music evolves. Continued use
            of the platform after changes are published constitutes acceptance
            of the updated policy.
          </p>
        </section>
      </main>

      <Footer theme={theme} />
    </div>
  );
}

export default PrivacyPolicy;
