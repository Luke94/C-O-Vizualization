import { useEffect, useState } from "react";
import DataSourceCard from "../common/DataSourceCard.jsx";
import { changePsePassword, getPseSession, loginPse, logoutPse, saveColumnMapping } from "../../api/pseApi.js";
import { EXCEL_COLUMNS } from "../../config/fields.js";

export default function PseView({ meta, headers, columnMapping, onMappingApplied, onFileLoad, uploading }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [mapping, setMapping] = useState(columnMapping);

  useEffect(() => { getPseSession().then(() => setAuthenticated(true)).catch(() => setAuthenticated(false)); }, []);
  useEffect(() => setMapping(columnMapping), [columnMapping]);

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

  async function saveMapping(event) {
    event.preventDefault();
    try { await saveColumnMapping(mapping); await onMappingApplied(mapping); setMessage("Mapování sloupců bylo uloženo."); }
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
    <form onSubmit={saveMapping} className="mapping-form">
      <h2>Mapování sloupců Excelu</h2>
      <p>Prázdná volba použije automatické rozpoznání dosavadních názvů.</p>
      {Object.entries(EXCEL_COLUMNS).map(([key, label]) => <label key={key}>
        <span>{label}</span>
        <select value={mapping[key] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [key]: event.target.value }))}>
          <option value="">Automaticky</option>
          {headers.map((header) => <option value={header} key={header}>{header}</option>)}
        </select>
      </label>)}
      <button className="primary-button" type="submit">Uložit mapování</button>
    </form>
    <form onSubmit={changePassword} className="password-form">
      <h2>Změna hesla</h2>
      <label>Současné heslo<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label>
      <label>Nové heslo<input type="password" value={newPassword} minLength="8" onChange={(e) => setNewPassword(e.target.value)} /></label>
      <button className="primary-button" type="submit">Změnit heslo</button>
    </form>
    {message ? <div className="message success">{message}</div> : null}
  </section></main>;
}
