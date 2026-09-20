import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createInterface } from "node:readline";

const cli = createRequire(import.meta.url).resolve("@playwright/test/cli");
const root = path.resolve("test-results/sharded");
const reports = path.join(root, "blobs");
const htmlReport = path.resolve("playwright-report/sharded");
const children = new Set();
let interrupted = 0;

const run = (args, env, label) =>
  new Promise(resolve => {
    const child = spawn(process.execPath, [cli, ...args], {
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    children.add(child);
    for (const stream of [child.stdout, child.stderr]) {
      createInterface({ input: stream }).on("line", line => console.log(`[${label}] ${line}`));
    }
    child.on("error", error => {
      console.error(`[${label}] ${error.message}`);
      resolve(1);
    });
    child.on("close", code => {
      children.delete(child);
      resolve(code ?? 1);
    });
  });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    interrupted = signal === "SIGINT" ? 130 : 143;
    for (const child of children) {
      child.kill(signal);
    }
  });
}

rmSync(root, { recursive: true, force: true });
rmSync(htmlReport, { recursive: true, force: true });
mkdirSync(reports, { recursive: true });

const results = await Promise.all(
  [1, 2, 3].map(index =>
    run(
      ["test", ...process.argv.slice(2), `--shard=${index}/3`, "--workers=1"],
      { E2E_SHARD_INDEX: String(index) },
      `shard ${index}/3`,
    ),
  ),
);

if (interrupted) {
  process.exitCode = interrupted;
} else {
  let missingReport = false;
  for (const index of [1, 2, 3]) {
    const directory = path.join(root, `shard-${index}`, "blob");
    const files = existsSync(directory) ? readdirSync(directory) : [];
    const archives = files.filter(file => file.endsWith(".zip"));
    if (archives.length === 0) {
      console.error(`Missing report for shard ${index}/3`);
      missingReport = true;
    }
    for (const file of archives) {
      cpSync(path.join(directory, file), path.join(reports, `${index}-${file}`));
    }
  }
  const merged = await run(
    ["merge-reports", "--reporter=list,html", reports],
    {
      PLAYWRIGHT_HTML_OUTPUT_DIR: htmlReport,
      PLAYWRIGHT_HTML_OPEN: "never",
    },
    "merged",
  );
  const reportCreated = existsSync(path.join(htmlReport, "index.html"));
  if (!reportCreated && !interrupted) {
    console.error(
      "Merged HTML report was not generated. Run with the Node.js version specified by the CI workflow.",
    );
  }
  process.exitCode =
    interrupted ||
    (missingReport || !reportCreated || merged !== 0 || results.some(code => code !== 0) ? 1 : 0);
}
