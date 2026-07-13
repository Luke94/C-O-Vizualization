import { useEffect, useMemo, useState } from "react";
import ComparisonTable from "./components/ComparisonTable.jsx";
import MatchResolver from "./components/MatchResolver.jsx";
import { EXCEL_COLUMNS } from "./config/fields.js";
import { compareRecords } from "./utils/compare.js";
import { loadDefaultWorkbookRows, loadRowsFromFile } from "./utils/excel.js";
import { displayValue, isFilled, toComparable } from "./utils/normalize.js";
import { findMatchingRecords } from "./utils/search.js";

const ORDER_STORAGE_KEY = "co-demo-orders-v1";

const DEFAULT_MASTER_INPUTS = {
  machine: "S-",
  currentTool: "",
  currentNoTool: false,
  nextTool: "",
  priority: "2"
};

const EMPTY_RESOLUTION = {
  currentSide: null,
  nextSide: null,
  currentMatches: [],
  nextMatches: [],
  currentRecord: null,
  nextRecord: null,
  missingSides: [],
  noToolCurrent: false
};

export default function App() {
  const [mode, setMode] = useState("master");
  const [masterInputs, setMasterInputs] = useState(DEFAULT_MASTER_INPUTS);
  const [database, setDatabase] = useState({ rows: [], sheetName: "", headers: [], pnColumn: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState(loadStoredOrders);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(0);
  const [nextSelectedIndex, setNextSelectedIndex] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    saveStoredOrders(orders);
  }, [orders]);

  const sortedOrders = useMemo(() => sortOrders(orders), [orders]);

  useEffect(() => {
    if (!sortedOrders.length) {
      setSelectedOrderId("");
      return;
    }

    const selectedStillExists = sortedOrders.some((order) => order.id === selectedOrderId);
    if (!selectedOrderId || !selectedStillExists) {
      setSelectedOrderId(sortedOrders[0].id);
    }
  }, [selectedOrderId, sortedOrders]);

  useEffect(() => {
    setCurrentSelectedIndex(0);
    setNextSelectedIndex(0);
  }, [selectedOrderId]);

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

  async function handleFileLoad(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError("");
      const result = await loadRowsFromFile(file);
      setDatabase(result);
      setCurrentSelectedIndex(0);
      setNextSelectedIndex(0);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  function handleMasterInputChange(key, value) {
    setToast("");

    if (key === "machine") {
      setMasterInputs((current) => ({ ...current, machine: normalizeMachineInput(value) }));
      return;
    }

    if (key === "currentNoTool") {
      setMasterInputs((current) => ({
        ...current,
        currentNoTool: value,
        currentTool: value ? "" : current.currentTool
      }));
      return;
    }

    setMasterInputs((current) => ({ ...current, [key]: value }));
  }

  function handleCreateOrder() {
    setToast("");
    setError("");

    const draftOrder = buildOrderFromInputs(masterInputs);
    const validationError = validateOrderDraft(draftOrder);

    if (validationError) {
      setError(validationError);
      return;
    }

    const resolution = resolveOrder(draftOrder, database, 0, 0);

    if (resolution.missingSides.length > 0) {
      setPendingConfirmation({ order: draftOrder, resolution });
      return;
    }

    addOrder(draftOrder);
  }

  function confirmPendingOrder() {
    if (!pendingConfirmation) return;
    addOrder(pendingConfirmation.order);
    setPendingConfirmation(null);
  }

  function addOrder(order) {
    setOrders((current) => [order, ...current]);
    setSelectedOrderId(order.id);
    setMasterInputs((current) => ({
      ...DEFAULT_MASTER_INPUTS,
      machine: current.machine && current.machine !== "S-" ? current.machine : "S-"
    }));
    setToast("Objednávka byla odeslána seřizovači.");
  }

  function markSelectedOrderReady() {
    if (!selectedOrderId) return;

    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrderId
          ? { ...order, prepared: true, preparedAt: order.preparedAt ?? new Date().toISOString() }
          : order
      )
    );
  }

  function removeSelectedOrder() {
    if (!selectedOrderId) return;
    setOrders((current) => current.filter((order) => order.id !== selectedOrderId));
  }

  const selectedOrder = sortedOrders.find((order) => order.id === selectedOrderId) ?? sortedOrders[0] ?? null;

  const selectedResolution = useMemo(() => {
    if (!selectedOrder) return EMPTY_RESOLUTION;
    return resolveOrder(selectedOrder, database, currentSelectedIndex, nextSelectedIndex);
  }, [currentSelectedIndex, database, nextSelectedIndex, selectedOrder]);

  const comparisonRows = compareRecords(selectedResolution.currentRecord, selectedResolution.nextRecord);

  const masterOptions = useMemo(() => {
    const machine = toComparable(masterInputs.machine);
    const isSpecificMachine = isFilled(machine) && machine !== "s-";
    const rowsForMachine = isSpecificMachine
      ? database.rows.filter((row) => toComparable(row[EXCEL_COLUMNS.machine]) === machine)
      : database.rows;

    return {
      machine: getUniqueValues(database.rows, EXCEL_COLUMNS.machine),
      currentTool: getUniqueValues(rowsForMachine, EXCEL_COLUMNS.tool),
      nextTool: getUniqueValues(rowsForMachine, EXCEL_COLUMNS.tool)
    };
  }, [database.rows, masterInputs.machine]);

  const meta = {
    sheetName: database.sheetName,
    rowCount: database.rows.length,
    pnColumn: database.pnColumn
  };

  return (
    <div className="app-shell">
      <ModeSwitch mode={mode} onModeChange={setMode} orderCount={orders.length} />

      {mode === "master" ? (
        <MasterView
          inputs={masterInputs}
          onInputChange={handleMasterInputChange}
          onCreateOrder={handleCreateOrder}
          loading={loading}
          error={error}
          toast={toast}
          orders={sortedOrders}
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
          options={masterOptions}
          meta={meta}
          onFileLoad={handleFileLoad}
        />
      ) : (
        <SetterView
          error={error}
          orders={sortedOrders}
          selectedOrder={selectedOrder}
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
          onMarkReady={markSelectedOrderReady}
          onRemoveOrder={removeSelectedOrder}
          resolution={selectedResolution}
          currentSelectedIndex={currentSelectedIndex}
          nextSelectedIndex={nextSelectedIndex}
          onSelectCurrent={setCurrentSelectedIndex}
          onSelectNext={setNextSelectedIndex}
          comparisonRows={comparisonRows}
          meta={meta}
          onFileLoad={handleFileLoad}
        />
      )}

      {pendingConfirmation ? (
        <OrderConfirmationModal
          order={pendingConfirmation.order}
          resolution={pendingConfirmation.resolution}
          onCancel={() => setPendingConfirmation(null)}
          onConfirm={confirmPendingOrder}
        />
      ) : null}
    </div>
  );
}

function ModeSwitch({ mode, onModeChange, orderCount }) {
  return (
    <header className="mode-switch-bar">
      <div>
        <strong>C/O Visualization</strong>
        <span>Demo režim objednávek</span>
      </div>
      <nav className="mode-switch" aria-label="Přepnutí role">
        <button
          type="button"
          className={mode === "master" ? "active" : ""}
          onClick={() => onModeChange("master")}
        >
          Mistr
        </button>
        <button
          type="button"
          className={mode === "setter" ? "active" : ""}
          onClick={() => onModeChange("setter")}
        >
          Seřizovač <span>{orderCount}</span>
        </button>
      </nav>
    </header>
  );
}

function MasterView({
  inputs,
  onInputChange,
  onCreateOrder,
  loading,
  error,
  toast,
  orders,
  selectedOrderId,
  onSelectOrder,
  options,
  meta,
  onFileLoad
}) {
  return (
    <div className="master-layout">
      <main className="master-canvas">
        <section className="master-form-stack">
          <section className="machine-card machine-card-main master-machine-card">
            <label htmlFor="master-machine">Číslo stroje</label>
            <FilterInput
              id="master-machine"
              value={inputs.machine}
              onChange={(value) => onInputChange("machine", value)}
              placeholder="např. S-002AB"
              listId="master-machine-options"
              options={options.machine}
            />
          </section>

          <section className="machine-card">
            <h2>Aktuálně nastaveno</h2>
            <label htmlFor="master-current-tool">Číslo nástroje</label>
            <FilterInput
              id="master-current-tool"
              value={inputs.currentTool}
              onChange={(value) => onInputChange("currentTool", value)}
              placeholder={inputs.currentNoTool ? "Na stroji není tool" : "např. 20304"}
              listId="master-current-tool-options"
              options={options.currentTool}
              disabled={inputs.currentNoTool}
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={inputs.currentNoTool}
                onChange={(event) => onInputChange("currentNoTool", event.target.checked)}
              />
              <span>Na stroji není tool</span>
            </label>
          </section>

          <section className="machine-card">
            <h2>Další výroba</h2>
            <label htmlFor="master-next-tool">Číslo nástroje</label>
            <FilterInput
              id="master-next-tool"
              value={inputs.nextTool}
              onChange={(value) => onInputChange("nextTool", value)}
              placeholder="např. 275758"
              listId="master-next-tool-options"
              options={options.nextTool}
            />
          </section>

          <section className="machine-card priority-card">
            <h2>Priorita</h2>
            <div className="priority-buttons">
              {["1", "2", "3"].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={inputs.priority === priority ? "active" : ""}
                  onClick={() => onInputChange("priority", priority)}
                >
                  {priority}
                </button>
              ))}
            </div>
          </section>
        </section>

        <div className="master-feedback">
          {error && <div className="message error">{error}</div>}
          {toast && <div className="message success">{toast}</div>}
        </div>
      </main>

      <aside className="side-panel master-side-panel">
        <OrderList orders={orders} selectedOrderId={selectedOrderId} onSelectOrder={onSelectOrder} />
        <button className="search-button send-order-button" type="button" onClick={onCreateOrder} disabled={loading}>
          {loading ? "Načítám..." : "Poslat"}
        </button>
        <DataSourceCard meta={meta} onFileLoad={onFileLoad} />
      </aside>
    </div>
  );
}

function SetterView({
  error,
  orders,
  selectedOrder,
  selectedOrderId,
  onSelectOrder,
  onMarkReady,
  onRemoveOrder,
  resolution,
  currentSelectedIndex,
  nextSelectedIndex,
  onSelectCurrent,
  onSelectNext,
  comparisonRows,
  meta,
  onFileLoad
}) {
  return (
    <div className="app-layout setter-layout">
      <section className="work-area">
        <ComparisonTable
          rows={comparisonRows}
          currentRecord={resolution.currentRecord}
          nextRecord={resolution.nextRecord}
          emptyTitle="Seřizovač"
          emptyMessage="Vyber objednávku od mistra. Po výběru se zobrazí porovnání aktuálního a dalšího toolu."
        />

        <div className="messages">
          {error && <div className="message error">{error}</div>}
          {!selectedOrder && <div className="message warning">Zatím není vytvořená žádná objednávka.</div>}
          <OrderWarnings order={selectedOrder} resolution={resolution} />
          <MatchResolver
            title="Aktuálně nastaveno"
            status={resolution.currentSide?.status ?? "waiting"}
            matches={resolution.currentMatches}
            selectedIndex={currentSelectedIndex}
            onSelect={onSelectCurrent}
          />
          <MatchResolver
            title="Další výroba"
            status={resolution.nextSide?.status ?? "waiting"}
            matches={resolution.nextMatches}
            selectedIndex={nextSelectedIndex}
            onSelect={onSelectNext}
          />
        </div>
      </section>

      <aside className="side-panel setter-side-panel">
        <SelectedOrderCards order={selectedOrder} />
        <OrderList orders={orders} selectedOrderId={selectedOrderId} onSelectOrder={onSelectOrder} />
        <div className="setter-actions">
          <button className="ready-button" type="button" onClick={onMarkReady} disabled={!selectedOrder || selectedOrder.prepared}>
            {selectedOrder?.prepared ? "Připraveno ✓" : "Označit připraveno ✓"}
          </button>
          <button className="done-button" type="button" onClick={onRemoveOrder} disabled={!selectedOrder}>
            Dokončeno / odstranit
          </button>
        </div>
        <DataSourceCard meta={meta} onFileLoad={onFileLoad} compact />
      </aside>
    </div>
  );
}

function SelectedOrderCards({ order }) {
  if (!order) {
    return (
      <section className="selected-order-empty">
        <h2>Žádná objednávka</h2>
        <p>Mistr zatím nic neposlal.</p>
      </section>
    );
  }

  return (
    <section className="selected-order-cards">
      <div className="mini-info-card big-title">{order.machine}</div>
      <div className="mini-info-card">
        <strong>Aktuálně nastaveno</strong>
        <span>{order.currentNoTool ? "NENÍ TOOL" : order.currentTool}</span>
      </div>
      <div className="mini-info-card">
        <strong>Další výroba</strong>
        <span>{order.nextTool}</span>
      </div>
    </section>
  );
}

function OrderList({ orders, selectedOrderId, onSelectOrder }) {
  return (
    <section className="order-list-card">
      <h2>Objednávky</h2>
      {orders.length === 0 ? (
        <p className="empty-orders">Zatím není žádná objednávka.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              className={`order-item priority-${order.priority} ${order.prepared ? "prepared" : ""} ${
                selectedOrderId === order.id ? "selected" : ""
              }`}
              onClick={() => onSelectOrder(order.id)}
            >
              <span className="order-machine">{order.machine}</span>
              <span className="order-tools">
                {order.currentNoTool ? "NENÍ TOOL" : order.currentTool} → {order.nextTool}
              </span>
              <span className="order-meta">
                {order.prepared ? "Připraveno" : `Priorita ${order.priority}`}
                {order.prepared ? <b>✓</b> : null}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function OrderWarnings({ order, resolution }) {
  if (!order) return null;

  return (
    <>
      {resolution.noToolCurrent ? (
        <div className="message warning">
          <strong>Aktuálně nastaveno: na stroji není tool.</strong>
          <span>Porovnání ukazuje kompletní přípravu pro další výrobu.</span>
        </div>
      ) : null}

      {resolution.missingSides.map((side) => (
        <div className="message error" key={side.key}>
          <strong>Kombinace Lis - Tool nenalezena: {order.machine} / {side.tool}</strong>
          <span>
            Vezmi si prosím formulář a vyplň sloupce na straně „{side.label}“. Druhá nalezená strana se v porovnání pořád zobrazuje.
          </span>
        </div>
      ))}
    </>
  );
}

function OrderConfirmationModal({ order, resolution, onCancel, onConfirm }) {
  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true">
      <section className="confirm-modal">
        <h2>Kontrola zadaných informací</h2>
        <p>Některá kombinace lis + tool není v databázi. Zkontroluj zadání, případně potvrď odeslání.</p>

        <div className="confirm-summary">
          <div>
            <strong>Stroj</strong>
            <span>{order.machine}</span>
          </div>
          <div>
            <strong>Aktuálně nastaveno</strong>
            <span>{order.currentNoTool ? "NENÍ TOOL" : order.currentTool}</span>
          </div>
          <div>
            <strong>Další výroba</strong>
            <span>{order.nextTool}</span>
          </div>
          <div>
            <strong>Priorita</strong>
            <span>{order.priority}</span>
          </div>
        </div>

        {resolution.missingSides.map((side) => (
          <div className="message error" key={side.key}>
            Kombinace Lis - Tool nenalezena: {order.machine} / {side.tool} ({side.label})
          </div>
        ))}

        <div className="confirm-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Zpět upravit
          </button>
          <button type="button" className="primary-button" onClick={onConfirm}>
            Potvrdit a odeslat
          </button>
        </div>
      </section>
    </div>
  );
}

function DataSourceCard({ meta, onFileLoad, compact = false }) {
  return (
    <section className={`file-card ${compact ? "compact" : ""}`}>
      <p>Zdroj dat: {meta.sheetName ? `list ${meta.sheetName}` : "nenačteno"}</p>
      {!compact && <p>Řádků v databázi: {meta.rowCount}</p>}
      <label className="file-load-button">
        Načíst jiný Excel
        <input type="file" accept=".xlsx,.xls" onChange={onFileLoad} />
      </label>
    </section>
  );
}

function FilterInput({ id, value, onChange, placeholder, listId, options, disabled = false }) {
  return (
    <>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={disabled ? undefined : listId}
        disabled={disabled}
      />
      {!disabled ? (
        <datalist id={listId}>
          {options.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}

function resolveOrder(order, database, currentSelectedIndex, nextSelectedIndex) {
  const currentSide = resolveOrderSide(order, database, "current", currentSelectedIndex);
  const nextSide = resolveOrderSide(order, database, "next", nextSelectedIndex);

  return {
    currentSide,
    nextSide,
    currentMatches: currentSide.matches,
    nextMatches: nextSide.matches,
    currentRecord: currentSide.displayRecord,
    nextRecord: nextSide.displayRecord,
    missingSides: [currentSide, nextSide].filter((side) => side.status === "not-found").map(toMissingSide),
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

  if (matches.length > 1) {
    return {
      key: side,
      label: side === "current" ? "Aktuálně nastaveno" : "Další výroba",
      tool,
      status: "multiple",
      matches,
      displayRecord: matches[selectedIndex] ?? matches[0]
    };
  }

  return {
    key: side,
    label: side === "current" ? "Aktuálně nastaveno" : "Další výroba",
    tool,
    status: "found",
    matches,
    displayRecord: matches[0]
  };
}

function createSyntheticRecord(order, side, text) {
  const record = {};

  for (const column of Object.values(EXCEL_COLUMNS)) {
    record[column] = text;
  }

  record[EXCEL_COLUMNS.machine] = order.machine;
  record[EXCEL_COLUMNS.tool] = side === "current"
    ? order.currentNoTool
      ? "NENÍ TOOL"
      : order.currentTool
    : order.nextTool;

  return record;
}

function toMissingSide(side) {
  return {
    key: side.key,
    label: side.label,
    tool: side.tool
  };
}

function buildOrderFromInputs(inputs) {
  return {
    id: createOrderId(),
    machine: normalizeMachineInput(inputs.machine),
    currentTool: String(inputs.currentTool ?? "").trim(),
    currentNoTool: Boolean(inputs.currentNoTool),
    nextTool: String(inputs.nextTool ?? "").trim(),
    priority: inputs.priority,
    prepared: false,
    createdAt: new Date().toISOString()
  };
}

function validateOrderDraft(order) {
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

function sortOrders(orders) {
  return [...orders].sort((a, b) => {
    if (a.prepared !== b.prepared) return a.prepared ? -1 : 1;

    if (a.prepared && b.prepared) {
      return new Date(b.preparedAt ?? b.createdAt).getTime() - new Date(a.preparedAt ?? a.createdAt).getTime();
    }

    const priorityDiff = Number(a.priority) - Number(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
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

function createOrderId() {
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadStoredOrders() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredOrders(orders) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Demo aplikace může fungovat i bez localStorage.
  }
}
