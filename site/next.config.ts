import type { NextConfig } from "next";

// A fully static site: `next build` writes plain files to `out/`, which the
// Cloudflare Worker serves. Today's puzzle comes from the Worker, not the build.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
