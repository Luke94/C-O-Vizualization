export default function SearchPanel({ inputs, onInputChange, onSearch, onFileLoad, loading, meta }) {
  return (
    <aside className="side-panel">
      <section className="machine-card machine-card-main">
        <label htmlFor="machine">Číslo stroje</label>
        <input
          id="machine"
          value={inputs.machine}
          onChange={(event) => onInputChange("machine", event.target.value)}
          placeholder="např. S-002AB"
        />
      </section>

      <section className="machine-card">
        <h2>Aktuálně nastaveno</h2>
        <label htmlFor="current-tool">Číslo nástroje</label>
        <input
          id="current-tool"
          value={inputs.currentTool}
          onChange={(event) => onInputChange("currentTool", event.target.value)}
          placeholder="např. 20304"
        />
        <label htmlFor="current-pn">PN výrobku</label>
        <input
          id="current-pn"
          value={inputs.currentPn}
          onChange={(event) => onInputChange("currentPn", event.target.value)}
          placeholder={meta.pnColumn ? "použije se pro filtr" : "zatím bez sloupce v Excelu"}
        />
      </section>

      <section className="machine-card">
        <h2>Další výroba</h2>
        <label htmlFor="next-tool">Číslo nástroje</label>
        <input
          id="next-tool"
          value={inputs.nextTool}
          onChange={(event) => onInputChange("nextTool", event.target.value)}
          placeholder="např. 275758"
        />
        <label htmlFor="next-pn">PN výrobku</label>
        <input
          id="next-pn"
          value={inputs.nextPn}
          onChange={(event) => onInputChange("nextPn", event.target.value)}
          placeholder={meta.pnColumn ? "použije se pro filtr" : "zatím bez sloupce v Excelu"}
        />
      </section>

      <button className="search-button" type="button" onClick={onSearch} disabled={loading}>
        {loading ? "Načítám..." : "Vyhledat a porovnat"}
      </button>

      <section className="file-card">
        <p>Zdroj dat: {meta.sheetName ? `list ${meta.sheetName}` : "nenačteno"}</p>
        <p>Řádků v databázi: {meta.rowCount}</p>
        <p>PN filtr: {meta.pnColumn ? `sloupec ${meta.pnColumn}` : "připraveno, v Excelu zatím chybí"}</p>
        <label className="file-load-button">
          Načíst jiný Excel
          <input type="file" accept=".xlsx,.xls" onChange={onFileLoad} />
        </label>
      </section>
    </aside>
  );
}
