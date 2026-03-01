import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pantry Pal",
    short_name: "Pantry Pal",
    description: "Your hand-drawn kitchen companion",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#FAFAF9",
    background_color: "#FAFAF9",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
