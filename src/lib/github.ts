export const GITHUB_OWNER = "hkrgb";
export const GITHUB_REPO = "rgb-workshop-media";
export const GITHUB_BRANCH = "main";

export function githubRepoUrl(): string {
  return `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
}

/** Direct file URL via jsDelivr (pinned to a commit when available). */
export function githubCdnUrl(slug: string, commitSha?: string): string {
  const ref = commitSha && /^[a-f0-9]{7,40}$/i.test(commitSha) ? commitSha : GITHUB_BRANCH;
  return `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@${ref}/${slug}`;
}

/** Direct file URL on GitHub itself — available immediately after commit. */
export function githubRawUrl(slug: string): string {
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${slug}`;
}