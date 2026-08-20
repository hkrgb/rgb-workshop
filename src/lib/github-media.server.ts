import { getSql } from "@/lib/db";
import {
  GITHUB_BRANCH,
  GITHUB_OWNER,
  GITHUB_REPO,
  githubCdnUrl,
  githubRawUrl,
} from "@/lib/github";

const TOKEN_KEY = "github_token";

function envToken(): string | undefined {
  const raw =
    (typeof process !== "undefined" ? process.env.GITHUB_TOKEN : undefined) ??
    (typeof process !== "undefined" ? process.env.GITHUB_MEDIA_TOKEN : undefined) ??
    (typeof process !== "undefined" ? process.env.GH_TOKEN : undefined);
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

export function githubTokenFromEnv(): boolean {
  return Boolean(envToken());
}

export async function getStoredGithubToken(): Promise<string | undefined> {
  const fromEnv = envToken();
  if (fromEnv) return fromEnv;
  const sql = await getSql();
  const rows = await sql<{ value: string }>`
    select value from workshop_settings where key = ${TOKEN_KEY} limit 1
  `;
  const value = rows[0]?.value?.trim();
  return value || undefined;
}

export async function githubIsConfigured(): Promise<boolean> {
  return Boolean(await getStoredGithubToken());
}

async function assertTokenCanWrite(token: string): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (res.status === 401 || res.status === 403) {
    throw new Error("GitHub token 無效或沒有這個 repo 的權限");
  }
  if (!res.ok) {
    throw new Error(`無法連接 GitHub（${res.status}）`);
  }
}

export async function saveGithubToken(token: string): Promise<void> {
  const value = token.trim();
  if (!value) throw new Error("Token is empty");
  await assertTokenCanWrite(value);
  const sql = await getSql();
  await sql`
    insert into workshop_settings (key, value, updated_at)
    values (${TOKEN_KEY}, ${value}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}

export async function clearGithubToken(): Promise<void> {
  if (envToken()) return;
  const sql = await getSql();
  await sql`delete from workshop_settings where key = ${TOKEN_KEY}`;
}

type PutResult = { publicUrl: string; path: string };

export async function putGithubFile(opts: {
  slug: string;
  bytes: Uint8Array;
  filename: string;
}): Promise<PutResult> {
  const token = await getStoredGithubToken();
  if (!token) throw new Error("GitHub token is not configured");

  const path = opts.slug;
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `add ${opts.filename}`,
        content: Buffer.from(opts.bytes).toString("base64"),
        branch: GITHUB_BRANCH,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error("GitHub token 無效或權限不足（需要 Contents 寫入）");
    }
    throw new Error(text.slice(0, 280) || `GitHub upload failed (${res.status})`);
  }

  const body = (await res.json()) as { commit?: { sha?: string } };
  const sha = body.commit?.sha;
  return {
    publicUrl: sha ? githubCdnUrl(path, sha) : githubRawUrl(path),
    path,
  };
}

export async function deleteGithubFile(path: string): Promise<void> {
  const token = await getStoredGithubToken();
  if (!token) return;

  const meta = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path)}?ref=${GITHUB_BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (meta.status === 404) return;
  if (!meta.ok) return;
  const body = (await meta.json()) as { sha?: string };
  if (!body.sha) return;

  await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `remove ${path}`,
        sha: body.sha,
        branch: GITHUB_BRANCH,
      }),
    },
  );
}