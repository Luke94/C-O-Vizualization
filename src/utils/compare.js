import { DEFAULT_DISPLAY_ROWS, FIELD_REFERENCE_IMAGES } from "../config/fields.js";
import { displayValue, toComparable } from "./normalize.js";

export function compareRecords(currentRecord, nextRecord, configuredRows = DEFAULT_DISPLAY_ROWS) {
  if (!currentRecord || !nextRecord) return [];

  return configuredRows.map((field) => {
    const excelColumn = field.sourceColumn;
    const currentValue = currentRecord[excelColumn];
    const nextValue = nextRecord[excelColumn];
    const same = toComparable(currentValue) === toComparable(nextValue);

    return {
      ...field,
      currentValue: displayValue(currentValue),
      nextValue: displayValue(nextValue),
      same,
      referenceImage: FIELD_REFERENCE_IMAGES[field.id] ?? null
    };
  });
}
