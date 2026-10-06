import { build } from "esbuild";
import { rm } from "node:fs/promises";
await rm("public/runtime", { recursive: true, force: true });
await build({
  entryPoints: ["web/harness.mjs", "web/worker.mjs"],
  outdir: "public/runtime",
  chunkNames: "chunks/[name]-[hash]",
  splitting: true,
  loader: { ".html": "text" },
  bundle: true,
  format: "esm",
  target: ["chrome120", "firefox121", "safari17"],
  minify: true,
  sourcemap: false,
  legalComments: "eof",
});
