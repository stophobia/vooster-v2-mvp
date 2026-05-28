#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const built = resolve(here, "../dist/src/cli.js");

// The CLI runs only from the built dist. `prepare` (see package.json) builds it
// on install; `pnpm dev` runs the source via tsx. If dist is missing we must
// never exit 0 with empty output — that is indistinguishable from success for an
// agent. Emit a machine-parseable error envelope and a non-zero exit instead.
if (!existsSync(built)) {
  const envelope = {
    format_version: 1,
    status: "error",
    data: null,
    error: {
      code: "BUILD_MISSING",
      message:
        "vspec is not built: dist/src/cli.js is missing. Run `npm run build` (it also runs automatically on install via the prepare script).",
    },
    context: { project_key: null },
    affected_files: [],
    dry_run: false,
    suggested_next_actions: [
      { command: "npm run build", reason: "Compile src/ to dist/ before running vspec." },
    ],
    warnings: [],
  };
  process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
  process.exit(1);
}

const { run } = await import(`file://${built}`);
await run();
