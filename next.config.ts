import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Limit request body size for API routes (256 KB default, except import/pdf which needs 10 MB)
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
};

export default nextConfig;
