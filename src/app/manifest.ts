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
      { src: "/api/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/api/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
