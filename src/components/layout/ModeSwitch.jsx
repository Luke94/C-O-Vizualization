export default function ModeSwitch({ mode, onModeChange, orderCount }) {
  return (
    <header className="mode-switch-bar">
      <div>
        <strong>C/O Visualization</strong>
        <span className="connection-label">TE Connectivity</span>
      </div>

      <nav className="mode-switch" aria-label="Přepnutí role">
        <button type="button" className={mode === "setter" ? "active" : ""} onClick={() => onModeChange("setter")}>
          Seřizovač <span>{orderCount}</span>
        </button>
        <button type="button" className={mode === "pse" ? "active" : ""} onClick={() => onModeChange("pse")}>PsE</button>
      </nav>
    </header>
  );
}
