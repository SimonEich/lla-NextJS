import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  // Fully static output: the whole app is client-driven (progress lives in
  // localStorage / later Supabase), so there is nothing a Node server needs
  // to render. Static files are what make offline caching reliable.
  output: "export",
  images: { unoptimized: true },
};

export default withSerwist(nextConfig);
