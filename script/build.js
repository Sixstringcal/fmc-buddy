#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { barelyServe } from "barely-a-dev-server";
import { compile } from "@jalvin/compiler";

/**
 * esbuild plugin: when an import has no .ts/.tsx but a .jalvin file exists,
 * compile it in-memory and return the TypeScript — no artifact written to disk.
 */
const jalvinPlugin = {
  name: "jalvin",
  setup(build) {
    // Step 1: resolve bare imports (e.g. "./RatingButtonsView") to their .jalvin source
    build.onResolve({ filter: /.*/ }, (args) => {
      if (!args.resolveDir) return;
      const base = path.resolve(args.resolveDir, args.path);
      // If a .ts/.tsx already exists, let esbuild handle it normally
      for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
        if (fs.existsSync(base + ext)) return;
      }
      // Fall back to .jalvin
      const jalvinPath = base + ".jalvin";
      if (fs.existsSync(jalvinPath)) {
        return { path: jalvinPath, namespace: "jalvin" };
      }
    });

    // Step 2: compile .jalvin → TypeScript source in memory
    build.onLoad({ filter: /\.jalvin$/, namespace: "jalvin" }, (args) => {
      const source = fs.readFileSync(args.path, "utf8");
      const result = compile(source, args.path);
      if (!result.ok) {
        console.error(`Jalvin compilation failed for ${args.path}`);
        const errors = (result.diagnostics?.all || [])
          .filter((d) => d && d.severity === "error")
          .map((d) => ({ text: d.message }));
        return { errors: errors.length > 0 ? errors : [{ text: "Unknown Jalvin compilation error" }] };
      }

      // Jalvin emits `import { Symbol } from "src/a/b"` where "src/a/b" is the
      // module directory — but when the project uses one-file-per-class, there's
      // no index.ts. Fix it: if "src/a/b" is a directory (no .ts file beside it),
      // check whether "src/a/b/Symbol.ts" exists and rewrite the path.
      const fixed = result.code.replace(
        /^(import\s+\{([^}]+)\}\s+from\s+")([^"]+)(")/gm,
        (match, pre, symbols, modulePath, post) => {
          if (!modulePath.startsWith("src/")) return match;
          const abs = path.resolve(process.cwd(), modulePath);
          if (fs.existsSync(abs + ".ts") || fs.existsSync(path.join(abs, "index.ts"))) {
            return match; // already resolves fine
          }
          const symbol = symbols.trim().split(/[\s,]+/)[0];
          if (symbol && fs.existsSync(path.join(abs, symbol + ".ts"))) {
            return `${pre}${modulePath}/${symbol}${post}`;
          }
          return match;
        }
      );
      return {
        contents: fixed,
        loader: "ts",
        // Project root as resolveDir so esbuild finds tsconfig.json and honours
        // baseUrl:"." — that's what makes `src/models/css` etc. resolve correctly.
        resolveDir: process.cwd(),
      };
    });
  },
};

export const COMMON_BUILD_OPTIONS = {
  entryRoot: "./src",
  esbuildOptions: {
    chunkNames: "chunks/[name]-[hash]",
    plugins: [jalvinPlugin],
  },
};

if (process.argv.at(-1) === "--dev") {
  barelyServe(COMMON_BUILD_OPTIONS);
} else {
  const outDir = "./dist/web";
  await barelyServe({
    ...COMMON_BUILD_OPTIONS,
    dev: false,
    outDir,
  });

  console.log(`
Your app has been built in: ${outDir}
`);
}
