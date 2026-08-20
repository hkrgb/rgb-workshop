import { createFileRoute } from "@tanstack/react-router";
import { isMediaFilename } from "@/lib/media";
import { serveMediaResponse } from "@/lib/media.server";

export const Route = createFileRoute("/$filename")({
  server: {
    handlers: {
      GET: async ({ params, request, next }) => {
        if (!isMediaFilename(params.filename)) return next();
        return serveMediaResponse(params.filename, request);
      },
      HEAD: async ({ params, request, next }) => {
        if (!isMediaFilename(params.filename)) return next();
        return serveMediaResponse(params.filename, request);
      },
    },
  },
});
