#!/usr/bin/env node
/**
 * Nitro bundles @electric-sql/pglite into `_libs/electric-sql__pglite.mjs`
 * but does not copy the sibling wasm/data blobs it reads at runtime. Local
 * `vite preview` (no DATABASE_URL → PGLite fallback) needs those files next
 * to the bundle. Deployed apps with DATABASE_URL never load them.
 */
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");
const destDir = join(
  root,
  ".vercel/output/functions/__server.func/_libs",
);

const files = ["pglite.data", "pglite.wasm", "initdb.wasm"];

await mkdir(destDir, { recursive: true });
for (const name of files) {
  await copyFile(join(srcDir, name), join(destDir, name));
}
console.log("[pglite-assets] copied wasm/data next to the Nitro pglite bundle");
