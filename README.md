# C/O Visualization

Interní React aplikace pro předání objednávky změny výroby od mistra k seřizovači a porovnání aktuálního a následujícího upínání podle sdíleného Excelu.

## Architektura

- `src/` — React frontend v JavaScriptu
- `server/` — malé Express API v JavaScriptu
- `data/preparation.xlsx` — sdílený zdroj parametrů
- `data/orders.json` — sdílené objednávky pro MVP
- `dist/client/` — produkční React build
- `web.config` — spuštění přes IIS HttpPlatformHandler

Objednávky už nejsou uložené v `localStorage`. Mistr a seřizovač proto vidí stejný stav i na různých počítačích. Frontend si změny automaticky obnovuje každé tři sekundy.

## Lokální vývoj

Požadovaný Node.js: 20 LTS.

```bash
npm install
npm run dev
```

- React: `http://localhost:5173`
- API: `http://localhost:3000/api/health`

## Kontroly

```bash
npm test
npm run check
npm run build
```

## Produkční build

```bash
npm run build
npm start
```

Aplikace je potom dostupná na `http://localhost:3000/`.

## Příprava offline release pro IIS

Na Windows PC s internetem spusťte:

```cmd
deploy\prepare-release.cmd
```

Výsledná složka `deploy\release\` obsahuje React build, server, runtime data a produkční `node_modules`. Podrobný postup je v `DEPLOYMENT.md`.

## Důležité provozní poznámky

- `data/orders.json`, `data/preparation.xlsx` a `data/backups/` se při aktualizaci nesmí přepsat.
- IIS identita potřebuje právo zápisu do `data/` a `logs/`.
- Nahrání nového Excelu lze vypnout přes `ALLOW_DATABASE_UPLOAD=false`.
- JSON úložiště je vhodné pro jednu instanci aplikace a současný MVP provoz. Přechod na MSSQL lze později udělat bez změny React UI.
