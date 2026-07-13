export default function SelectedOrderCards({ order }) {
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
      <InfoCard label="Aktuálně nastaveno" value={order.currentNoTool ? "NENÍ TOOL" : order.currentTool} />
      <InfoCard label="Další výroba" value={order.nextTool} />
    </section>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="mini-info-card">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}
