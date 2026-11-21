import type { MetadataRoute } from "next";

/** Lets phones and desktops install Kokoro as an app from the browser. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kokoro Hospitality",
    short_name: "Kokoro",
    description: "Book Japan's heritage homes and manage your stay.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
