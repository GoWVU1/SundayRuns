import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sunday Runs",
    short_name: "Sunday Runs",
    description: "Pickup basketball roster, RSVPs, and waitlist for the Sunday Runs crew.",
    start_url: "/",
    display: "standalone",
    background_color: "#041e42",
    theme_color: "#041e42",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
