"use client";

import Link from "next/link";
import Button from "@/components/ui/Button";

export default function WelcomeScreen() {
  return (
    <div className="landing-container">
      <main className="landing-content">
        {/* Warm, inviting headline */}
        <h1 className="landing-title">
          Let&apos;s design one small habit together.
        </h1>

        {/* Set expectations */}
        <p className="landing-subtitle">
          A 3-minute conversation → your personalized system
        </p>

        {/* Preview snippet showing conversational nature */}
        <div className="conversation-preview">
          <div className="preview-message preview-ai">
            What&apos;s something you&apos;ve been meaning to work on?
          </div>
          <div className="preview-message preview-user preview-faded">
            I want to get better at winding down before bed...
          </div>
        </div>

        {/* Warmer CTA */}
        <Link href="/setup">
          <Button size="lg" className="landing-cta">
            Let&apos;s talk
          </Button>
        </Link>
      </main>

      <style jsx>{`
        .landing-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 24px;
          text-align: center;
          background: var(--bg-primary);
        }

        .landing-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 360px;
        }

        .landing-title {
          font-family: var(--font-fraunces), 'Fraunces', Georgia, serif;
          font-size: 28px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }

        .landing-subtitle {
          font-family: var(--font-outfit), 'Outfit', sans-serif;
          font-size: 16px;
          color: var(--text-secondary);
          margin-bottom: 32px;
        }

        .conversation-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 32px;
          width: 100%;
        }

        .preview-message {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          text-align: left;
          line-height: 1.4;
        }

        .preview-ai {
          background: var(--ai-message-bg);
          border: 1px solid var(--bg-tertiary);
          align-self: flex-start;
          max-width: 85%;
        }

        .preview-user {
          background: var(--user-message-bg);
          color: var(--user-message-text);
          align-self: flex-end;
          max-width: 85%;
        }

        .preview-faded {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
