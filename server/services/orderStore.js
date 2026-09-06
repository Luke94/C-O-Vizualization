import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { HttpError } from "../utils/httpError.js";

export class OrderStore {
  constructor(filePath, historyFilePath = path.join(path.dirname(filePath), "order-history.json")) {
    this.filePath = filePath;
    this.historyFilePath = historyFilePath;
    this.writeQueue = Promise.resolve();
  }

  async initialize() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      await this.#write(this.filePath, []);
    }

    try { await fs.access(this.historyFilePath); }
    catch { await this.#write(this.historyFilePath, []); }
  }

  async list() {
    return this.#read(this.filePath);
  }

  async listHistory() {
    return this.#read(this.historyFilePath);
  }

  async create(input) {
    const draft = normalizeOrderInput(input);
    const validationError = validateOrderInput(draft);
    if (validationError) throw new HttpError(400, validationError);

    return this.#enqueue(async () => {
      const orders = await this.#read(this.filePath);
      const order = {
        id: crypto.randomUUID(),
        ...draft,
        createdAt: new Date().toISOString(),
        startedAt: null
      };

      orders.push(order);
      await this.#write(this.filePath, orders);
      return order;
    });
  }

  async synchronizeAndon(entries) {
    return this.#enqueue(async () => {
      const orders = await this.#read(this.filePath);
      const activeIds = new Set(entries.map(({ event }) => String(event.EventID)));
      const remaining = orders.filter((order) => order.source !== "andon" || activeIds.has(String(order.andonEventId)));
      for (const { event, order: draft } of entries) {
        const existing = remaining.find((item) => item.source === "andon" && String(item.andonEventId) === String(event.EventID));
        if (existing) Object.assign(existing, draft, { andonStatus: event.Status });
        else remaining.push({ id: `andon-${event.EventID}`, ...draft, source: "andon", andonEventId: String(event.EventID), andonGroupId: Number(event.RecvGroupID), andonStatus: event.Status, originalComment: event.SenderComment || event.LatestComment, createdAt: new Date().toISOString(), startedAt: null });
      }
      await this.#write(this.filePath, remaining);
      return remaining;
    });
  }

  async update(orderId, changes) {
    return this.#enqueue(async () => {
      const orders = await this.#read(this.filePath);
      const index = orders.findIndex((order) => order.id === orderId);
      if (index < 0) throw new HttpError(404, "Objednávka nebyla nalezena.");

      const current = orders[index];
      const updated = {
        ...current,
        ...changes
      };

      orders[index] = updated;
      await this.#write(this.filePath, orders);
      return updated;
    });
  }

  async start(orderId) {
    return this.#enqueue(async () => {
      const orders = await this.#read(this.filePath);
      const index = orders.findIndex((order) => order.id === orderId);
      if (index < 0) throw new HttpError(404, "Objednávka nebyla nalezena.");
      orders[index] = { ...orders[index], startedAt: new Date().toISOString() };
      await this.#write(this.filePath, orders);
      return orders[index];
    });
  }

  async complete(orderId) {
    return this.#enqueue(async () => {
      const orders = await this.#read(this.filePath);
      const index = orders.findIndex((order) => order.id === orderId);
      if (index < 0) throw new HttpError(404, "Objednávka nebyla nalezena.");

      const order = orders[index];
      const completedAt = new Date();
      const startedAt = order.startedAt ? new Date(order.startedAt) : completedAt;
      const historyEntry = {
        ...order,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime())
      };

      orders.splice(index, 1);
      const history = await this.#read(this.historyFilePath);
      const cutoff = completedAt.getTime() - 30 * 24 * 60 * 60 * 1000;
      const retained = [historyEntry, ...history]
        .filter((entry) => new Date(entry.completedAt).getTime() >= cutoff)
        .slice(0, 2000);
      await this.#write(this.filePath, orders);
      await this.#write(this.historyFilePath, retained);
      return historyEntry;
    });
  }

  async remove(orderId) {
    return this.#enqueue(async () => {
      const orders = await this.#read(this.filePath);
      const remaining = orders.filter((order) => order.id !== orderId);
      if (remaining.length === orders.length) throw new HttpError(404, "Objednávka nebyla nalezena.");

      await this.#write(this.filePath, remaining);
    });
  }

  #enqueue(operation) {
    const nextOperation = this.writeQueue.then(operation, operation);
    this.writeQueue = nextOperation.catch(() => undefined);
    return nextOperation;
  }

  async #read(filePath) {
    const raw = await fs.readFile(filePath, "utf8");

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new HttpError(500, "Soubor objednávek je poškozený.");
    }
  }

  async #write(filePath, orders) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(orders, null, 2)}\n`, "utf8");

    try {
      await fs.rename(temporaryPath, filePath);
    } catch (error) {
      if (!["EEXIST", "EPERM"].includes(error.code)) throw error;
      await fs.rm(filePath, { force: true });
      await fs.rename(temporaryPath, filePath);
    }
  }
}

function normalizeOrderInput(input = {}) {
  return {
    machine: normalizeMachine(input.machine),
    currentTool: String(input.currentTool ?? "").trim(),
    currentNoTool: Boolean(input.currentNoTool),
    nextTool: String(input.nextTool ?? "").trim(),
    priority: String(input.priority ?? "")
  };
}

function normalizeMachine(value) {
  const machine = String(value ?? "").trim();
  if (!machine) return "";
  return machine.toLocaleLowerCase("cs-CZ").startsWith("s-") ? machine : `S-${machine}`;
}

function validateOrderInput(order) {
  if (!order.machine || order.machine.toLocaleLowerCase("cs-CZ") === "s-") return "Zadej číslo stroje.";
  if (!order.currentNoTool && !order.currentTool) return "Zadej aktuální číslo toolu.";
  if (!order.nextTool) return "Zadej číslo toolu pro další výrobu.";
  if (!["1", "2", "3"].includes(order.priority)) return "Priorita musí být 1, 2 nebo 3.";
  return "";
}
