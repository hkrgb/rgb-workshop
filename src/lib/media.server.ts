import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import {
  ALLOWED_MIME,
  MAX_FILE_BYTES,
  extFromMime,
  kindFromMime,
  makeFileSlug,
  mimeFromName,
  type MediaItem,
  type MediaKind,
} from "@/lib/media";
import {
  deleteGithubFile,
  githubIsConfigured,
  putGithubFile,
} from "@/lib/github-media.server";

type MediaRow = {
  id: string;
  slug: string;
  filename: string;
  mime_type: string;
  kind: string;
  size_bytes: number;
  created_at: string | Date;
  public_url: string | null;
  github_path: string | null;
};

function toItem(row: MediaRow): MediaItem {
  const created =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at);
  return {
    id: row.id,
    slug: row.slug,
    filename: row.filename,
    mimeType: row.mime_type,
    kind: row.kind as MediaKind,
    sizeBytes: Number(row.size_bytes),
    createdAt: created,
    publicUrl: row.public_url ?? null,
  };
}

export function asBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof value === "string") {
    const hex = value.startsWith("\\x") ? value.slice(2) : value;
    if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) {
      return Uint8Array.from(Buffer.from(hex, "hex"));
    }
    return Uint8Array.from(Buffer.from(value, "base64"));
  }
  throw new Error("Unexpected file payload");
}

export async function listMedia(userId: string): Promise<MediaItem[]> {
  const sql = await getSql();
  const rows = await sql<MediaRow>`
    select id, slug, filename, mime_type, kind, size_bytes, created_at, public_url, github_path
    from media
    where user_id = ${userId}
    order by created_at desc
  `;
  return rows.map(toItem);
}

export async function getMediaMeta(slug: string): Promise<MediaItem | null> {
  const sql = await getSql();
  const rows = await sql<MediaRow>`
    select id, slug, filename, mime_type, kind, size_bytes, created_at, public_url, github_path
    from media
    where slug = ${slug}
    limit 1
  `;
  return rows[0] ? toItem(rows[0]) : null;
}

export async function getMediaFile(
  slug: string,
): Promise<{ item: MediaItem; bytes: Uint8Array | null } | null> {
  const sql = await getSql();
  const rows = await sql<MediaRow & { data: unknown }>`
    select id, slug, filename, mime_type, kind, size_bytes, created_at, public_url, github_path, data
    from media
    where slug = ${slug}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    item: toItem(row),
    bytes: row.data == null ? null : asBytes(row.data),
  };
}

export async function deleteMedia(userId: string, id: string): Promise<boolean> {
  const sql = await getSql();
  const existing = await sql<{ github_path: string | null }>`
    select github_path from media where id = ${id} and user_id = ${userId} limit 1
  `;
  const path = existing[0]?.github_path;
  if (path) {
    try {
      await deleteGithubFile(path);
    } catch {
      /* still delete the row */
    }
  }
  const rows = await sql<{ id: string }>`
    delete from media
    where id = ${id} and user_id = ${userId}
    returning id
  `;
  return rows.length > 0;
}

function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const startRaw = match[1];
  const endRaw = match[2];
  let start = startRaw ? Number(startRaw) : 0;
  let end = endRaw ? Number(endRaw) : size - 1;
  if (startRaw === "" && endRaw) {
    const suffix = Number(endRaw);
    start = Math.max(size - suffix, 0);
    end = size - 1;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    return null;
  }
  start = Math.max(0, start);
  end = Math.min(size - 1, end);
  return { start, end };
}

/** Raw file response so the URL behaves like a real `/xxxxx.jpg`. */
export async function serveMediaResponse(
  slug: string,
  request: Request,
): Promise<Response> {
  const found = await getMediaFile(slug);
  if (!found) return new Response("Not found", { status: 404 });
  const { item, bytes } = found;
  if (!bytes) {
    if (item.publicUrl) {
      return Response.redirect(item.publicUrl, 302);
    }
    return new Response("Not found", { status: 404 });
  }
  const size = bytes.byteLength;
  const range = parseRange(request.headers.get("range"), size);
  const headers: Record<string, string> = {
    "Content-Type": item.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  if (request.method === "HEAD") {
    headers["Content-Length"] = String(size);
    return new Response(null, { headers });
  }
  if (!range) {
    headers["Content-Length"] = String(size);
    return new Response(Buffer.from(bytes), { headers });
  }
  const slice = bytes.slice(range.start, range.end + 1);
  headers["Content-Length"] = String(slice.byteLength);
  headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
  return new Response(Buffer.from(slice), { status: 206, headers });
}

export async function saveMediaFile(opts: {
  userId: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}): Promise<MediaItem> {
  const mime = mimeFromName(opts.filename, opts.mimeType);
  if (!ALLOWED_MIME.has(mime) && mime !== "audio/mpeg") {
    throw Object.assign(new Error("Unsupported file type"), { status: 415 });
  }
  const kind = kindFromMime(mime);
  if (!kind) {
    throw Object.assign(new Error("Unsupported file type"), { status: 415 });
  }
  if (opts.bytes.byteLength === 0) {
    throw Object.assign(new Error("Empty file"), { status: 400 });
  }
  if (opts.bytes.byteLength > MAX_FILE_BYTES) {
    throw Object.assign(new Error("File is too large (max 12 MB)"), { status: 413 });
  }

  const sql = await getSql();
  const id = randomUUID();
  const filename = opts.filename.replace(/[/\\]/g, "_").slice(0, 180) || "file";
  const payload = Buffer.from(opts.bytes);
  const ext = extFromMime(mime, filename);
  const useGithub = await githubIsConfigured();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = makeFileSlug(ext);
    let publicUrl: string | null = null;
    let githubPath: string | null = null;
    if (useGithub) {
      const uploaded = await putGithubFile({
        slug,
        bytes: opts.bytes,
        filename,
      });
      publicUrl = uploaded.publicUrl;
      githubPath = uploaded.path;
    }
    try {
      const rows = await sql<MediaRow>`
        insert into media (id, slug, user_id, filename, mime_type, kind, size_bytes, data, public_url, github_path)
        values (
          ${id},
          ${slug},
          ${opts.userId},
          ${filename},
          ${mime},
          ${kind},
          ${payload.byteLength},
          ${useGithub ? null : payload},
          ${publicUrl},
          ${githubPath}
        )
        returning id, slug, filename, mime_type, kind, size_bytes, created_at, public_url, github_path
      `;
      if (rows[0]) return toItem(rows[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("unique") && attempt < 5) continue;
      throw err;
    }
  }

  throw new Error("Could not allocate a unique link");
}
