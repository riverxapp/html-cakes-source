const { execSync } = require("child_process");
const fs = require("fs");
require("./static-server.js");
const { startGitPoll } = require("./git-poll.js");

const BRANCH = process.env.PREVIEW_BRANCH || "main";
const REPO_URL = process.env.REPO_URL;

process.chdir("/app"); // 🔑 FORCE cwd

function run(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: "/app" });
}

if (!REPO_URL) {
  console.error("[supervisor] REPO_URL env var is required");
  process.exit(1);
}

console.log("[supervisor] ensuring git repo");

if (!fs.existsSync(".git")) {
  run("git init");
}

try {
  run(`git remote set-url origin ${REPO_URL}`);
} catch (e) {
  run(`git remote add origin ${REPO_URL}`);
}

try {
  run(`git fetch origin ${BRANCH} --depth=1`);
  run(`git reset --hard origin/${BRANCH}`);
  run("git clean -fd");
} catch (err) {
  console.error("[supervisor] failed to sync branch", err.message || err);
  process.exit(1);
}

console.log(`[supervisor] static preview running on branch ${BRANCH}`);

// 🔑 start polling ONLY after git is ready
startGitPoll();
