import * as XLSX from "xlsx";
import defaultWorkbookUrl from "../assets/preparation.xlsx?url";
import { EXCEL_COLUMNS, FIELD_HEADER_ALIASES, PN_COLUMN_CANDIDATES } from "../config/fields.js";
import { toHeaderComparable } from "./normalize.js";

export const DEFAULT_EXCEL_URL = defaultWorkbookUrl;

export async function loadDefaultWorkbookRows() {
  const response = await fetch(DEFAULT_EXCEL_URL);

  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst výchozí Excel: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  return parseWorkbook(buffer);
}

export async function loadRowsFromFile(file) {
  const buffer = await file.arrayBuffer();
  return parseWorkbook(buffer);
}

function parseWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Excel neobsahuje žádný list.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const normalizedRows = normalizeWorkbookRows(rows, headers);
  const pnColumn = findPnColumn(headers, normalizedRows);

  return {
    sheetName: firstSheetName,
    rows: normalizedRows,
    headers,
    pnColumn
  };
}

function normalizeWorkbookRows(rows, headers) {
  const resolvedHeaders = resolveHeaders(headers);

  return rows.map((row) => {
    const normalizedRow = { ...row };

    for (const [fieldKey, expectedHeader] of Object.entries(EXCEL_COLUMNS)) {
      const actualHeader = resolvedHeaders[fieldKey];
      if (actualHeader) {
        normalizedRow[expectedHeader] = row[actualHeader] ?? "";
      } else if (!(expectedHeader in normalizedRow)) {
        normalizedRow[expectedHeader] = "";
      }
    }

    return normalizedRow;
  });
}

function resolveHeaders(headers) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: toHeaderComparable(header)
  }));

  const resolved = {};

  for (const [fieldKey, aliases] of Object.entries(FIELD_HEADER_ALIASES)) {
    for (const alias of aliases) {
      const found = normalizedHeaders.find(({ normalized }) => normalized === toHeaderComparable(alias));
      if (found) {
        resolved[fieldKey] = found.original;
        break;
      }
    }
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

  const fallbackHeader = headers.find((header) => {
    const comparable = toHeaderComparable(header);
    return comparable.includes("pn");
  });

  if (fallbackHeader) return fallbackHeader;

  const firstRow = rows[0] ?? {};
  const firstDetected = Object.keys(firstRow).find((header) => toHeaderComparable(header).includes("pn"));
  return firstDetected ?? "";
}
