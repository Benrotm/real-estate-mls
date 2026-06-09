import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright-core', 'playwright', 'tesseract.js', 'jimp', 'sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
