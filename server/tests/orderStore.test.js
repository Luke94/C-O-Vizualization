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

  const prepared = await store.update(created.id, { prepared: true });
  assert.equal(prepared.prepared, true);
  assert.ok(prepared.preparedAt);

  await store.remove(created.id);
  assert.deepEqual(await store.list(), []);
});

test("invalid order is rejected", async (context) => {
  const { directory, store } = await createTemporaryStore();
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  await assert.rejects(
    store.create({ machine: "S-", currentTool: "", nextTool: "", priority: "9" }),
    /Zadej číslo stroje/
  );
});
