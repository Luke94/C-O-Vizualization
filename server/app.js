import fs from "node:fs";
import path from "node:path";
import express from "express";
import { config } from "./config.js";
import { createDatabaseRouter } from "./routes/database.js";
import { createOrdersRouter } from "./routes/orders.js";
import { OrderStore } from "./services/orderStore.js";
import { WorkbookStore } from "./services/workbookStore.js";
import { HttpError } from "./utils/httpError.js";

export async function createApp() {
  const app = express();
  const orderStore = new OrderStore(config.orderStoreFile);
  const workbookStore = new WorkbookStore({
    filePath: config.workbookFile,
    backupDirectory: config.workbookBackupDirectory,
    allowUpload: config.allowDatabaseUpload,
    maxBytes: config.maxWorkbookBytes
  });

  await Promise.all([orderStore.initialize(), workbookStore.initialize()]);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/v1/orders", createOrdersRouter(orderStore));
  app.use("/api/v1/database", createDatabaseRouter(workbookStore, config.maxWorkbookBytes));

  app.use("/api", (request, _response, next) => {
    next(new HttpError(404, `Cesta ${request.method} ${request.originalUrl} neexistuje.`));
  });

  app.get("/data/preparation.xlsx", (_request, response, next) => {
    response.set({
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    });
    response.sendFile(config.workbookFile, (error) => {
      if (error) next(error);
    });
  });

  if (fs.existsSync(config.clientDirectory)) {
    app.use(express.static(config.clientDirectory, { index: false, maxAge: "1h" }));

    // React has no client routes yet, but the fallback keeps IIS deep links safe.
    app.get("*", (_request, response) => {
      response.sendFile(path.join(config.clientDirectory, "index.html"));
    });
  } else {
    app.get("/", (_request, response) => {
      response.status(503).send("Frontend build chybí. Spusťte npm run build.");
    });
  }

  app.use((request, _response, next) => {
    next(new HttpError(404, `Cesta ${request.method} ${request.originalUrl} neexistuje.`));
  });

  app.use((error, _request, response, _next) => {
    const status = error.type === "entity.too.large" ? 413 : error.status || 500;
    const message = status >= 500 ? "Na serveru došlo k neočekávané chybě." : error.message;

    if (status >= 500) console.error(error);
    response.status(status).json({ message });
  });

  return app;
}
