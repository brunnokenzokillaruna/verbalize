import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  experimental: {
    useCache: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.googleapis.com wss://*.firebaseio.com wss://*.googleapis.com wss://generativelanguage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://*.spline.design https://unpkg.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' data: blob:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "worker-src 'self' blob:",
              "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.google.com",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  transpilePackages: ['@splinetool/react-spline', '@splinetool/runtime'],
};

export default nextConfig;
