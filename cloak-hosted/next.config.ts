import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return [
      // Expose ERC-8128 discovery at the standard well-known path
      { source: "/.well-known/erc8128", destination: "/api/well-known/erc8128" },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Signature, Signature-Input, Content-Digest" },
        ],
      },
    ];
  },
};

export default nextConfig;
