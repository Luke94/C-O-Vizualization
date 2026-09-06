import { HttpError } from "../utils/httpError.js";

const SYNC_INTERVAL_MS = 5000;

export class AndonService {
  constructor(settingsStore, orderStore) {
    this.settingsStore = settingsStore;
    this.orderStore = orderStore;
    this.lastSync = null;
    this.lastError = "";
    this.invalidEvents = [];
    this.running = false;
  }

  start() {
    this.sync().catch(() => undefined);
    this.timer = setInterval(() => this.sync().catch(() => undefined), SYNC_INTERVAL_MS);
    this.timer.unref?.();
  }

  async sync() {
    if (this.running) return;
    this.running = true;
    try {
      const settings = (await this.settingsStore.get()).andon;
      const events = await getEvents(settings);
      const wanted = events.filter((event) => event.EventTypeName.trim().toLocaleLowerCase("cs-CZ") === settings.eventTypeName.trim().toLocaleLowerCase("cs-CZ"));
      const valid = [];
      const invalid = [];
      for (const event of wanted) {
        try { valid.push({ event, order: parseComment(event.SenderComment || event.LatestComment) }); }
        catch (error) { invalid.push({ eventId: event.EventID, comment: event.SenderComment || event.LatestComment, message: error.message }); }
      }
      await this.orderStore.synchronizeAndon(valid);
      this.invalidEvents = invalid;
      this.lastSync = new Date().toISOString();
      this.lastError = "";
    } catch (error) {
      this.lastError = error.message;
      throw error;
    } finally { this.running = false; }
  }

  async complete(order) {
    if (order.source !== "andon") return;
    const settings = (await this.settingsStore.get()).andon;
    await processEvent(settings, order);
  }

  status() {
    return { lastSync: this.lastSync, lastError: this.lastError, invalidEvents: this.invalidEvents };
  }
}

export function parseComment(value) {
  const parts = String(value || "").split(",").map((part) => part.trim());
  if (parts.length < 5) throw new Error("Komentář musí obsahovat stroj, A, B, šířku a prioritu.");
  const currentMatch = /^A\s*:\s*(\d+)$/i.exec(parts[1]);
  const nextMatch = /^B\s*:\s*(\d+)$/i.exec(parts[2]);
  const priority = parts[4];
  if (!parts[0]) throw new Error("Chybí stroj.");
  if (!currentMatch) throw new Error("Aktuální tool musí mít formát A:číslo.");
  if (!nextMatch) throw new Error("Další tool musí mít formát B:číslo.");
  if (!/^[123]$/.test(priority)) throw new Error("Priorita musí být 1, 2 nebo 3.");
  return {
    machine: parts[0],
    currentTool: currentMatch[1] === "0" ? "" : currentMatch[1],
    currentNoTool: currentMatch[1] === "0",
    nextTool: nextMatch[1],
    materialWidth: parts[3],
    priority
  };
}

async function getEvents(settings) {
  const body = `<GetEvents xmlns="http://tempuri.org/"><buildingNr>${xml(settings.buildingNr)}</buildingNr><workplace>${xml(settings.workplace)}</workplace><workplaceType>${xml(settings.workplaceType)}</workplaceType><days>${settings.days}</days><showClosed>false</showClosed><useCloseLoop>${settings.useCloseLoop}</useCloseLoop></GetEvents>`;
  const response = await soap(settings, "GetEvents", body);
  return [...response.matchAll(/<(?:\w+:)?EventInfo>([\s\S]*?)<\/(?:\w+:)?EventInfo>/g)].map((match) => {
    const block = match[1];
    return Object.fromEntries(["EventID", "RecvGroupID", "Status", "SenderComment", "LatestComment", "EventTypeName"].map((name) => [name, textOf(block, name)]));
  });
}

async function processEvent(settings, order) {
  const body = `<ProcessEvent xmlns="http://tempuri.org/"><eventID>${xml(order.andonEventId)}</eventID><groupId>${xml(order.andonGroupId)}</groupId><status>${settings.finishedStatus}</status><user>${xml(settings.person)}</user><doUsrValidation>${settings.doUserValidation}</doUsrValidation><actionUsr>${xml(settings.person)}</actionUsr></ProcessEvent>`;
  await soap(settings, "ProcessEvent", body);
}

async function soap(settings, action, body) {
  const headers = { "Content-Type": "text/xml; charset=utf-8", SOAPAction: `"http://tempuri.org/${action}"` };
  let response;
  try {
    response = await fetch(settings.endpoint, { method: "POST", headers, body: `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body>${body}</soap:Body></soap:Envelope>`, signal: AbortSignal.timeout(10000) });
  } catch (error) { throw new HttpError(502, `Andon API není dostupné: ${error.message}`); }
  const responseText = await response.text();
  if (!response.ok || /<(?:\w+:)?Fault\b/.test(responseText)) throw new HttpError(502, `Andon API odmítlo požadavek (${response.status}).`);
  return responseText;
}

function textOf(block, name) {
  const match = new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:\\w+:)?${name}>`).exec(block);
  return decodeXml(match?.[1] || "").trim();
}
function xml(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]); }
function decodeXml(value) { return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&"); }
