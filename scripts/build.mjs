import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const bundledNode = join(
  homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "bin",
  process.platform === "win32" ? "node.exe" : "node",
);
const nodeExecutable = existsSync(bundledNode) ? bundledNode : process.execPath;
const viteEntry = resolve("node_modules", "vite", "bin", "vite.js");
const result = spawnSync(nodeExecutable, ["--stack-size=8192", viteEntry, "build"], {
  cwd: process.cwd(), env: process.env, stdio: "inherit",
});
if (result.error) {
  console.error(`無法啟動 Vite 建置：${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
