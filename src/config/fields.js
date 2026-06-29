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
  plateNumber: "Číslo desky (ve skladu nástrojů BP + klasic)",
  plateSize: "Rozměr desky Š X H X V mm",
  frontGuide: "Pomocné vedeni před nástroj ANO/NE. Pokud ano tak délka vedení",
  clamps: "Počet + typ upínek (Police 12)",
  screws: "Šrouby - počty + parametry (Police 12)",
  washers: "Podložky pod šrouby - počet, typ (Police 12)",
  sensor: "čidlo- rozměr počet KS",
  rearGuide: "Vedení za nástroj ANO/NE. Pokud Ano, napsat typ (Police 17)",
  tableStops: "Dorazy do stolu na nástroji ANO/NE",
  rearChannel: "Kanál za nástroj - délka",
  felts: "Šířky filců, případně typ mazání + PN",
  stainlessBrake: "Brzda pro nerez Ano/Ne",
  note: "poznámka"
};

export const FIELD_HEADER_ALIASES = {
  machine: ["stroj"],
  tool: ["nastroj"],
  author: ["zadáno kým", "zadano kym"],
  priority: ["Priorita"],
  setNumber: ["číslo/ označení upinací sady", "cislo/ oznaceni upinaci sady"],
  clampingSlots: [
    "Drážky v nástroji na upnutí - ANO/NE. Pokud ano zda odpovída upínací drážce"
  ],
  suctionUnderTool: [
    "Odsávaní pod nástrojem - ANO/NE. Pokuď ANO, konkrétní typ. (Ve skladě nástojů nad nástroji po levé straně.)",
    "Odsávání pod nástrojem - ANO/NE. Pokud ANO, konkrétní typ. (Ve skladě nástrojů nad nástroji po levé straně.)"
  ],
  sortingChannel: ["Třídicí kanál ANO/NE kolik? - definovat", "Třídicí kanál ANO/NE kolik?  - definovat"],
  vorstanz: ["Vorstanz ANO/NE, Pokud ano, zda podavač s drážkou, nebo bez"],
  plateNumber: [
    "Číslo desky (ve skladu nástrojů BP + klasic)",
    "Číslo desky  (ve skladu nástrojů BP + klasic)"
  ],
  plateSize: [
    "Rozměr desky Š X H X V mm",
    "Rozměr desky                                                Š X H X V  mm"
  ],
  frontGuide: ["Pomocné vedeni před nástroj ANO/NE. Pokud ano tak délka vedení"],
  clamps: ["Počet + typ upínek (Police 12)", "Počet + typ upínek\n(Police 12)"],
  screws: ["Šrouby - počty + parametry (Police 12)", "Šrouby - počty + parametry\n(Police 12)"],
  washers: [
    "Podložky pod šrouby - počet, typ (Police 12)",
    "Podložky pod šrouby - počet, typ\n(Police 12)"
  ],
  sensor: ["čidlo- rozměr počet KS"],
  rearGuide: [
    "Vedení za nástroj ANO/NE. Pokud Ano, napsat typ (Police 17)",
    "Vedení za nástroj ANO/NE.\nPokud Ano, napsat typ\n(Police 17)"
  ],
  tableStops: ["Dorazy do stolu na nástroji ANO/NE", "Dorazy do stolu na nástroji\nANO/NE"],
  rearChannel: ["Kanál za nástroj - délka"],
  felts: [
    "Šířky filců, případně typ mazání + PN",
    "Šířky filců, případně typ mazání  + PN"
  ],
  stainlessBrake: ["Brzda pro nerez Ano/Ne", "Brzda pro nerez\nAno/Ne"],
  note: ["poznámka", "Poznámka", "poznámky", "Poznámky"]
};

export const COMPARE_FIELDS = [
  {
    key: "clampingSlots",
    label: "Drážky v nástroji na upnutí. Pokud ano, zda odpovídá upínací drážce"
  },
  {
    key: "suctionUnderTool",
    label: "Odsávání pod nástrojem (ve skladu nástrojů nad nástroji po levé straně)"
  },
  { key: "sortingChannel", label: "Třídicí kanál?" },
  { key: "vorstanz", label: "Vorstanz" },
  { key: "plateNumber", label: "Číslo desky (ve skladu nástrojů BP + klasic)" },
  { key: "plateSize", label: "Rozměr desky Š × H × V mm" },
  { key: "frontGuide", label: "Pomocné vedení před nástroj" },
  { key: "clamps", label: "Počet + typ upínek (Police 12)" },
  { key: "screws", label: "Šrouby – počty + parametry (Police 12)" },
  { key: "washers", label: "Podložky pod šrouby – počet, typ (Police 12)" },
  { key: "sensor", label: "Čidlo – rozměr, počet ks" },
  { key: "rearGuide", label: "Vedení za nástroj (Police 17)" },
  { key: "tableStops", label: "Dorazy do stolu na nástroji" },
  { key: "rearChannel", label: "Kanál za nástroj – délka" },
  { key: "felts", label: "Šířky filců, případně typ mazání + PN" },
  { key: "stainlessBrake", label: "Brzda pro nerez" },
  { key: "note", label: "Poznámka" }
];

export const FIELD_REFERENCE_IMAGES = {
  clamps: {
    buttonLabel: "Náhled",
    title: "Typy upínek A–F",
    src: `${import.meta.env.BASE_URL}reference/upinky-a-f.png`
  }
};

export const PN_COLUMN_CANDIDATES = [
  "PN výrobku",
  "PN vyrobku",
  "PN",
  "product PN",
  "produkt",
  "výrobek",
  "vyrobek"
];
