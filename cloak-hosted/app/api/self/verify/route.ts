import { NextRequest, NextResponse } from "next/server";
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

const SCOPE = process.env.NEXT_PUBLIC_SELF_SCOPE ?? "cloak-vault";
const ENDPOINT =
  (process.env.NEXT_PUBLIC_SELF_ENDPOINT ?? "http://localhost:3000") +
  "/api/self/verify";

// Singleton verifier — created once per cold start
const verifier = new SelfBackendVerifier(
  SCOPE,
  ENDPOINT,
  false, // not mock mode
  AllIds,
  new DefaultConfigStore({ minimumAge: 18 }),
  "uuid"
);

export async function POST(req: NextRequest) {
  try {
    const { attestationId, proof, publicSignals, userContextData } =
      await req.json();

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json(
        { status: "error", verified: false, reason: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await verifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );

    if (result.isValidDetails.isValid) {
      return NextResponse.json({
        status: "success",
        verified: true,
        credentialSubject: result.discloseOutput,
      });
    }

    return NextResponse.json({
      status: "error",
      verified: false,
      reason: "Proof verification failed",
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        verified: false,
        reason: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight (same as other routes)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
