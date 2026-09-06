import { useEffect, useMemo, useState } from "react";
import ModeSwitch from "./components/layout/ModeSwitch.jsx";
import SetterView from "./components/setter/SetterView.jsx";
import PseView from "./components/pse/PseView.jsx";
import { compareRecords } from "./utils/compare.js";
import {
  EMPTY_RESOLUTION,
  resolveOrder
} from "./domain/orders.js";
import { useOrders } from "./hooks/useOrders.js";
import { useWorkbook } from "./hooks/useWorkbook.js";

export default function App() {
  const [mode, setMode] = useState("setter");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(0);
  const [nextSelectedIndex, setNextSelectedIndex] = useState(0);
  const [actionPending, setActionPending] = useState(false);

  const ordersState = useOrders();
  const workbookState = useWorkbook();
  const orders = ordersState.orders;

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId("");
      return;
    }

    const selectedStillExists = orders.some((order) => order.id === selectedOrderId);
    if (!selectedOrderId || !selectedStillExists) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  useEffect(() => {
    setCurrentSelectedIndex(0);
    setNextSelectedIndex(0);
  }, [selectedOrderId]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? orders[0] ?? null;

  const selectedResolution = useMemo(() => {
    if (!selectedOrder) return EMPTY_RESOLUTION;
    return resolveOrder(selectedOrder, workbookState.database, currentSelectedIndex, nextSelectedIndex);
  }, [currentSelectedIndex, nextSelectedIndex, selectedOrder, workbookState.database]);

  const comparisonRows = useMemo(
    () => compareRecords(selectedResolution.currentRecord, selectedResolution.nextRecord, workbookState.displayRows),
    [selectedResolution.currentRecord, selectedResolution.nextRecord, workbookState.displayRows]
  );

  const visibleError = workbookState.error || ordersState.error;
  async function handleMarkReady() {
    if (!selectedOrder) return;

    try {
      setActionPending(true);
      await ordersState.markReady(selectedOrder.id);
    } catch (requestError) {
      ordersState.setError(requestError.message);
    } finally {
      setActionPending(false);
    }
  }

  async function handleRemoveOrder() {
    if (!selectedOrder) return;

    try {
      setActionPending(true);
      await ordersState.remove(selectedOrder.id);
    } catch (requestError) {
      ordersState.setError(requestError.message);
    } finally {
      setActionPending(false);
    }
  }

  async function handleFileLoad(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await workbookState.replace(file);
      setCurrentSelectedIndex(0);
      setNextSelectedIndex(0);
    } catch {
      // Chybu už zobrazuje useWorkbook.
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="app-shell">
      <ModeSwitch
        mode={mode}
        onModeChange={setMode}
        orderCount={orders.length}
        connected={!ordersState.error}
      />

      {mode === "pse" ? (
        <PseView meta={workbookState.meta} headers={workbookState.database.headers} columnMapping={workbookState.columnMapping} displayRows={workbookState.displayRows} onSettingsApplied={async (mapping, rows) => { await workbookState.saveMapping(mapping); workbookState.applyDisplayRows(rows); }} onFileLoad={handleFileLoad} uploading={workbookState.uploading} />
      ) : (
        <SetterView
          error={visibleError}
          orders={orders}
          selectedOrder={selectedOrder}
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
          onMarkReady={handleMarkReady}
          onRemoveOrder={handleRemoveOrder}
          actionPending={actionPending}
          resolution={selectedResolution}
          currentSelectedIndex={currentSelectedIndex}
          nextSelectedIndex={nextSelectedIndex}
          onSelectCurrent={setCurrentSelectedIndex}
          onSelectNext={setNextSelectedIndex}
          comparisonRows={comparisonRows}
          meta={workbookState.meta}
          onFileLoad={handleFileLoad}
          uploading={workbookState.uploading}
        />
      )}

    </div>
  );
}
