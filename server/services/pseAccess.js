import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { HttpError } from "../utils/httpError.js";

const SESSION_AGE_MS = 8 * 60 * 60 * 1000;

export class PseAccess {
  constructor(filePath, initialPassword) {
    this.filePath = filePath;
    this.initialPassword = initialPassword;
    this.sessions = new Map();
  }

  async initialize() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try { await fs.access(this.filePath); }
    catch { await this.#writePassword(this.initialPassword); }
  }

  async login(password) {
    if (!(await this.#matches(password))) throw new HttpError(401, "Nesprávné PsE heslo.");
    const token = crypto.randomBytes(32).toString("hex");
    this.sessions.set(token, Date.now() + SESSION_AGE_MS);
    return token;
  }

  logout(token) { this.sessions.delete(token); }

  requireSession(request, _response, next) {
    const token = readCookie(request, "pse_session");
    const expiresAt = this.sessions.get(token);
    if (!expiresAt || expiresAt < Date.now()) {
      if (token) this.sessions.delete(token);
      return next(new HttpError(401, "PsE přihlášení vypršelo."));
    }
    next();
  }

  async changePassword(currentPassword, newPassword) {
    if (!(await this.#matches(currentPassword))) throw new HttpError(401, "Současné heslo není správné.");
    if (String(newPassword ?? "").length < 8) throw new HttpError(400, "Nové heslo musí mít alespoň 8 znaků.");
    await this.#writePassword(newPassword);
    this.sessions.clear();
  }

  async #matches(password) {
    const saved = JSON.parse(await fs.readFile(this.filePath, "utf8"));
    const actual = crypto.scryptSync(String(password ?? ""), saved.salt, 64);
    return crypto.timingSafeEqual(actual, Buffer.from(saved.hash, "hex"));
  }

  async #writePassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify({ salt, hash }, null, 2) + "\n", "utf8");
    await fs.rename(temporaryPath, this.filePath);
  }
}

export function readCookie(request, name) {
  const cookies = String(request.headers.cookie ?? "").split(";");
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}
