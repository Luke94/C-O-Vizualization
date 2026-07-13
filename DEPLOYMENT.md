# C/O Visualization — Deployment Guide

Handover dokument pro nasazení C/O Visualization na stejnou IIS infrastrukturu, na které běží KPI Dashboard.

## Doporučený způsob nasazení

Aplikaci nasadit jako **samostatnou IIS Application pod existující web site**, nikoli přímo slučovat zdrojový kód s KPI Dashboardem.

Navržené hodnoty:

| Role | Hodnota |
|---|---|
| Web server | `cz563pwwb0001` |
| Zdrojové soubory | `\\cz563ap101\WWW\C-O-VISUALIZATION` |
| IIS alias | `C-O-VISUALIZATION` |
| URL | `http://cz563pwwb0001/C-O-VISUALIZATION/` |
| Databáze | Zatím není potřeba |

Tento způsob používá stejný princip jako KPI Dashboard: Node.js 20 LTS, IIS HttpPlatformHandler, offline připravené `node_modules` a jeden Node proces pro frontend i API.

> Web server nemá přístup na internet. Všechny npm balíčky se instalují na jiném PC a na server se kopíruje hotový release.

## Co aplikace obsahuje

- React frontend v čistém JavaScriptu
- Express API v čistém JavaScriptu
- sdílené objednávky v `data/orders.json`
- sdílený Excel v `data/preparation.xlsx`
- automatické zálohy starého Excelu v `data/backups/`
- React build v `dist/client/`

Objednávky už nejsou uložené v prohlížeči. Mistr a seřizovač proto vidí stejná data z různých počítačů.

## Produkční struktura

```text
C-O-VISUALIZATION\
├── dist\client\             React build
├── server\                  Node/Express API
├── data\
│   ├── preparation.xlsx     aktivní Excel
│   ├── orders.json          objednávky
│   └── backups\             automatické zálohy Excelu
├── logs\                    IIS stdout logy
├── node_modules\            production dependencies
├── web.config               HttpPlatformHandler konfigurace
├── .env                     runtime konfigurace
├── package.json
└── package-lock.json
```

## Prerekvizity

| Co | Verze / požadavek |
|---|---|
| Node.js | 20 LTS, Windows x64 |
| IIS | HttpPlatformHandler nainstalovaný |
| Oprávnění | App Pool účet musí mít čtení a zápis do sdílené složky |

Pokud už KPI Dashboard na stejném serveru běží přes Node.js 20 a HttpPlatformHandler, není potřeba instalovat tyto komponenty znovu.

---

## 1. Příprava release na PC s internetem

Na PC s Node.js 20 LTS otevřít projekt a spustit:

```cmd
deploy\prepare-release.cmd
```

Skript provede:

1. `npm ci`
2. `npm run build`
3. vytvoření čisté složky `deploy\release`
4. kopii serveru, React buildu, dat a konfigurace
5. `npm ci --omit=dev` přímo do release složky

Výsledkem je:

```text
deploy\release\
```

Tato složka je připravená k offline kopírování.

Ruční alternativa:

```cmd
npm ci
npm run build
```

Potom zkopírovat `dist`, `server`, `data`, `logs`, `package*.json`, `web.config`, `.env.example` a nainstalovat production dependencies do cílové složky:

```cmd
npm ci --omit=dev --prefix C:\deploy\C-O-VISUALIZATION
```

---

## 2. První kopie na file server

```cmd
robocopy deploy\release \\cz563ap101\WWW\C-O-VISUALIZATION /E
```

V cílové složce zkopírovat `.env.example` na `.env`:

```env
PORT=3000
ORDER_STORE_FILE=./data/orders.json
WORKBOOK_FILE=./data/preparation.xlsx
WORKBOOK_BACKUP_DIR=./data/backups
ALLOW_DATABASE_UPLOAD=true
MAX_WORKBOOK_MB=20
```

`PORT` je určený pro lokální test. V IIS ho automaticky přepíše proměnná `%HTTP_PLATFORM_PORT%`.

Pokud uživatelé nemají mít možnost měnit sdílený Excel z aplikace:

```env
ALLOW_DATABASE_UPLOAD=false
```

---

## 3. IIS Application Pool

V IIS Manageru:

1. **Application Pools → Add Application Pool**
2. Name: `C-O-VISUALIZATION`
3. .NET CLR version: `No Managed Code`
4. Managed pipeline mode: `Integrated`

Doporučení: použít samostatný App Pool, aby restart C/O aplikace neovlivnil KPI Dashboard.

### Identita App Poolu a UNC share

Projekt leží na jiném serveru (`\\cz563ap101\...`). Nejčistší je spustit App Pool pod schváleným **doménovým service accountem**.

Účet potřebuje:

- Read & Execute na celou složku aplikace
- Modify na `data\`
- Modify na `logs\`

Práva musí být nastavena na úrovni share i NTFS. Lokální identita `IIS AppPool\C-O-VISUALIZATION` se na vzdáleném file serveru běžně nedá přímo použít.

Alternativou je přístup přes účet počítače web serveru nebo IIS „Connect As“, ale musí to potvrdit IT.

---

## 4. Přidání aplikace pod existující site

V IIS Manageru:

1. Vybrat existující web site na portu 80
2. **Add Application**
3. Alias: `C-O-VISUALIZATION`
4. Application Pool: `C-O-VISUALIZATION`
5. Physical path: `\\cz563ap101\WWW\C-O-VISUALIZATION`
6. Případně nastavit „Connect As“ podle účtu schváleného IT

Výsledná URL:

```text
http://cz563pwwb0001/C-O-VISUALIZATION/
```

Aplikace používá relativní cesty, takže funguje pod IIS aliasem bez přepisování React kódu.

---

## 5. web.config

Soubor je součástí projektu a nastavuje:

- Node proces `server\server.js`
- port z `%HTTP_PLATFORM_PORT%`
- production režim
- stdout logy do `logs\stdout*`
- limit 20 MB pro nahrání Excelu

Výchozí cesta k Node.js:

```text
C:\Program Files\nodejs\node.exe
```

Pokud je Node nainstalovaný jinde, upravit atribut `processPath` ve `web.config`.

---

## 6. Oprávnění dat

Aplikace za běhu zapisuje do:

```text
data\orders.json
data\preparation.xlsx
data\backups\
logs\
```

Bez práva Modify nebude možné vytvářet objednávky, označovat je jako připravené, mazat je ani nahrávat nový Excel.

---

## 7. Test po nasazení

1. Recycle App Poolu `C-O-VISUALIZATION`
2. Otevřít aplikaci:

```text
http://cz563pwwb0001/C-O-VISUALIZATION/
```

3. Health check:

```text
http://cz563pwwb0001/C-O-VISUALIZATION/api/health
```

Očekávaná odpověď:

```json
{"status":"ok","timestamp":"..."}
```

4. Otestovat na dvou počítačích:
   - v režimu Mistr vytvořit objednávku
   - v režimu Seřizovač ověřit, že se během několika sekund zobrazí
   - označit objednávku jako připravenou
   - ověřit změnu na prvním počítači

5. Otestovat načtení Excelu a porovnání toolů.

---

## Aktualizace aplikace

Na PC s internetem znovu vytvořit release:

```cmd
deploy\prepare-release.cmd
```

Při kopírování aktualizace **zachovat provozní data**:

```cmd
robocopy deploy\release \\cz563ap101\WWW\C-O-VISUALIZATION /E /XD data logs
```

Tím se aktualizuje:

- React build
- Node server
- `node_modules`
- konfigurace a dokumentace

A zachová se:

- aktuální Excel
- objednávky
- zálohy Excelu
- logy

Potom v IIS provést **Recycle** App Poolu.

Pokud má nová verze obsahovat i nový výchozí Excel, nahrát ho ručně až po záloze stávajícího souboru.

---

## API přehled

| Endpoint | Metoda | Účel |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/v1/orders` | GET | Seznam objednávek |
| `/api/v1/orders` | POST | Vytvoření objednávky |
| `/api/v1/orders/:id` | PATCH | Označení objednávky jako připravené |
| `/api/v1/orders/:id` | DELETE | Dokončení / odstranění objednávky |
| `/api/v1/database/meta` | GET | Metadata sdíleného Excelu |
| `/api/v1/database` | PUT | Nahrazení sdíleného Excelu |
| `/data/preparation.xlsx` | GET | Aktivní Excel pro React aplikaci |

---

## Troubleshooting

### Aplikace se nespustí

- zkontrolovat `logs\stdout*.log`
- ověřit `node --version`
- ověřit, že existuje `dist\client\index.html`
- ověřit, že existuje `server\server.js`
- ověřit cestu `processPath` ve `web.config`
- ověřit oprávnění App Pool účtu ke sdílené složce

### Health check funguje, ale stránka ne

- zkontrolovat, zda proběhl `npm run build`
- ověřit složku `dist\client\assets`
- vymazat cache prohlížeče nebo otevřít anonymní okno

### Objednávky se neukládají

- ověřit Modify právo na `data\orders.json` a `data\`
- zkontrolovat stdout log
- ověřit, že neběží dvě Node instance nad stejným JSON souborem

### Excel se nenahraje

- ověřit `ALLOW_DATABASE_UPLOAD=true`
- ověřit Modify právo na `data\` a `data\backups\`
- maximální velikost je podle výchozí konfigurace 20 MB
- povolený formát je `.xlsx`

### Nasazení do více serverových instancí

Současné JSON úložiště je určené pro jednu Node instanci. Pro více web serverů nebo vysokou souběžnost je potřeba přesunout objednávky do MSSQL. React frontend a API rozhraní mohou zůstat stejné; mění se pouze serverová persistence.
