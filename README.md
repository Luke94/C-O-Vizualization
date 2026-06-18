# C/O Visualization

První MVP aplikace pro porovnání aktuálního a následujícího upínání podle Excel databáze.

## Funkce v první verzi

- načtení výchozího Excelu ze složky `public/mock`
- možnost ručně načíst jiný Excel přes tlačítko v aplikaci
- vyhledání aktuálního a dalšího záznamu podle:
  - číslo stroje
  - číslo nástroje
  - PN výrobku je připravené, ale použije se až ve chvíli, kdy bude v Excelu existovat odpovídající sloupec
- porovnání parametrů upínání
- zelené řádky = shoda
- červené řádky = rozdíl
- upozornění při nenalezeném záznamu
- výběr záznamu při nalezení více výsledků

## Spuštění ve vývoji

```bash
npm install
npm run dev
```

Potom otevřít adresu, kterou vypíše Vite, typicky:

```text
http://localhost:5173
```

## Build pro použití v prohlížeči

```bash
npm run build
```

Výstup bude ve složce `dist`.

## Důležité poznámky

Excel zatím neobsahuje PN výrobku. Aplikace proto v první verzi filtruje podle `stroj + nastroj`.
Jakmile se do Excelu přidá sloupec například `PN výrobku`, aplikace ho automaticky najde a začne používat pro filtr, pokud bude PN v aplikaci vyplněné.
