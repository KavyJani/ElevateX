import type { NextConfig } from "next";

const apiOrigin = process.env.API_INTERNAL_ORIGIN || "http://127.0.0.1:3001";
const nextConfig: NextConfig = {
  transpilePackages: ["@elevatex/shared"],
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` },
    ];
  },
};
export default nextConfig;
