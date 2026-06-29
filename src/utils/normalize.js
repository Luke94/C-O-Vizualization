export function toComparable(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("cs-CZ");
}

export function toHeaderComparable(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("cs-CZ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function isFilled(value) {
  return toComparable(value).length > 0;
}

export function displayValue(value) {
  const normalized = String(value ?? "").trim();
  return normalized.length ? normalized : "—";
}
