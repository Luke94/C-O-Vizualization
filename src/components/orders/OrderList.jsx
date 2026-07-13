export default function OrderList({ orders, selectedOrderId, onSelectOrder }) {
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
