import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  // API routes configuration
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default nextConfig;
