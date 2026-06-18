export const EXCEL_COLUMNS = {
  machine: "stroj",
  tool: "nastroj",
  author: "zadáno kým",
  priority: "Priorita",
  setNumber: "číslo/ označení upinací sady",
  clampingSlots: "Drážky v nástroji na upnutí - ANO/NE. Pokud ano zda odpovída upínací drážce",
  suctionUnderTool: "Odsávaní pod nástrojem - ANO/NE. Pokuď ANO, konkrétní typ. (Ve skladě nástojů nad nástroji po levé straně.)",
  sortingChannel: "Třídicí kanál ANO/NE kolik?  - definovat",
  vorstanz: "Vorstanz ANO/NE, Pokud ano, zda podavač s drážkou, nebo bez",
  plateNumber: "Číslo desky \n(ve skladu nástrojů BP + klasic)",
  plateSize: "Rozměr desky                                                Š X H X V  mm",
  frontGuide: "Pomocné vedeni před nástroj ANO/NE. Pokud ano tak délka vedení",
  clamps: "Počet + typ upínek\n(Police 12)",
  screws: "Šrouby - počty + parametry\n(Police 12)",
  washers: "Podložky pod šrouby - počet, typ\n(Police 12)",
  sensor: "čidlo- rozměr počet KS",
  rearGuide: "Vedení za nástroj ANO/NE.\nPokud Ano, napsat typ\n(Police 17)",
  tableStops: "Dorazy do stolu na nástroji\nANO/NE",
  rearChannel: "Kanál za nástroj - délka",
  felts: "Šířky filců, případně typ mazání  + PN",
  stainlessBrake: "Brzda pro nerez\nAno/Ne"
};

export const COMPARE_FIELDS = [
  { key: "clampingSlots", label: "Drážky v nástroji na upnutí" },
  { key: "suctionUnderTool", label: "Odsávání pod nástrojem" },
  { key: "sortingChannel", label: "Třídicí kanál" },
  { key: "plateNumber", label: "Číslo desky" },
  { key: "plateSize", label: "Rozměr desky" },
  { key: "frontGuide", label: "Pomocné vedení před nástroj" },
  { key: "clamps", label: "Upínání" },
  { key: "screws", label: "Šrouby" },
  { key: "washers", label: "Podložky pod šrouby" },
  { key: "sensor", label: "Čidlo" },
  { key: "rearGuide", label: "Vedení za nástroj" },
  { key: "tableStops", label: "Dorazy do stolu" },
  { key: "rearChannel", label: "Kanál za nástroj" },
  { key: "felts", label: "Šířky filců" },
  { key: "stainlessBrake", label: "Brzda nerez" }
];

export const PN_COLUMN_CANDIDATES = [
  "PN výrobku",
  "PN vyrobku",
  "PN",
  "product PN",
  "produkt",
  "výrobek",
  "vyrobek"
];
