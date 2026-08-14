import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Construction Manager — Home Construction Manager",
    short_name: "Construction",
    description: "Private management for a residential construction project.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#163d7a",
    orientation: "any",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      { name: "Overview", short_name: "Overview", url: "/", icons: [{ src: "/icon.svg", sizes: "any" }] },
      { name: "Daily site log", short_name: "Daily log", url: "/site", icons: [{ src: "/icon.svg", sizes: "any" }] },
    ],
  };
}
