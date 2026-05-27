import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack disabled to avoid RSC parsing issues with the large client component.
  // Vercel will use standard Webpack for the build.
};

export default nextConfig;
