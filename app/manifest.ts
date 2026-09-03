import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NexFin Casal",
    short_name: "NexFin",
    description: "Controle financeiro compartilhado do casal",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#0e1630",
  };
}
