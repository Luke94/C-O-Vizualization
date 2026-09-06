import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { readCookie } from "../services/pseAccess.js";

const COOKIE = "pse_session";

export function createPseRouter(access) {
  const router = express.Router();

  router.post("/login", asyncHandler(async (request, response) => {
    const token = await access.login(request.body?.password);
    response.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
    response.json({ authenticated: true });
  }));

  router.post("/logout", (request, response) => {
    access.logout(readCookie(request, COOKIE));
    response.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
    response.status(204).end();
  });

  router.get("/session", access.requireSession.bind(access), (_request, response) => {
    response.json({ authenticated: true });
  });

  router.put("/password", access.requireSession.bind(access), asyncHandler(async (request, response) => {
    await access.changePassword(request.body?.currentPassword, request.body?.newPassword);
    response.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
    response.status(204).end();
  }));

  return router;
}
