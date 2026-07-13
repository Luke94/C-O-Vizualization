export default function OrderWarnings({ order, resolution }) {
  if (!order) return null;

  return (
    <>
      {resolution.noToolCurrent ? (
        <div className="message warning">
          <strong>Aktuálně nastaveno: na stroji není tool.</strong>
          <span>Porovnání ukazuje kompletní přípravu pro další výrobu.</span>
        </div>
      ) : null}

      {resolution.missingSides.map((side) => (
        <div className="message error" key={side.key}>
          <strong>Kombinace Lis - Tool nenalezena: {order.machine} / {side.tool}</strong>
          <span>
            Vezmi si prosím formulář a vyplň sloupce na straně „{side.label}“. Druhá nalezená strana se v porovnání pořád zobrazuje.
          </span>
        </div>
      ))}
    </>
  );
}
