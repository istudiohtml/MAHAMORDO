import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  outputFileTracingIncludes: {
    "/**": [
      "./node_modules/@fontsource/prompt/files/prompt-thai-600-normal.woff2",
      "./node_modules/@fontsource/prompt/files/prompt-thai-600-normal.woff",
    ],
  },
};

export default nextConfig;
