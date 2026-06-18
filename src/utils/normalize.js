export function toComparable(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("cs-CZ");
}

export function isFilled(value) {
  return toComparable(value).length > 0;
}

export function displayValue(value) {
  const normalized = String(value ?? "").trim();
  return normalized.length ? normalized : "—";
}
