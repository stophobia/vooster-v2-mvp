import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { findUseCaseFile, readConfig, relativePath } from "../files.js";
import { parseUseCaseMarkdown } from "../format/parse.js";
import type { ParsedUseCase } from "../domain/types.js";

export function renderGherkin(useCase: ParsedUseCase): string {
  const lines: string[] = [
    `Feature: ${useCase.frontmatter.title}`,
    "",
    "  Background:",
    `    Given the use case is in scope ${useCase.frontmatter.scope}`,
    "",
    "  Scenario: Main success",
  ];

  for (const step of useCase.mainSuccess) {
    lines.push(`    When ${step.actor} ${trimSentence(step.action)}`);
  }

  for (const extension of useCase.extensions) {
    lines.push("");
    lines.push(`  Scenario: ${extension.point} ${extension.condition}`);
    if (extension.point.startsWith("*")) lines.push("    Given main success reaches any step");
    else lines.push(`    Given main success reaches step ${extension.point.match(/^(\d+)/)?.[1] ?? extension.point}`);
    for (const step of extension.steps) {
      lines.push(`    When ${step.actor} ${trimSentence(step.action)}`);
    }
    lines.push(`    Then outcome is ${extension.outcome}`);
  }

  return `${lines.join("\n")}\n`;
}

export function exportGherkin(args: { key: string; output?: string; cwd?: string }) {
  const config = readConfig(args.cwd ?? process.cwd());
  if (!config) throw new Error("NOT_INITIALIZED");
  const source = findUseCaseFile(config.root, args.key);
  if (!source) throw new Error("KEY_NOT_FOUND");
  const text = renderGherkin(parseUseCaseMarkdown(readFileSync(source, "utf8")));
  const output = args.output ?? join("tests", `${args.key}.feature`);
  const outputPath = join(config.root, output);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, text);
  return { key: args.key, text, path: relativePath(outputPath, config.root) };
}

function trimSentence(value: string): string {
  return value.trim().replace(/[.!?]$/g, "");
}
