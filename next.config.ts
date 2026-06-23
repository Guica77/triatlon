import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-expect-error eslint is a valid config option but types might be outdated
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
