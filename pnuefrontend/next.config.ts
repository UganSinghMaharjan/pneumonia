import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow requests from any device on the local network
  allowedDevOrigins: [
    "192.168.254.18",
    "192.168.1.*",
    "192.168.0.*",
    "10.0.0.*",
    "10.10.10.*",
  ],
  async rewrites() {
    return [
      // Use /backend/ prefix to avoid Next.js intercepting /api/* routes.
      // Forwards to Django with trailing slash (required by Django URL patterns).
      {
        source: "/backend/:path*/",
        destination: "http://127.0.0.1:8000/api/:path*/",
      },
      {
        source: "/backend/:path*",
        destination: "http://127.0.0.1:8000/api/:path*/",
      },
      // Proxy Django media files (X-ray images, uploads)
      {
        source: "/media/:path*",
        destination: "http://127.0.0.1:8000/media/:path*",
      },
    ];
  },
};

export default nextConfig;
