import readExcelFile from "read-excel-file/browser";
import { EXCEL_COLUMNS, FIELD_HEADER_ALIASES, PN_COLUMN_CANDIDATES } from "../config/fields.js";
import { toHeaderComparable } from "./normalize.js";

export async function loadRowsFromUrl(url, columnMapping = {}) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst sdílený Excel (${response.status}).`);
  }

  return parseWorkbook(await response.blob(), columnMapping);
}

export async function loadRowsFromFile(file, columnMapping = {}) {
  return parseWorkbook(file, columnMapping);
}

async function parseWorkbook(input, columnMapping) {
  const sheets = await readExcelFile(input);
  const firstSheet = sheets[0];

  if (!firstSheet) {
    throw new Error("Excel neobsahuje žádný list.");
  }

  const [headerRow = [], ...dataRows] = firstSheet.data;
  const headers = headerRow.map(toHeaderValue);
  const rows = dataRows
    .filter((row) => row.some((cell) => cell !== null && String(cell).trim() !== ""))
    .map((row) => rowToObject(headers, row));

  if (!headers.some(Boolean) || !rows.length) {
    throw new Error("První list Excelu neobsahuje použitelná data.");
  }

  const normalizedRows = normalizeWorkbookRows(rows, headers.filter(Boolean), columnMapping);
  const pnColumn = findPnColumn(headers.filter(Boolean), normalizedRows);

  return {
    sheetName: firstSheet.sheet,
    rows: normalizedRows,
    headers: headers.filter(Boolean),
    pnColumn
  };
}

function rowToObject(headers, row) {
  const record = {};

  headers.forEach((header, index) => {
    if (header) record[header] = normalizeCellValue(row[index]);
  });

  return record;
}

function normalizeCellValue(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toHeaderValue(value) {
  return String(value ?? "").trim();
}

function normalizeWorkbookRows(rows, headers, columnMapping) {
  const resolvedHeaders = resolveHeaders(headers, columnMapping);

  return rows.map((row) => {
    const normalizedRow = { ...row };

    for (const [fieldKey, expectedHeader] of Object.entries(EXCEL_COLUMNS)) {
      const actualHeader = resolvedHeaders[fieldKey];
      normalizedRow[expectedHeader] = actualHeader ? row[actualHeader] ?? "" : normalizedRow[expectedHeader] ?? "";
    }

    return normalizedRow;
  });
}

function resolveHeaders(headers, columnMapping = {}) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: toHeaderComparable(header)
  }));

  const resolved = {};

  for (const [fieldKey, aliases] of Object.entries(FIELD_HEADER_ALIASES)) {
    const configured = String(columnMapping[fieldKey] ?? "").trim();
    if (configured && headers.includes(configured)) {
      resolved[fieldKey] = configured;
      continue;
    }
    const found = aliases
      .map((alias) => toHeaderComparable(alias))
      .map((alias) => normalizedHeaders.find(({ normalized }) => normalized === alias))
      .find(Boolean);

    if (found) resolved[fieldKey] = found.original;
  }

  return resolved;
}

function findPnColumn(headers, rows) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: toHeaderComparable(header)
  }));

  for (const candidate of PN_COLUMN_CANDIDATES) {
    const found = normalizedHeaders.find(({ normalized }) => normalized === toHeaderComparable(candidate));
    if (found) return found.original;
  }

  const fallbackHeader = headers.find((header) => toHeaderComparable(header).includes("pn"));
  if (fallbackHeader) return fallbackHeader;

  return Object.keys(rows[0] ?? {}).find((header) => toHeaderComparable(header).includes("pn")) ?? "";
}
