import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { OrderStore } from "../services/orderStore.js";

async function createTemporaryStore() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "co-orders-"));
  const store = new OrderStore(path.join(directory, "orders.json"));
  await store.initialize();
  return { directory, store };
}

test("order lifecycle is persisted", async (context) => {
  const { directory, store } = await createTemporaryStore();
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  const created = await store.create({
    machine: "001AA",
    currentTool: "100",
    currentNoTool: false,
    nextTool: "200",
    priority: "1"
  });

  assert.equal(created.machine, "S-001AA");
  assert.equal((await store.list()).length, 1);

  const started = await store.start(created.id);
  assert.ok(started.startedAt);

  const completed = await store.complete(created.id);
  assert.ok(completed.completedAt);
  assert.ok(completed.durationMs >= 0);
  assert.deepEqual(await store.list(), []);
  assert.equal((await store.listHistory()).length, 1);
});

test("opening an order again resets its timer", async (context) => {
  const { directory, store } = await createTemporaryStore();
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const created = await store.create({ machine: "001", currentTool: "100", nextTool: "200", priority: "2" });
  const first = await store.start(created.id);
  await new Promise((resolve) => setTimeout(resolve, 5));
  const second = await store.start(created.id);
  assert.ok(new Date(second.startedAt) >= new Date(first.startedAt));
});

test("invalid order is rejected", async (context) => {
  const { directory, store } = await createTemporaryStore();
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  await assert.rejects(
    store.create({ machine: "S-", currentTool: "", nextTool: "", priority: "9" }),
    /Zadej číslo stroje/
  );
});
