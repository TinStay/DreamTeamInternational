import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/privacy", destination: "/en/privacy", permanent: true },
      { source: "/terms", destination: "/en/terms", permanent: true },
      { source: "/training", destination: "/bg/training", permanent: true },
    ];
  },
};

export default nextConfig;
