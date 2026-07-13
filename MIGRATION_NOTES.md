# Přehled technických změn

## Frontend

- zachovaný React a JavaScript
- UI rozdělené do samostatných komponent, hooks, API služeb a doménových utilit
- odstraněný single-file režim
- odstraněný Vite a jeho React plugin
- JSX, CSS a obrázky sestavuje jediná lehká build závislost `esbuild`
- frontend i API běží přes jeden Express server a jeden port

## Sdílená data

- objednávky přesunuté z `localStorage` do serverového JSON úložiště
- zápisy objednávek probíhají atomicky
- frontend pravidelně načítá aktuální stav objednávek
- Excel je uložený centrálně v `data/preparation.xlsx`
- při výměně Excelu se předchozí verze zálohuje do `data/backups/`

## Deployment

- produkční frontend vzniká v `dist/client/`
- Express servíruje frontend, API i Excel ze stejné aplikace
- `web.config` spouští Node přes IIS HttpPlatformHandler
- release skript připraví offline balíček s produkčními závislostmi
