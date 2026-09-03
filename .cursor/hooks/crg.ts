import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function consumeStdin(): void {
  try {
    readFileSync(0, "utf8");
  } catch {
    // stdin may already be closed
  }
}

export function repoRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function runCrg(args: string[]): string {
  const root = repoRoot();
  const result = spawnSync(
    "uv",
    ["run", "code-review-graph", ...args, "--repo", root],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      windowsHide: true,
    },
  );
  if (result.error) return "";
  return `${result.stdout ?? ""}${result.stderr ?? ""}`
    .replaceAll("\r\n", "\n")
    .trim();
}

export function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}
