import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(serverDirectory, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });

export const config = {
  port: toPositiveInteger(process.env.HTTP_PLATFORM_PORT || process.env.PORT, 3000),
  clientDirectory: path.join(projectRoot, "dist", "client"),
  orderStoreFile: resolveProjectPath(process.env.ORDER_STORE_FILE || "./data/orders.json"),
  workbookFile: resolveProjectPath(process.env.WORKBOOK_FILE || "./data/preparation.xlsx"),
  workbookBackupDirectory: resolveProjectPath(process.env.WORKBOOK_BACKUP_DIR || "./data/backups"),
  allowDatabaseUpload: toBoolean(process.env.ALLOW_DATABASE_UPLOAD, true),
  maxWorkbookBytes: toPositiveInteger(process.env.MAX_WORKBOOK_MB, 20) * 1024 * 1024
};

function resolveProjectPath(value) {
  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}
