import { spawnSync } from "node:child_process";
import { extname, join } from "node:path";
import { readStdinJson, repoRoot } from "./io.ts";

const input = readStdinJson<{ file_path?: string }>();
const filePath = input.file_path ?? "";
const ext = extname(filePath).toLowerCase();

if (filePath && [".ts", ".tsx", ".md"].includes(ext)) {
  const prettier = join(repoRoot(), "node_modules", "prettier", "bin", "prettier.cjs");
  spawnSync(process.execPath, [prettier, "--write", filePath], {
    cwd: repoRoot(),
    windowsHide: true,
  });
}
