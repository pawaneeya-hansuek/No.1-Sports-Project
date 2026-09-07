import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = process.cwd(),
  target = path.join(root, "release");
if (fs.existsSync(target))
  throw new Error(
    "release already exists. Choose a clean checkout for packaging.",
  );
execFileSync(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "build",
    "--outDir",
    "work/production-build",
  ],
  { stdio: "inherit", env: { ...process.env, VITE_PREVIEW_MODE: "false" } },
);
fs.mkdirSync(path.join(target, "server"), { recursive: true });
fs.cpSync("server", path.join(target, "server"), {
  recursive: true,
  filter: (source) =>
    !source.endsWith("config.php") && !source.includes(`storage${path.sep}`),
});
fs.mkdirSync(path.join(target, "server/storage"), { recursive: true });
fs.cpSync("work/production-build", path.join(target, "server/public"), {
  recursive: true,
});
fs.cpSync("database", path.join(target, "database"), { recursive: true });
fs.copyFileSync("README.md", path.join(target, "README.md"));
console.log("Production PHP installation is ready in release/.");
