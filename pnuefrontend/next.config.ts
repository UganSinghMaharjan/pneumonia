import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.77"],
  async rewrites() {
    return [
      // Use /backend/ prefix to avoid Next.js intercepting /api/* routes.
      // Forwards to Django with trailing slash (required by Django URL patterns).
      {
        source: "/backend/:path*/",
        destination: "http://localhost:8000/api/:path*/",
      },
      {
        source: "/backend/:path*",
        destination: "http://localhost:8000/api/:path*/",
      },
      // Proxy Django media files (X-ray images, uploads)
      {
        source: "/media/:path*",
        destination: "http://localhost:8000/media/:path*",
      },
    ];
  },
};

export default nextConfig;
