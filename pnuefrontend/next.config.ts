import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  // Allow requests from any device on the local network
  allowedDevOrigins: [
    "192.168.254.18",
    "192.168.1.*",
    "192.168.0.*",
    "10.0.0.*",
    "10.10.10.*",
  ],
};

export default nextConfig;

