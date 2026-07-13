function getApplicationRoot() {
  const { pathname } = window.location;

  if (pathname.endsWith("/")) return pathname;

  const lastSegment = pathname.split("/").at(-1) ?? "";
  if (lastSegment.includes(".")) {
    return pathname.slice(0, pathname.lastIndexOf("/") + 1);
  }

  return `${pathname}/`;
}

const applicationRoot = getApplicationRoot();

export function appUrl(path) {
  const normalizedPath = String(path).replace(/^\/+/, "");
  return `${applicationRoot}${normalizedPath}`;
}

export async function requestJson(path, options = {}) {
  const response = await fetch(appUrl(path), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    },
    ...options
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(payload?.message || `Požadavek selhal (${response.status}).`);
  }

  return payload;
}

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
