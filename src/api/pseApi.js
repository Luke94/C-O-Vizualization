import { requestJson } from "./client.js";

export function loginPse(password) {
  return requestJson("api/v1/pse/login", { method: "POST", body: JSON.stringify({ password }) });
}
export function getPseSession() { return requestJson("api/v1/pse/session"); }
export function logoutPse() { return requestJson("api/v1/pse/logout", { method: "POST" }); }
export function changePsePassword(currentPassword, newPassword) {
  return requestJson("api/v1/pse/password", {
    method: "PUT", body: JSON.stringify({ currentPassword, newPassword })
  });
}
export function getApplicationSettings() { return requestJson("api/v1/configuration"); }
export function saveColumnMapping(columnMapping) {
  return requestJson("api/v1/configuration", { method: "PUT", body: JSON.stringify({ columnMapping }) });
}
