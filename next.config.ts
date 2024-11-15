import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (config.cache && !dev) {
      config.cache = Object.freeze({
        type: 'memory',
      });
    }
    return config;
  },
};

export default nextConfig;
