import { COMPARE_FIELDS, EXCEL_COLUMNS } from "../config/fields.js";
import { displayValue, toComparable } from "./normalize.js";

export function compareRecords(currentRecord, nextRecord) {
  if (!currentRecord || !nextRecord) return [];

  return COMPARE_FIELDS.map((field) => {
    const excelColumn = EXCEL_COLUMNS[field.key];
    const currentValue = currentRecord[excelColumn];
    const nextValue = nextRecord[excelColumn];
    const same = toComparable(currentValue) === toComparable(nextValue);

    return {
      ...field,
      currentValue: displayValue(currentValue),
      nextValue: displayValue(nextValue),
      same
    };
  });
}
