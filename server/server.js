import { createApp } from "./app.js";
import { config } from "./config.js";

const app = await createApp();

const server = app.listen(config.port, "0.0.0.0", () => {
  console.log(`C/O Visualization běží na portu ${config.port}.`);
});

function shutdown(signal) {
  console.log(`Přijat signál ${signal}, ukončuji server.`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
