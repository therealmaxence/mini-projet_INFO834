import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Removed the webpack block. Next.js 16 will now use Turbopack by default.
};

export default nextConfig;