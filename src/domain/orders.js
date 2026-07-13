import { EXCEL_COLUMNS } from "../config/fields.js";
import { displayValue, isFilled, toComparable } from "../utils/normalize.js";
import { findMatchingRecords } from "../utils/search.js";

export const DEFAULT_MASTER_INPUTS = {
  machine: "S-",
  currentTool: "",
  currentNoTool: false,
  nextTool: "",
  priority: "2"
};

export const EMPTY_RESOLUTION = {
  currentSide: null,
  nextSide: null,
  currentMatches: [],
  nextMatches: [],
  currentRecord: null,
  nextRecord: null,
  missingSides: [],
  noToolCurrent: false
};

export function buildOrderDraft(inputs) {
  return {
    machine: normalizeMachineInput(inputs.machine),
    currentTool: String(inputs.currentTool ?? "").trim(),
    currentNoTool: Boolean(inputs.currentNoTool),
    nextTool: String(inputs.nextTool ?? "").trim(),
    priority: String(inputs.priority ?? "2")
  };
}

export function validateOrderDraft(order) {
  if (!isFilled(order.machine) || toComparable(order.machine) === "s-") {
    return "Zadej číslo stroje.";
  }

  if (!order.currentNoTool && !isFilled(order.currentTool)) {
    return "Zadej aktuální číslo toolu, nebo označ možnost „Na stroji není tool“.";
  }

  if (!isFilled(order.nextTool)) {
    return "Zadej číslo toolu pro další výrobu.";
  }

  if (!["1", "2", "3"].includes(order.priority)) {
    return "Vyber prioritu 1, 2 nebo 3.";
  }

  return "";
}

export function sortOrders(orders) {
  return [...orders].sort((a, b) => {
    if (a.prepared !== b.prepared) return a.prepared ? -1 : 1;

    if (a.prepared && b.prepared) {
      return toTimestamp(b.preparedAt ?? b.createdAt) - toTimestamp(a.preparedAt ?? a.createdAt);
    }

    const priorityDifference = Number(a.priority) - Number(b.priority);
    if (priorityDifference !== 0) return priorityDifference;

    return toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
  });
}

export function normalizeMachineInput(value) {
  const enteredValue = String(value ?? "").trim();

  if (!enteredValue || toComparable(enteredValue) === "s-") {
    return "S-";
  }

  return toComparable(enteredValue).startsWith("s-") ? enteredValue : `S-${enteredValue}`;
}

export function getOrderInputOptions(rows, machineInput) {
  const machine = toComparable(machineInput);
  const hasSpecificMachine = isFilled(machine) && machine !== "s-";
  const rowsForMachine = hasSpecificMachine
    ? rows.filter((row) => toComparable(row[EXCEL_COLUMNS.machine]) === machine)
    : rows;

  return {
    machine: getUniqueValues(rows, EXCEL_COLUMNS.machine),
    currentTool: getUniqueValues(rowsForMachine, EXCEL_COLUMNS.tool),
    nextTool: getUniqueValues(rowsForMachine, EXCEL_COLUMNS.tool)
  };
}

export function resolveOrder(order, database, currentSelectedIndex = 0, nextSelectedIndex = 0) {
  const currentSide = resolveOrderSide(order, database, "current", currentSelectedIndex);
  const nextSide = resolveOrderSide(order, database, "next", nextSelectedIndex);

  return {
    currentSide,
    nextSide,
    currentMatches: currentSide.matches,
    nextMatches: nextSide.matches,
    currentRecord: currentSide.displayRecord,
    nextRecord: nextSide.displayRecord,
    missingSides: [currentSide, nextSide]
      .filter((side) => side.status === "not-found")
      .map(({ key, label, tool }) => ({ key, label, tool })),
    noToolCurrent: currentSide.status === "no-tool"
  };
}

function resolveOrderSide(order, database, side, selectedIndex) {
  if (side === "current" && order.currentNoTool) {
    return {
      key: "current",
      label: "Aktuálně nastaveno",
      tool: "NENÍ TOOL",
      status: "no-tool",
      matches: [],
      displayRecord: createSyntheticRecord(order, side, "Na stroji není tool")
    };
  }

  const tool = side === "current" ? order.currentTool : order.nextTool;
  const matches = findMatchingRecords(
    database.rows,
    { machine: order.machine, tool, pn: "" },
    database.pnColumn
  );

  if (matches.length === 0) {
    return {
      key: side,
      label: side === "current" ? "Aktuálně nastaveno" : "Další výroba",
      tool,
      status: "not-found",
      matches,
      displayRecord: createSyntheticRecord(order, side, "Kombinace nenalezena - doplnit formulář")
    };
  }

  return {
    key: side,
    label: side === "current" ? "Aktuálně nastaveno" : "Další výroba",
    tool,
    status: matches.length > 1 ? "multiple" : "found",
    matches,
    displayRecord: matches[selectedIndex] ?? matches[0]
  };
}

function createSyntheticRecord(order, side, text) {
  const record = Object.fromEntries(Object.values(EXCEL_COLUMNS).map((column) => [column, text]));

  record[EXCEL_COLUMNS.machine] = order.machine;
  record[EXCEL_COLUMNS.tool] = side === "current"
    ? order.currentNoTool
      ? "NENÍ TOOL"
      : order.currentTool
    : order.nextTool;

  return record;
}

function getUniqueValues(rows, key) {
  const values = new Set();

  for (const row of rows) {
    const value = displayValue(row[key]);
    if (value !== "—") values.add(value);
  }

  return [...values].sort((a, b) => a.localeCompare(b, "cs-CZ", { numeric: true, sensitivity: "base" }));
}

function toTimestamp(value) {
  const timestamp = new Date(value ?? 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
