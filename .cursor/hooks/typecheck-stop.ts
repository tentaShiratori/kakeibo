import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { readStdinJson, repoRoot, writeJson } from "./io.ts";

const input = readStdinJson<{ loop_count?: number }>();
const loopCount = input.loop_count ?? 0;

const root = repoRoot();
const turbo = join(root, "node_modules", "turbo", "bin", "turbo");
const result = spawnSync(process.execPath, [turbo, "typecheck"], {
  cwd: root,
  encoding: "utf8",
  windowsHide: true,
});

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.replaceAll("\r\n", "\n").trim();

if (result.status !== 0 && loopCount < 3) {
  writeJson({
    followup_message: `Typecheck failed:\n${output.slice(0, 4000)}\n型エラーを修正してください。全テストは実行しない。`,
  });
} else {
  writeJson({});
}
