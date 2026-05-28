import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "..");
const tsx = join(repoRoot, "node_modules/.bin/tsx");
const cli = join(repoRoot, "src/cli.ts");

function setup(): string {
  const root = join(tmpdir(), `vspec-guidance-${crypto.randomUUID()}`);
  mkdirSync(root, { recursive: true });
  execFileSync(tsx, [cli, "init", "--key", "VSPEC"], { cwd: root });
  return root;
}

function run(root: string, ...args: string[]): { status: string; data: unknown; warnings: { message: string }[]; suggested_next_actions: { command: string }[] } {
  return JSON.parse(execFileSync(tsx, [cli, ...args, "--format", "agent"], { cwd: root, encoding: "utf8" }));
}

describe("agent guidance signals", () => {
  it("warns at create time when the title is not a verb phrase", () => {
    const root = setup();
    const noun = run(root, "usecase", "create", "--title", "사용자 계정 등록", "--primary-actor", "user");
    expect(noun.warnings.some((w) => /verb phrase/.test(w.message))).toBe(true);
    const verb = run(root, "usecase", "create", "--title", "사용자 계정을 등록한다", "--primary-actor", "user");
    expect(verb.warnings).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  }, 15_000);

  it("doctor reports a summary and nudges to review warnings", () => {
    const root = setup();
    const created = run(root, "usecase", "create", "--title", "사용자 계정 등록", "--primary-actor", "user").data as { key: string };
    const report = run(root, "doctor", created.key);
    expect(report.status).toBe("ok");
    const summary = (report.data as { summary: { errors: number; warnings: number } }).summary;
    expect(summary.errors).toBe(0);
    expect(summary.warnings).toBeGreaterThan(0);
    expect(report.suggested_next_actions.some((a) => /--format=human/.test(a.command))).toBe(true);
    rmSync(root, { recursive: true, force: true });
  }, 15_000);
});
