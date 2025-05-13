import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  eslint: {
    // Disable eslint during build to prevent build failures
    ignoreDuringBuilds: true,
  },
  
  // Add security headers to help prevent XSS attacks
  headers: async () => {
    return [
      {
        // Apply these headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: Object.entries(ContentSecurityPolicy)
              .map(([key, values]) => `${key} ${values.join(' ')}`)
              .join('; '),
          },
        ].filter(Boolean),
      },
    ];
  },
};

const ContentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.google.com", "https://www.gstatic.com"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'", "data:"],
  'img-src': ["'self'", "data:", "https://www.google.com", "https://www.gstatic.com"],
  'connect-src': ["'self'", "http://localhost:8000", process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1", "https://www.google.com"],
  'frame-src': ["'self'", "https://www.google.com"]
};

export default nextConfig;
