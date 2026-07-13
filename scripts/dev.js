import { spawn } from "node:child_process";
import { watchClient } from "./client-build.js";

const clientContext = await watchClient();
const serverProcess = spawn(process.execPath, ["--watch", "server/server.js"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development"
  }
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Přijat signál ${signal}, ukončuji vývojové prostředí.`);
  serverProcess.kill(signal);
  await clientContext.dispose();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

serverProcess.on("exit", async (code) => {
  await clientContext.dispose();
  process.exit(code ?? 0);
});
