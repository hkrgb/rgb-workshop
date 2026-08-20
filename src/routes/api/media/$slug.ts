import { createFileRoute } from "@tanstack/react-router";
import { serveMediaResponse } from "@/lib/media.server";

export const Route = createFileRoute("/api/media/$slug")({
  server: {
    handlers: {
      GET: async ({ params, request }) => serveMediaResponse(params.slug, request),
      HEAD: async ({ params, request }) => serveMediaResponse(params.slug, request),
    },
  },
});
