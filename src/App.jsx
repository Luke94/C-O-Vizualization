import { useEffect, useMemo, useState } from "react";
import ComparisonTable from "./components/ComparisonTable.jsx";
import MatchResolver from "./components/MatchResolver.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import { compareRecords } from "./utils/compare.js";
import { loadDefaultWorkbookRows, loadRowsFromFile } from "./utils/excel.js";
import { findMatchingRecords, getSearchStatus } from "./utils/search.js";

const DEFAULT_INPUTS = {
  machine: "",
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
    setInputs((current) => ({ ...current, [key]: value }));
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
      />
    </div>
  );
}
