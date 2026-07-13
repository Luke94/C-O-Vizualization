export default function DataSourceCard({ meta, onFileLoad, uploading = false, compact = false }) {
  const uploadDisabled = uploading || !meta.allowUpload;

  return (
    <section className={`file-card ${compact ? "compact" : ""}`}>
      <p>Zdroj dat: {meta.sheetName ? `list ${meta.sheetName}` : "nenačteno"}</p>
      {!compact ? <p>Řádků v databázi: {meta.rowCount}</p> : null}
      {meta.updatedAt ? <p>Aktualizováno: {formatDateTime(meta.updatedAt)}</p> : null}

      <label className={`file-load-button ${uploadDisabled ? "disabled" : ""}`}>
        {uploading ? "Nahrávám Excel..." : meta.allowUpload ? "Nahrát nový Excel" : "Nahrání je zakázáno"}
        <input type="file" accept=".xlsx" onChange={onFileLoad} disabled={uploadDisabled} />
      </label>
    </section>
  );
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
