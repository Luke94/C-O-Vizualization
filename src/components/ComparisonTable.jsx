export default function ComparisonTable({ rows, currentRecord, nextRecord }) {
  if (!currentRecord || !nextRecord) {
    return (
      <main className="comparison-shell empty-state">
        <h1>C/O Visualization</h1>
        <p>Zadej číslo stroje, aktuální nástroj a další nástroj. Potom spusť porovnání.</p>
      </main>
    );
  }

  return (
    <main className="comparison-shell">
      <div className="compare-grid">
        {rows.map((row) => (
          <div className="compare-row" key={row.key}>
            <div className={`value-card ${row.same ? "same" : "different"}`}>
              <span>{row.label}</span>
              <strong>{row.currentValue}</strong>
            </div>
            <div className={`arrow-cell ${row.same ? "same" : "different"}`}>▶ ▶</div>
            <div className={`value-card next-value ${row.same ? "same" : "different"}`}>
              <strong>{row.nextValue}</strong>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
