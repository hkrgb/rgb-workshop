import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertWorkshopUser } from "@/lib/auth/workshop.server";
import { deleteMedia, getMediaMeta, listMedia } from "@/lib/media.server";
import {
  githubIsConfigured,
  githubTokenFromEnv,
  saveGithubToken,
} from "@/lib/github-media.server";
import { GITHUB_OWNER, GITHUB_REPO } from "@/lib/github";

export const listMyMedia = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertWorkshopUser(context.userId);
    return listMedia(context.userId);
  });

export const removeMedia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    await assertWorkshopUser(context.userId);
    const ok = await deleteMedia(context.userId, id);
    if (!ok) throw new Error("File not found");
    return { ok: true };
  });

export const fetchMediaMeta = createServerFn({ method: "GET" })
  .validator((slug: string) => slug.trim())
  .handler(async ({ data: slug }) => {
    if (!slug) return null;
    return getMediaMeta(slug);
  });

export const getGithubStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await assertWorkshopUser(context.userId);
    return {
      configured: await githubIsConfigured(),
      fromEnv: githubTokenFromEnv(),
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
    };
  });

export const connectGithub = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((token: string) => token.trim())
  .handler(async ({ context, data: token }) => {
    await assertWorkshopUser(context.userId);
    if (!token) throw new Error("Token is empty");
    await saveGithubToken(token);
    return { configured: true };
  });