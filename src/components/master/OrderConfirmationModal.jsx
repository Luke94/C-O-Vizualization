export default function OrderConfirmationModal({ order, resolution, onCancel, onConfirm, submitting }) {
  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true">
      <section className="confirm-modal">
        <h2>Kontrola zadaných informací</h2>
        <p>Některá kombinace lis + tool není v databázi. Zkontroluj zadání, případně potvrď odeslání.</p>

        <div className="confirm-summary">
          <SummaryItem label="Stroj" value={order.machine} />
          <SummaryItem label="Aktuálně nastaveno" value={order.currentNoTool ? "NENÍ TOOL" : order.currentTool} />
          <SummaryItem label="Další výroba" value={order.nextTool} />
          <SummaryItem label="Priorita" value={order.priority} />
        </div>

        {resolution.missingSides.map((side) => (
          <div className="message error" key={side.key}>
            Kombinace Lis - Tool nenalezena: {order.machine} / {side.tool} ({side.label})
          </div>
        ))}

        <div className="confirm-actions">
          <button type="button" className="secondary-button" onClick={onCancel} disabled={submitting}>
            Zpět upravit
          </button>
          <button type="button" className="primary-button" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Odesílám..." : "Potvrdit a odeslat"}
          </button>
        </div>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}
