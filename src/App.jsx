import { useEffect, useMemo, useState } from "react";
import ModeSwitch from "./components/layout/ModeSwitch.jsx";
import MasterView from "./components/master/MasterView.jsx";
import OrderConfirmationModal from "./components/master/OrderConfirmationModal.jsx";
import SetterView from "./components/setter/SetterView.jsx";
import { compareRecords } from "./utils/compare.js";
import {
  buildOrderDraft,
  DEFAULT_MASTER_INPUTS,
  EMPTY_RESOLUTION,
  getOrderInputOptions,
  normalizeMachineInput,
  resolveOrder,
  validateOrderDraft
} from "./domain/orders.js";
import { useOrders } from "./hooks/useOrders.js";
import { useWorkbook } from "./hooks/useWorkbook.js";

export default function App() {
  const [mode, setMode] = useState("master");
  const [masterInputs, setMasterInputs] = useState(DEFAULT_MASTER_INPUTS);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState(0);
  const [nextSelectedIndex, setNextSelectedIndex] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    () => compareRecords(selectedResolution.currentRecord, selectedResolution.nextRecord),
    [selectedResolution.currentRecord, selectedResolution.nextRecord]
  );

  const masterOptions = useMemo(
    () => getOrderInputOptions(workbookState.database.rows, masterInputs.machine),
    [masterInputs.machine, workbookState.database.rows]
  );

  const visibleError = workbookState.error || ordersState.error;
  const applicationLoading = workbookState.loading || ordersState.loading;

  function handleMasterInputChange(key, value) {
    setToast("");
    ordersState.setError("");

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
    ordersState.setError("");

    const draft = buildOrderDraft(masterInputs);
    const validationError = validateOrderDraft(draft);

    if (validationError) {
      ordersState.setError(validationError);
      return;
    }

    const resolution = resolveOrder(draft, workbookState.database);
    if (resolution.missingSides.length > 0) {
      setPendingConfirmation({ order: draft, resolution });
      return;
    }

    submitOrder(draft);
  }

  async function submitOrder(draft) {
    try {
      setSubmitting(true);
      const createdOrder = await ordersState.add(draft);
      setSelectedOrderId(createdOrder.id);
      setPendingConfirmation(null);
      setMasterInputs((current) => ({
        ...DEFAULT_MASTER_INPUTS,
        machine: current.machine && current.machine !== "S-" ? current.machine : "S-"
      }));
      setToast("Objednávka byla odeslána seřizovači.");
    } catch (requestError) {
      ordersState.setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

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
      setToast("Sdílený Excel byl aktualizován.");
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

      {mode === "master" ? (
        <MasterView
          inputs={masterInputs}
          onInputChange={handleMasterInputChange}
          onCreateOrder={handleCreateOrder}
          loading={applicationLoading}
          submitting={submitting}
          error={visibleError}
          toast={toast}
          orders={orders}
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
          options={masterOptions}
          meta={workbookState.meta}
          onFileLoad={handleFileLoad}
          uploading={workbookState.uploading}
        />
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

      {pendingConfirmation ? (
        <OrderConfirmationModal
          order={pendingConfirmation.order}
          resolution={pendingConfirmation.resolution}
          onCancel={() => setPendingConfirmation(null)}
          onConfirm={() => submitOrder(pendingConfirmation.order)}
          submitting={submitting}
        />
      ) : null}
    </div>
  );
}
