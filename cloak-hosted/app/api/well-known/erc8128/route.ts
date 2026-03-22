import { NextResponse } from "next/server";

// ERC-8128 discovery document — tells agents how to authenticate with Cloak
// Served at /.well-known/erc8128 via next.config.ts rewrite
export async function GET() {
  const base = (
    process.env.NEXT_PUBLIC_SELF_ENDPOINT ?? "https://cloak-hosted.vercel.app"
  ).trim();
  return NextResponse.json({
    scheme: "erc8128",
    chains: [42220], // Celo mainnet
    label: "eth",
    endpoints: {
      execute: `${base}/api/execute`,
      services: `${base}/api/services`,
      credentials: `${base}/api/credentials`,
      chat: `${base}/api/chat`,
      audit: `${base}/api/audit`,
    },
    docs: "https://github.com/TpgGirls/synthesishack",
  });
}
