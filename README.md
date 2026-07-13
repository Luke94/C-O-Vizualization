# C/O Visualization

Interní React aplikace pro předání objednávky změny výroby od mistra k seřizovači a porovnání aktuálního a následujícího upínání podle sdíleného Excelu.

## Architektura

- `src/` — React frontend v JavaScriptu
- `server/` — Express API v JavaScriptu
- `scripts/` — jednoduchý build a vývojové spuštění přes esbuild
- `data/preparation.xlsx` — sdílený zdroj parametrů
- `data/orders.json` — sdílené objednávky pro MVP
- `dist/client/` — vygenerovaný frontend pro produkční provoz
- `web.config` — spuštění přes IIS HttpPlatformHandler

Projekt nepoužívá single-file build ani Vite. Frontend se sestavuje pomocí esbuild a následně jej společně s API servíruje jeden Node/Express proces.

Objednávky nejsou uložené v `localStorage`. Mistr a seřizovač proto vidí stejný stav i na různých počítačích. Frontend si změny automaticky obnovuje každé tři sekundy.

## První spuštění

Požadovaný Node.js: 20 LTS.

```bash
npm install
npm run dev
```

Aplikace i API běží na jedné adrese:

- aplikace: `http://localhost:3000/`
- health check: `http://localhost:3000/api/health`

Při změně React souborů esbuild frontend automaticky znovu sestaví. V prohlížeči stačí stránku obnovit.

## Kontroly

```bash
npm test
npm run check
npm run build
```

## Produkční spuštění

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

Výsledná složka `deploy\release\` obsahuje sestavený frontend, server, runtime data a produkční `node_modules`. Podrobný postup je v `DEPLOYMENT.md`.

## Důležité provozní poznámky

- `data/orders.json`, `data/preparation.xlsx` a `data/backups/` se při aktualizaci nesmí přepsat.
- IIS identita potřebuje právo zápisu do `data/` a `logs/`.
- Nahrání nového Excelu lze vypnout přes `ALLOW_DATABASE_UPLOAD=false`.
- JSON úložiště je vhodné pro jednu instanci aplikace a současný MVP provoz. Přechod na MSSQL lze později udělat bez změny React UI.
