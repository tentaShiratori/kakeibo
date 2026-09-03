import { consumeStdin, runCrg, writeJson } from "./crg.ts";

consumeStdin();
const lines: string[] = [];
for (const line of runCrg(["detect-changes", "--brief"]).split("\n")) {
  if (line.includes("Token Savings")) break;
  lines.push(line);
}
const msg = lines.join("\n").trim();
if (msg) {
  writeJson({ permission: "allow", agent_message: msg });
} else {
  writeJson({ permission: "allow" });
}
