export default function ModeSwitch({ mode, onModeChange, orderCount, connected }) {
  return (
    <header className="mode-switch-bar">
      <div>
        <strong>C/O Visualization</strong>
        <span className="connection-label">
          <i className={connected ? "online" : "offline"} aria-hidden="true" />
          {connected ? "Sdílené objednávky aktivní" : "Server není dostupný"}
        </span>
      </div>

      <nav className="mode-switch" aria-label="Přepnutí role">
        <button type="button" className={mode === "master" ? "active" : ""} onClick={() => onModeChange("master")}>
          Mistr
        </button>
        <button type="button" className={mode === "setter" ? "active" : ""} onClick={() => onModeChange("setter")}>
          Seřizovač <span>{orderCount}</span>
        </button>
      </nav>
    </header>
  );
}
