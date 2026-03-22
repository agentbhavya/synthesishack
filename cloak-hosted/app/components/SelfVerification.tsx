"use client";

import { useState, useEffect } from "react";
import { SelfQRcodeWrapper, SelfAppBuilder, type SelfApp } from "@selfxyz/qrcode";

interface Props {
  onVerified: (selfUserId: string) => void;
}

export function SelfVerification({ onVerified }: Props) {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [userId] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const endpoint =
        process.env.NEXT_PUBLIC_SELF_ENDPOINT ?? "http://localhost:3000";
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
