import DataSourceCard from "../common/DataSourceCard.jsx";
import FilterInput from "../common/FilterInput.jsx";
import OrderList from "../orders/OrderList.jsx";

export default function MasterView({
  inputs,
  onInputChange,
  onCreateOrder,
  loading,
  submitting,
  error,
  toast,
  orders,
  selectedOrderId,
  onSelectOrder,
  options,
  meta,
  onFileLoad,
  uploading
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
          {error ? <div className="message error">{error}</div> : null}
          {toast ? <div className="message success">{toast}</div> : null}
        </div>
      </main>

      <aside className="side-panel master-side-panel">
        <OrderList orders={orders} selectedOrderId={selectedOrderId} onSelectOrder={onSelectOrder} />
        <button
          className="search-button send-order-button"
          type="button"
          onClick={onCreateOrder}
          disabled={loading || submitting}
        >
          {submitting ? "Odesílám..." : loading ? "Načítám..." : "Poslat"}
        </button>
        <DataSourceCard meta={meta} onFileLoad={onFileLoad} uploading={uploading} />
      </aside>
    </div>
  );
}
