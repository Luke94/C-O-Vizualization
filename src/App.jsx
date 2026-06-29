import { useEffect, useMemo, useState } from "react";
import ComparisonTable from "./components/ComparisonTable.jsx";
import MatchResolver from "./components/MatchResolver.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import { EXCEL_COLUMNS } from "./config/fields.js";
import { compareRecords } from "./utils/compare.js";
import { loadDefaultWorkbookRows, loadRowsFromFile } from "./utils/excel.js";
import { displayValue, isFilled, toComparable } from "./utils/normalize.js";
import { findMatchingRecords, getSearchStatus } from "./utils/search.js";

const DEFAULT_INPUTS = {
  machine: "S-",
  currentTool: "",
  currentPn: "",
  nextTool: "",
  nextPn: ""
};

export default function App() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [database, setDatabase] = useState({ rows: [], sheetName: "", headers: [], pnColumn: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(0);
  const [nextSelectedIndex, setNextSelectedIndex] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");
      const result = await loadDefaultWorkbookRows();
      setDatabase(result);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(key, value) {
    const normalizedValue = key === "machine" ? normalizeMachineInput(value) : value;
    setInputs((current) => ({ ...current, [key]: normalizedValue }));
    setHasSearched(false);
    setCurrentSelectedIndex(0);
    setNextSelectedIndex(0);
  }

  async function handleFileLoad(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError("");
      const result = await loadRowsFromFile(file);
      setDatabase(result);
      setHasSearched(false);
      setCurrentSelectedIndex(0);
      setNextSelectedIndex(0);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function handleSearch() {
    setHasSearched(true);
    setCurrentSelectedIndex(0);
    setNextSelectedIndex(0);
  }

  const currentMatches = useMemo(() => {
    if (!hasSearched) return [];
    return findMatchingRecords(
      database.rows,
      { machine: inputs.machine, tool: inputs.currentTool, pn: inputs.currentPn },
      database.pnColumn
    );
  }, [database.rows, database.pnColumn, hasSearched, inputs.machine, inputs.currentTool, inputs.currentPn]);

  const nextMatches = useMemo(() => {
    if (!hasSearched) return [];
    return findMatchingRecords(
      database.rows,
      { machine: inputs.machine, tool: inputs.nextTool, pn: inputs.nextPn },
      database.pnColumn
    );
  }, [database.rows, database.pnColumn, hasSearched, inputs.machine, inputs.nextTool, inputs.nextPn]);

  const currentStatus = hasSearched
    ? getSearchStatus(currentMatches, { machine: inputs.machine, tool: inputs.currentTool })
    : "waiting";

  const nextStatus = hasSearched
    ? getSearchStatus(nextMatches, { machine: inputs.machine, tool: inputs.nextTool })
    : "waiting";

  const currentRecord = currentMatches[currentSelectedIndex] ?? null;
  const nextRecord = nextMatches[nextSelectedIndex] ?? null;
  const comparisonRows = compareRecords(currentRecord, nextRecord);

  const filterOptions = useMemo(() => {
    const machine = toComparable(inputs.machine);
    const currentTool = toComparable(inputs.currentTool);
    const nextTool = toComparable(inputs.nextTool);
    const isSpecificMachine = isFilled(machine) && machine !== "s-";
    const rowsForMachine = isSpecificMachine
      ? database.rows.filter((row) => toComparable(row[EXCEL_COLUMNS.machine]) === machine)
      : database.rows;

    const currentRows = isFilled(currentTool)
      ? rowsForMachine.filter((row) => toComparable(row[EXCEL_COLUMNS.tool]) === currentTool)
      : rowsForMachine;

    const nextRows = isFilled(nextTool)
      ? rowsForMachine.filter((row) => toComparable(row[EXCEL_COLUMNS.tool]) === nextTool)
      : rowsForMachine;

    return {
      machine: getUniqueValues(database.rows, EXCEL_COLUMNS.machine),
      currentTool: getUniqueValues(rowsForMachine, EXCEL_COLUMNS.tool),
      nextTool: getUniqueValues(rowsForMachine, EXCEL_COLUMNS.tool),
      currentPn: getUniqueValues(currentRows, database.pnColumn),
      nextPn: getUniqueValues(nextRows, database.pnColumn)
    };
  }, [database.pnColumn, database.rows, inputs.currentTool, inputs.machine, inputs.nextTool]);

  const meta = {
    sheetName: database.sheetName,
    rowCount: database.rows.length,
    pnColumn: database.pnColumn
  };

  return (
    <div className="app-layout">
      <section className="work-area">
        <ComparisonTable rows={comparisonRows} currentRecord={currentRecord} nextRecord={nextRecord} />

        <div className="messages">
          {error && <div className="message error">{error}</div>}
          <MatchResolver
            title="Aktuálně nastaveno"
            status={currentStatus}
            matches={currentMatches}
            selectedIndex={currentSelectedIndex}
            onSelect={setCurrentSelectedIndex}
          />
          <MatchResolver
            title="Další výroba"
            status={nextStatus}
            matches={nextMatches}
            selectedIndex={nextSelectedIndex}
            onSelect={setNextSelectedIndex}
          />
        </div>
      </section>

      <SearchPanel
        inputs={inputs}
        onInputChange={handleInputChange}
        onSearch={handleSearch}
        onFileLoad={handleFileLoad}
        loading={loading}
        meta={meta}
        options={filterOptions}
      />
    </div>
  );
}

function normalizeMachineInput(value) {
  const enteredValue = String(value ?? "").trim();

  if (!enteredValue || toComparable(enteredValue) === "s-") {
    return "S-";
  }

  return toComparable(enteredValue).startsWith("s-") ? enteredValue : `S-${enteredValue}`;
}

function getUniqueValues(rows, key) {
  if (!key) return [];

  const values = new Set();

  for (const row of rows) {
    const value = displayValue(row[key]);
    if (value !== "—") {
      values.add(value);
    }
  }

  return [...values].sort((a, b) => a.localeCompare(b, "cs-CZ", { numeric: true, sensitivity: "base" }));
}
