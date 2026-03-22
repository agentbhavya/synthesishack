"use client";

import { useState, useEffect } from "react";
import { SelfQRcodeWrapper, SelfAppBuilder, type SelfApp } from "@selfxyz/qrcode";

interface Props {
  onVerified: (selfUserId: string) => void;
}

const isLocalhost = (url: string) =>
  url.startsWith("http://localhost") ||
  url.startsWith("http://127.") ||
  url.startsWith("http://0.0.0.0");

export function SelfVerification({ onVerified }: Props) {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [userId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    const endpoint =
      process.env.NEXT_PUBLIC_SELF_ENDPOINT ?? "http://localhost:3000";

    // Self SDK rejects localhost endpoints — in dev, show bypass instead
    if (isLocalhost(endpoint)) {
      setDevMode(true);
      return;
    }

    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME ?? "Cloak",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE ?? "cloak-vault",
        endpoint: `${endpoint}/api/self/verify`,
        userId,
        endpointType: "staging_https",
        userIdType: "uuid",
        disclosures: { minimumAge: 18 },
      }).build();

      setSelfApp(app);
    } catch (e) {
      console.error("Self QR setup error:", e);
      setError("Failed to initialize identity verification.");
    }
  }, [userId]);

  if (devMode) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="px-4 py-3 rounded-sm border"
          style={{
            borderColor: "rgba(var(--color-ornament-rgb, 180,150,90), 0.5)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <p
            className="font-mono text-xs mb-2"
            style={{ color: "var(--color-gold)" }}
          >
            DEV MODE
          </p>
          <p
            style={{
              fontFamily: "EB Garamond, serif",
              fontStyle: "italic",
              color: "var(--color-cream-dim)",
              fontSize: "0.8rem",
            }}
          >
            Self Protocol requires a public HTTPS endpoint.
            <br />
            Set{" "}
            <code
              className="font-mono"
              style={{ color: "var(--color-gold)", fontSize: "0.75rem" }}
            >
              NEXT_PUBLIC_SELF_ENDPOINT=https://cloak-hosted.vercel.app
            </code>
            <br />
            to enable real ZK verification.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => onVerified(`dev-bypass-${userId}`)}
        >
          Skip Verification (Dev Only)
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p
        style={{
          fontFamily: "EB Garamond, serif",
          fontStyle: "italic",
          color: "var(--color-cream-dim)",
          fontSize: "0.875rem",
          textAlign: "center",
        }}
      >
        Scan with the{" "}
        <a
          href="https://self.xyz"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--color-gold)" }}
        >
          Self app
        </a>{" "}
        to prove your identity without revealing personal data.
      </p>

      {error && (
        <p style={{ color: "var(--color-danger)", fontSize: "0.875rem" }}>
          {error}
        </p>
      )}

      {selfApp ? (
        <div className="rounded-sm overflow-hidden border border-ornament border-opacity-40 p-2 bg-white">
          <SelfQRcodeWrapper
            selfApp={selfApp}
            onSuccess={() => onVerified(userId)}
            onError={() => setError("Verification failed. Please try again.")}
          />
        </div>
      ) : (
        !error && (
          <div
            className="w-48 h-48 flex items-center justify-center border border-border"
            style={{ color: "var(--color-cream-dim)", fontSize: "0.75rem" }}
          >
            Loading QR…
          </div>
        )
      )}
    </div>
  );
}
