function FilterInput({ id, value, onChange, placeholder, listId, options }) {
  return (
    <>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        list={listId}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

export default function SearchPanel({ inputs, onInputChange, onSearch, onFileLoad, loading, meta, options }) {
  return (
    <aside className="side-panel">
      <section className="machine-card machine-card-main">
        <label htmlFor="machine">Číslo stroje</label>
        <FilterInput
          id="machine"
          value={inputs.machine}
          onChange={(value) => onInputChange("machine", value)}
          placeholder="např. S-002AB"
          listId="machine-options"
          options={options.machine}
        />
      </section>

      <section className="machine-card">
        <h2>Aktuálně nastaveno</h2>
        <label htmlFor="current-tool">Číslo nástroje</label>
        <FilterInput
          id="current-tool"
          value={inputs.currentTool}
          onChange={(value) => onInputChange("currentTool", value)}
          placeholder="např. 20304"
          listId="current-tool-options"
          options={options.currentTool}
        />
        <label htmlFor="current-pn">PN výrobku</label>
        <FilterInput
          id="current-pn"
          value={inputs.currentPn}
          onChange={(value) => onInputChange("currentPn", value)}
          placeholder={meta.pnColumn ? "použije se pro filtr" : "zatím bez sloupce v Excelu"}
          listId="current-pn-options"
          options={options.currentPn}
        />
      </section>

      <section className="machine-card">
        <h2>Další výroba</h2>
        <label htmlFor="next-tool">Číslo nástroje</label>
        <FilterInput
          id="next-tool"
          value={inputs.nextTool}
          onChange={(value) => onInputChange("nextTool", value)}
          placeholder="např. 275758"
          listId="next-tool-options"
          options={options.nextTool}
        />
        <label htmlFor="next-pn">PN výrobku</label>
        <FilterInput
          id="next-pn"
          value={inputs.nextPn}
          onChange={(value) => onInputChange("nextPn", value)}
          placeholder={meta.pnColumn ? "použije se pro filtr" : "zatím bez sloupce v Excelu"}
          listId="next-pn-options"
          options={options.nextPn}
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
