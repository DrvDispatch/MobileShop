import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix for Turbopack incorrectly inferring workspace root
  turbopack: {
    root: path.resolve(__dirname),
  },
  output: "standalone", // Required for Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "smartphoneservice.be",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9002",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "minio",
        port: "9000",
        pathname: "/**",
      },
    ],
  },
  // Note: API routes in src/app/api/* now handle proxying to backend
  // with proper Host header preservation for multi-tenant resolution
};

export default nextConfig;


