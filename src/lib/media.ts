export const MAX_FILE_BYTES = 12 * 1024 * 1024;

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "audio/mpeg",
  "audio/mp3",
]);

export const ACCEPT_ATTR = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml,video/mp4,audio/mpeg,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.mp3";

export const MEDIA_EXT = ["jpg", "jpeg", "png", "gif", "webp", "svg", "mp4", "mp3"] as const;

export type MediaKind = "image" | "video" | "audio";

export type MediaItem = {
  id: string;
  slug: string;
  filename: string;
  mimeType: string;
  kind: MediaKind;
  sizeBytes: number;
  createdAt: string;
  publicUrl: string | null;
};

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  mp3: "audio/mpeg",
};

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
};

export function mimeFromName(name: string, fallback: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (fallback && ALLOWED_MIME.has(fallback)) return fallback === "audio/mp3" ? "audio/mpeg" : fallback;
  return EXT_MIME[ext] ?? fallback;
}

export function extFromMime(mime: string, name: string): string {
  const mapped = MIME_EXT[mime];
  if (mapped) return mapped;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpeg") return "jpg";
  if (ext && ext in EXT_MIME) return ext;
  return "bin";
}

export function kindFromMime(mime: string): MediaKind | null {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return null;
}

export function isAllowedFile(mime: string, name: string): boolean {
  const resolved = mimeFromName(name, mime);
  return ALLOWED_MIME.has(resolved) || resolved === "audio/mpeg";
}

export function isMediaFilename(name: string): boolean {
  return /^[abcdefghijkmnpqrstuvwxyz23456789]{10}\.(jpg|png|gif|webp|svg|mp4|mp3)$/.test(
    name,
  );
}

/** Prefer the public GitHub CDN link when we have one. */
export function fileUrl(item: Pick<MediaItem, "slug" | "publicUrl">): string {
  return item.publicUrl || `/${item.slug}`;
}

export function shareUrl(
  item: Pick<MediaItem, "slug" | "publicUrl">,
  origin?: string,
): string {
  const url = fileUrl(item);
  if (/^https?:\/\//i.test(url)) return url;
  if (origin) return new URL(url.startsWith("/") ? url : `/${url}`, origin).toString();
  return url;
}

export function makeSlug(length = 10): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export function makeFileSlug(ext: string): string {
  const clean = ext === "jpeg" ? "jpg" : ext.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${makeSlug()}.${clean || "bin"}`;
}
