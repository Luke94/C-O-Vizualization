import * as XLSX from "xlsx";
import { PN_COLUMN_CANDIDATES } from "../config/fields.js";
import { toComparable } from "./normalize.js";

const DEFAULT_FILE_NAME = "Příprava k upínání.xlsx";
export const DEFAULT_EXCEL_URL = `/mock/${encodeURIComponent(DEFAULT_FILE_NAME)}`;

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
  const pnColumn = findPnColumn(headers);

  return {
    sheetName: firstSheetName,
    rows,
    headers,
    pnColumn
  };
}

function findPnColumn(headers) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: toComparable(header)
  }));

  for (const candidate of PN_COLUMN_CANDIDATES) {
    const found = normalizedHeaders.find(({ normalized }) =>
      normalized === toComparable(candidate)
    );

    if (found) return found.original;
  }

  return "";
}
