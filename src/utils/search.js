import { EXCEL_COLUMNS } from "../config/fields.js";
import { isFilled, toComparable } from "./normalize.js";

export function findMatchingRecords(rows, filters, pnColumn) {
  const machine = toComparable(filters.machine);
  const tool = toComparable(filters.tool);
  const pn = toComparable(filters.pn);

  return rows.filter((row) => {
    const machineMatches = toComparable(row[EXCEL_COLUMNS.machine]) === machine;
    const toolMatches = toComparable(row[EXCEL_COLUMNS.tool]) === tool;

    if (!machineMatches || !toolMatches) return false;

    if (pnColumn && isFilled(pn)) {
      return toComparable(row[pnColumn]) === pn;
    }

    return true;
  });
}

export function getSearchStatus(matches, filters) {
  if (!isFilled(filters.machine) || !isFilled(filters.tool)) return "waiting";
  if (matches.length === 0) return "not-found";
  if (matches.length > 1) return "multiple";
  return "found";
}
