import fs from "node:fs/promises";
import path from "node:path";
import { HttpError } from "../utils/httpError.js";

const ALLOWED_EXTENSIONS = new Set([".xlsx"]);

export class WorkbookStore {
  constructor({ filePath, backupDirectory, allowUpload, maxBytes }) {
    this.filePath = filePath;
    this.backupDirectory = backupDirectory;
    this.allowUpload = allowUpload;
    this.maxBytes = maxBytes;
  }

  async initialize() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.mkdir(this.backupDirectory, { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      throw new Error(`Chybí výchozí Excel: ${this.filePath}`);
    }
  }

  async getMeta() {
    const stat = await fs.stat(this.filePath);
    return {
      updatedAt: stat.mtime.toISOString(),
      sizeBytes: stat.size,
      allowUpload: this.allowUpload
    };
  }

  async replace(buffer, originalFileName) {
    if (!this.allowUpload) throw new HttpError(403, "Nahrání Excelu je na serveru zakázané.");
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new HttpError(400, "Nebyl přijat žádný soubor.");
    if (buffer.length > this.maxBytes) throw new HttpError(413, "Excel překračuje povolenou velikost.");

    const extension = path.extname(originalFileName || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) throw new HttpError(400, "Povolené jsou pouze soubory XLSX.");
    if (!hasWorkbookSignature(buffer)) throw new HttpError(400, "Soubor nemá platný formát Excelu.");

    await this.#backupCurrentFile();

    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, buffer);

    try {
      await fs.rename(temporaryPath, this.filePath);
    } catch (error) {
      if (!["EEXIST", "EPERM"].includes(error.code)) throw error;
      await fs.rm(this.filePath, { force: true });
      await fs.rename(temporaryPath, this.filePath);
    }

    return this.getMeta();
  }

  async #backupCurrentFile() {
    try {
      await fs.access(this.filePath);
    } catch {
      return;
    }

    const timestamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
    const backupPath = path.join(this.backupDirectory, `preparation-${timestamp}.xlsx`);
    await fs.copyFile(this.filePath, backupPath);
  }
}

function hasWorkbookSignature(buffer) {
  return buffer[0] === 0x50 && buffer[1] === 0x4b;
}
