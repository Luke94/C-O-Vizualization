import { appUrl, requestJson } from "./client.js";

export function getDatabaseMeta() {
  return requestJson("api/v1/database/meta");
}

export async function uploadDatabase(file) {
  const response = await fetch(appUrl("api/v1/database"), {
    method: "PUT",
    cache: "no-store",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name)
    },
    body: file
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || `Nahrání Excelu selhalo (${response.status}).`);
  }

  return payload;
}

export function getDatabaseFileUrl(version = Date.now()) {
  return appUrl(`data/preparation.xlsx?v=${encodeURIComponent(version)}`);
}
