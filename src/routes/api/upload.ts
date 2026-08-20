import { createFileRoute } from "@tanstack/react-router";
import {
  ForbiddenError,
  requireWorkshopFromRequest,
} from "@/lib/auth/workshop.server";
import { UnauthorizedError } from "@/lib/auth/verify.server";
import { saveMediaFile } from "@/lib/media.server";

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await requireWorkshopFromRequest();
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) {
            return new Response("Missing file", { status: 400 });
          }
          const bytes = new Uint8Array(await file.arrayBuffer());
          const item = await saveMediaFile({
            userId: user.id,
            filename: file.name,
            mimeType: file.type,
            bytes,
          });
          return Response.json(item, { status: 201 });
        } catch (err) {
          if (err instanceof UnauthorizedError) {
            return new Response("Unauthorized", { status: 401 });
          }
          if (err instanceof ForbiddenError) {
            return new Response("Forbidden", { status: 403 });
          }
          const status =
            err && typeof err === "object" && "status" in err
              ? Number((err as { status: number }).status)
              : 500;
          const message = err instanceof Error ? err.message : "Upload failed";
          return new Response(message, {
            status: Number.isFinite(status) && status >= 400 ? status : 500,
          });
        }
      },
    },
  },
});
