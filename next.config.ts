// next.config.ts
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  // Where you write your service worker code
  swSrc: "src/sw.ts",
  // Where the compiled service worker will be outputted (must be public)
  swDest: "public/sw.js",
  // CRITICAL: Disables PWA caching during development so you don't pull your hair out
  // wondering why your UI changes aren't showing up.
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {}, // This explicitly tells Next.js to silence the warning
};

export default withSerwist(nextConfig);