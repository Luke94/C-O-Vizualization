import assert from "node:assert/strict";
import test from "node:test";
import { parseComment } from "../services/andonService.js";

test("parses a valid Andon comment", () => {
  assert.deepEqual(parseComment("S-067, A:20679, B:22371, 32mm, 2"), {
    machine: "S-067", currentTool: "20679", currentNoTool: false,
    nextTool: "22371", materialWidth: "32mm", priority: "2"
  });
});

test("A:0 means no current tool", () => {
  const parsed = parseComment("S-067, A:0, B:22371, 32mm, 1");
  assert.equal(parsed.currentNoTool, true);
  assert.equal(parsed.currentTool, "");
});

test("rejects malformed comments", () => {
  assert.throws(() => parseComment("S-067, 20679, B:22371, 32mm, 2"), /A:číslo/);
});
