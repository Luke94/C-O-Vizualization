import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { HttpError } from "../utils/httpError.js";

export class OrderStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.writeQueue = Promise.resolve();
  }

  async initialize() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      await this.#write([]);
    }
  }

  async list() {
    return this.#read();
  }

  async create(input) {
    const draft = normalizeOrderInput(input);
    const validationError = validateOrderInput(draft);
    if (validationError) throw new HttpError(400, validationError);

    return this.#enqueue(async () => {
      const orders = await this.#read();
      const order = {
        id: crypto.randomUUID(),
        ...draft,
        prepared: false,
        createdAt: new Date().toISOString(),
        preparedAt: null
      };

      orders.push(order);
      await this.#write(orders);
      return order;
    });
  }

  async update(orderId, changes) {
    return this.#enqueue(async () => {
      const orders = await this.#read();
      const index = orders.findIndex((order) => order.id === orderId);
      if (index < 0) throw new HttpError(404, "Objednávka nebyla nalezena.");

      const current = orders[index];
      const prepared = changes?.prepared === undefined ? current.prepared : Boolean(changes.prepared);
      const updated = {
        ...current,
        prepared,
        preparedAt: prepared ? current.preparedAt || new Date().toISOString() : null
      };

      orders[index] = updated;
      await this.#write(orders);
      return updated;
    });
  }

  async remove(orderId) {
    return this.#enqueue(async () => {
      const orders = await this.#read();
      const remaining = orders.filter((order) => order.id !== orderId);
      if (remaining.length === orders.length) throw new HttpError(404, "Objednávka nebyla nalezena.");

      await this.#write(remaining);
    });
  }

  #enqueue(operation) {
    const nextOperation = this.writeQueue.then(operation, operation);
    this.writeQueue = nextOperation.catch(() => undefined);
    return nextOperation;
  }

  async #read() {
    const raw = await fs.readFile(this.filePath, "utf8");

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw new HttpError(500, "Soubor objednávek je poškozený.");
    }
  }

  async #write(orders) {
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(orders, null, 2)}\n`, "utf8");

    try {
      await fs.rename(temporaryPath, this.filePath);
    } catch (error) {
      if (!["EEXIST", "EPERM"].includes(error.code)) throw error;
      await fs.rm(this.filePath, { force: true });
      await fs.rename(temporaryPath, this.filePath);
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
