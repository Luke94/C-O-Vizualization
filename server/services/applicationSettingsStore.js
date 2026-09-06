import fs from "node:fs/promises";
import path from "node:path";
import { HttpError } from "../utils/httpError.js";

export class ApplicationSettingsStore {
  constructor(filePath) { this.filePath = filePath; }

  async initialize() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try { await fs.access(this.filePath); }
    catch { await this.#write({ columnMapping: {}, displayRows: [], andon: defaultAndonSettings() }); }
  }

  async get() {
    try {
      const parsed = JSON.parse(await fs.readFile(this.filePath, "utf8"));
      const andon = { ...defaultAndonSettings(), ...(parsed.andon || {}) };
      delete andon.enabled;
      delete andon.username;
      delete andon.password;
      return { ...parsed, andon };
    }
    catch { throw new HttpError(500, "Nastavení aplikace je poškozené."); }
  }

  async update(input) {
    const mapping = input?.columnMapping;
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) {
      throw new HttpError(400, "Mapování sloupců nemá platný formát.");
    }
    const columnMapping = Object.fromEntries(Object.entries(mapping).map(([key, value]) => [String(key), String(value ?? "").trim()]));
    const displayRows = Array.isArray(input?.displayRows)
      ? input.displayRows.map((row, index) => ({
          id: String(row?.id || `row-${index + 1}`),
          label: String(row?.label ?? "").trim(),
          sourceColumn: String(row?.sourceColumn ?? "").trim()
        })).filter((row) => row.label && row.sourceColumn)
      : [];
    if (displayRows.length > 100) throw new HttpError(400, "Lze nastavit nejvýše 100 zobrazovaných řádků.");
    const current = await this.get();
    const settings = { ...current, columnMapping, displayRows };
    await this.#write(settings);
    return settings;
  }

  async updateAndon(input) {
    const current = await this.get();
    const andon = {
      endpoint: String(input?.endpoint || "").trim(),
      buildingNr: String(input?.buildingNr || "").trim(),
      person: String(input?.person || "").trim(),
      workplace: String(input?.workplace || "").trim(),
      workplaceType: String(input?.workplaceType || "").trim(),
      eventTypeName: String(input?.eventTypeName || "").trim(),
      days: Math.min(30, Math.max(1, Number.parseInt(input?.days, 10) || 2)),
      useCloseLoop: Boolean(input?.useCloseLoop),
      finishedStatus: Number.parseInt(input?.finishedStatus, 10) || 3,
      doUserValidation: input?.doUserValidation !== false
    };
    if (!andon.endpoint || !andon.buildingNr || !andon.person || !andon.eventTypeName) {
      throw new HttpError(400, "Vyplň adresu API, budovu, osobu a typ Andonu.");
    }
    const settings = { ...current, andon };
    await this.#write(settings);
    return settings;
  }

  async #write(settings) {
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
    await fs.rename(temporaryPath, this.filePath);
  }
}

export function defaultAndonSettings() {
  return {
    endpoint: "http://cz563ap12.cz.tycoelectronics.com/SSRN.asmx",
    buildingNr: "563",
    person: "11590",
    workplace: "",
    workplaceType: "",
    eventTypeName: "Připrav se na upínání",
    days: 2,
    useCloseLoop: false,
    finishedStatus: 3,
    doUserValidation: true,
  };
}
