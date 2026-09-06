import { useEffect, useState } from "react";
import DataSourceCard from "../common/DataSourceCard.jsx";
import { changePsePassword, getPseSession, loginPse, logoutPse, saveApplicationSettings } from "../../api/pseApi.js";
import { EXCEL_COLUMNS } from "../../config/fields.js";

export default function PseView({ meta, headers, columnMapping, displayRows, onSettingsApplied, onFileLoad, uploading }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [mapping, setMapping] = useState(columnMapping);
  const [rows, setRows] = useState(displayRows);

  useEffect(() => { getPseSession().then(() => setAuthenticated(true)).catch(() => setAuthenticated(false)); }, []);
  useEffect(() => setMapping(columnMapping), [columnMapping]);
  useEffect(() => setRows(displayRows), [displayRows]);

  async function login(event) {
    event.preventDefault();
    try { await loginPse(password); setAuthenticated(true); setPassword(""); setMessage(""); }
    catch (error) { setMessage(error.message); }
  }

  async function changePassword(event) {
    event.preventDefault();
    try {
      await changePsePassword(currentPassword, newPassword);
      setAuthenticated(false); setCurrentPassword(""); setNewPassword("");
      setMessage("Heslo bylo změněno. Přihlas se znovu.");
    } catch (error) { setMessage(error.message); }
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (rows.some((row) => !row.label.trim() || !row.sourceColumn)) {
      setMessage("Každý zobrazovaný řádek musí mít název a vybraný zdrojový sloupec.");
      return;
    }
    try { await saveApplicationSettings(mapping, rows); await onSettingsApplied(mapping, rows); setMessage("Nastavení zobrazení bylo uloženo."); }
    catch (error) { setMessage(error.message); }
  }

  if (!authenticated) return (
    <main className="pse-shell"><form className="pse-card" onSubmit={login}>
      <h1>PsE nastavení</h1><label htmlFor="pse-password">Heslo</label>
      <input id="pse-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
      <button className="primary-button" type="submit">Přihlásit</button>
      {message ? <div className="message error">{message}</div> : null}
    </form></main>
  );

  return <main className="pse-shell"><section className="pse-card">
    <div className="pse-heading"><h1>PsE nastavení</h1><button type="button" className="secondary-button" onClick={async () => { await logoutPse(); setAuthenticated(false); }}>Odhlásit</button></div>
    <h2>Databáze přípravy</h2>
    <DataSourceCard meta={meta} onFileLoad={onFileLoad} uploading={uploading} />
    <form onSubmit={saveSettings} className="mapping-form">
      <h2>Vyhledávací sloupce</h2>
      <p>Tyto sloupce aplikace používá pro nalezení kombinace lis + tool.</p>
      {Object.entries(EXCEL_COLUMNS).filter(([key]) => ["machine", "tool"].includes(key)).map(([key, label]) => <label key={key}>
        <span>{label}</span>
        <select value={mapping[key] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [key]: event.target.value }))}>
          <option value="">Automaticky</option>
          {headers.map((header) => <option value={header} key={header}>{header}</option>)}
        </select>
      </label>)}
      <h2>Zobrazované řádky</h2>
      <p>Název je text pro seřizovače. Zdrojový sloupec se vybírá z prvního řádku Excelu.</p>
      <div className="display-row-editor">
        {rows.map((row, index) => <div className="display-row-item" key={row.id}>
          <input aria-label="Název řádku" value={row.label} onChange={(event) => updateRow(index, { label: event.target.value })} />
          <select aria-label="Zdrojový sloupec" value={row.sourceColumn} onChange={(event) => updateRow(index, { sourceColumn: event.target.value })}>
            <option value="">Vyber sloupec</option>
            {headers.map((header) => <option value={header} key={header}>{header}</option>)}
          </select>
          <button type="button" className="small-button" onClick={() => moveRow(index, -1)} disabled={index === 0}>↑</button>
          <button type="button" className="small-button" onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1}>↓</button>
          <button type="button" className="remove-row-button" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}>Odebrat</button>
        </div>)}
      </div>
      <button type="button" className="secondary-button" onClick={() => setRows((current) => [...current, { id: globalThis.crypto.randomUUID(), label: "Nový řádek", sourceColumn: "" }])}>+ Přidat řádek</button>
      <button className="primary-button" type="submit">Uložit nastavení zobrazení</button>
    </form>
    <form onSubmit={changePassword} className="password-form">
      <h2>Změna hesla</h2>
      <label>Současné heslo<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label>
      <label>Nové heslo<input type="password" value={newPassword} minLength="8" onChange={(e) => setNewPassword(e.target.value)} /></label>
      <button className="primary-button" type="submit">Změnit heslo</button>
    </form>
    {message ? <div className="message success">{message}</div> : null}
  </section></main>;

  function updateRow(index, changes) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...changes } : row));
  }

  function moveRow(index, direction) {
    setRows((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
}
