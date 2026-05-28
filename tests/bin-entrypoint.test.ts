import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Regression for the silent no-op bug: bin/vspec.js loaded dist/src/cli.js via a
// dynamic import, so the `import.meta.url === file://argv[1]` guard never matched
// and parseAsync was never called — every command printed nothing and exited 0.
// The bin now runs only from the built dist and calls the exported run()
// explicitly; if dist is missing it must fail loudly instead of exiting 0 empty.
describe("bin entrypoint (built dist)", () => {
  const repoRoot = resolve(import.meta.dirname, "..");
  const bin = join(repoRoot, "bin/vspec.js");
  const built = join(repoRoot, "dist/src/cli.js");

  it("runs through bin/vspec.js against the built dist and produces output", () => {
    if (!existsSync(built)) {
      execFileSync(
        join(repoRoot, "node_modules/.bin/tsc"),
        ["-p", "tsconfig.build.json"],
        { cwd: repoRoot },
      );
    }
    const out = execFileSync("node", [bin, "ai-guide"], { encoding: "utf8" });
    expect(out).toContain("vspec AI Guide");
  }, 60_000);

  it("fails loudly with a BUILD_MISSING envelope when dist is absent", () => {
    // Copy the bin into a temp dir with no sibling dist/ so it resolves to a
    // missing build, without disturbing the real dist used by other tests.
    const dir = mkdtempSync(join(tmpdir(), "vspec-bin-"));
    mkdirSync(join(dir, "bin"));
    copyFileSync(bin, join(dir, "bin", "vspec.js"));

    let stdout = "";
    let status: number | null = 0;
    try {
      stdout = execFileSync("node", [join(dir, "bin", "vspec.js"), "doctor"], {
        encoding: "utf8",
      });
    } catch (error) {
      const err = error as { status?: number; stdout?: string };
      status = err.status ?? null;
      stdout = err.stdout ?? "";
    }

    expect(status).toBe(1);
    const envelope = JSON.parse(stdout);
    expect(envelope.status).toBe("error");
    expect(envelope.error.code).toBe("BUILD_MISSING");
  });
});
