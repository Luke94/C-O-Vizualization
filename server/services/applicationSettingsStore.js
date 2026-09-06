import fs from "node:fs/promises";
import path from "node:path";
import { HttpError } from "../utils/httpError.js";

export class ApplicationSettingsStore {
  constructor(filePath) { this.filePath = filePath; }

  async initialize() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try { await fs.access(this.filePath); }
    catch { await this.#write({ columnMapping: {} }); }
  }

  async get() {
    try { return JSON.parse(await fs.readFile(this.filePath, "utf8")); }
    catch { throw new HttpError(500, "Nastavení aplikace je poškozené."); }
  }

  async update(input) {
    const mapping = input?.columnMapping;
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) {
      throw new HttpError(400, "Mapování sloupců nemá platný formát.");
    }
    const columnMapping = Object.fromEntries(Object.entries(mapping).map(([key, value]) => [String(key), String(value ?? "").trim()]));
    const settings = { columnMapping };
    await this.#write(settings);
    return settings;
  }

  async #write(settings) {
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
    await fs.rename(temporaryPath, this.filePath);
  }
}
