import { EXCEL_COLUMNS } from "../config/fields.js";
import { displayValue } from "../utils/normalize.js";

export default function MatchResolver({ title, status, matches, selectedIndex, onSelect }) {
  if (status === "waiting" || status === "found") return null;

  if (status === "not-found") {
    return <div className="message error">{title}: záznam nebyl nalezen.</div>;
  }

  return (
    <div className="message warning">
      <strong>{title}: nalezeno více záznamů.</strong>
      <span>Vyber, který se má použít:</span>
      <select value={selectedIndex} onChange={(event) => onSelect(Number(event.target.value))}>
        {matches.map((record, index) => (
          <option key={`${record[EXCEL_COLUMNS.machine]}-${record[EXCEL_COLUMNS.tool]}-${index}`} value={index}>
            {displayValue(record[EXCEL_COLUMNS.machine])} | {displayValue(record[EXCEL_COLUMNS.tool])} | {displayValue(record[EXCEL_COLUMNS.author])} | sada: {displayValue(record[EXCEL_COLUMNS.setNumber])}
          </option>
        ))}
      </select>
    </div>
  );
}
