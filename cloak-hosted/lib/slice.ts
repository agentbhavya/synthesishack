import { createVerifierClient } from "@slicekit/erc8128";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import type { NextRequest } from "next/server";

// In-memory nonce store — resets on cold start (fine for hackathon)
// Each nonce is stored with its expiry timestamp
const nonceMap = new Map<string, number>();

const nonceStore = {
  async consume(key: string, ttlSeconds: number): Promise<boolean> {
    const now = Date.now();
    // Purge expired nonces to prevent unbounded growth
    for (const [k, exp] of nonceMap) {
      if (exp < now) nonceMap.delete(k);
    }
    if (nonceMap.has(key)) return false; // replay detected
    nonceMap.set(key, now + ttlSeconds * 1000);
    return true; // fresh nonce, accept
  },
};

// Celo mainnet — same chain Self Protocol uses in this project
const publicClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
});

const verifier = createVerifierClient({
  verifyMessage: publicClient.verifyMessage,
  nonceStore,
});

export function hasSliceHeaders(req: NextRequest): boolean {
  return req.headers.has("signature") && req.headers.has("signature-input");
}

/** Verifies an ERC-8128 signed request. Returns the signer's wallet address or null. */
export async function verifySliceRequest(
  req: NextRequest
): Promise<string | null> {
  try {
    // Clone so the original body stream stays intact for the route handler
    const result = await verifier.verifyRequest({ request: req.clone() as Request });
    if (result.ok) return result.address.toLowerCase();
    console.warn("[slice] verify failed:", result.reason);
    return null;
  } catch (err) {
    console.error("[slice] verify error:", err);
    return null;
  }
}
