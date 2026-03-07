import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Prevents workspace root detection warning when there are multiple lockfiles
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
};

export default nextConfig;
