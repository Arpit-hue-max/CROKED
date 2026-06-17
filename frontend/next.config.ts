import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is only for Docker/self-hosted builds — Vercel does NOT support it.
  // Set STANDALONE_BUILD=true in your Dockerfile to enable it for Docker deployments.
  ...(process.env.STANDALONE_BUILD === "true" ? { output: "standalone" as const } : {}),
  devIndicators: false,
};

export default nextConfig;
