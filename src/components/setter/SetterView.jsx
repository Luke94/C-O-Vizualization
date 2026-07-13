import ComparisonTable from "../comparison/ComparisonTable.jsx";
import MatchResolver from "../comparison/MatchResolver.jsx";
import DataSourceCard from "../common/DataSourceCard.jsx";
import OrderList from "../orders/OrderList.jsx";
import OrderWarnings from "./OrderWarnings.jsx";
import SelectedOrderCards from "./SelectedOrderCards.jsx";

export default function SetterView({
  error,
  orders,
  selectedOrder,
  selectedOrderId,
  onSelectOrder,
  onMarkReady,
  onRemoveOrder,
  actionPending,
  resolution,
  currentSelectedIndex,
  nextSelectedIndex,
  onSelectCurrent,
  onSelectNext,
  comparisonRows,
  meta,
  onFileLoad,
  uploading
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
          {error ? <div className="message error">{error}</div> : null}
          {!selectedOrder ? <div className="message warning">Zatím není vytvořená žádná objednávka.</div> : null}
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
          <button
            className="ready-button"
            type="button"
            onClick={onMarkReady}
            disabled={!selectedOrder || selectedOrder.prepared || actionPending}
          >
            {selectedOrder?.prepared ? "Připraveno ✓" : actionPending ? "Ukládám..." : "Označit připraveno ✓"}
          </button>
          <button
            className="done-button"
            type="button"
            onClick={onRemoveOrder}
            disabled={!selectedOrder || actionPending}
          >
            {actionPending ? "Ukládám..." : "Dokončeno / odstranit"}
          </button>
        </div>
        <DataSourceCard meta={meta} onFileLoad={onFileLoad} uploading={uploading} compact />
      </aside>
    </div>
  );
}
