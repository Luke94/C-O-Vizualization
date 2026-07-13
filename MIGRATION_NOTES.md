# Migration notes — 0.1 → 0.2

## Co zůstalo zachované

- vzhled a barevné rozlišení porovnání
- režimy Mistr / Seřizovač
- priority objednávek
- upozornění při nenalezené kombinaci Lis–Tool
- ruční výběr při více nalezených záznamech
- náhled typů upínek
- logika porovnání stávajícího a dalšího toolu

## Co se změnilo

- odstraněn `vite-plugin-singlefile`
- standardní React build do `dist/client`
- objednávky přesunuty z `localStorage` do sdíleného Express API
- centrální Excel přesunut do `data/preparation.xlsx`
- při nahrání nového Excelu se vytvoří záloha
- kód rozdělen na API klienta, hooks, doménovou logiku a menší UI komponenty
- přidán IIS `web.config`, offline release skript a deployment dokumentace
- Excel parser nyní přijímá pouze `.xlsx`

## Provozní omezení MVP

Objednávky jsou uložené v JSON souboru. Toto řešení je vhodné pro jednu Node instanci na interním serveru. Pokud bude aplikace později běžet ve více instancích nebo bude potřebovat historii a audit, serverovou persistence vrstvu je vhodné nahradit MSSQL.
