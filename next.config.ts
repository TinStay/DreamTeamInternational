import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacy", destination: "/en/privacy", permanent: true },
      { source: "/terms", destination: "/en/terms", permanent: true },
      { source: "/training", destination: "/bg/training", permanent: true },
      { source: "/individual", destination: "/bg/training/individual", permanent: true },
      { source: "/en/individual", destination: "/en/training/individual", permanent: true },
      { source: "/bg/individual", destination: "/bg/training/individual", permanent: true },
    ];
  },
};

export default nextConfig;
