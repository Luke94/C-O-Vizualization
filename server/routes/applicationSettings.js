import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createApplicationSettingsRouter(store, pseAccess) {
  const router = express.Router();
  router.get("/", asyncHandler(async (_request, response) => response.json(await store.get())));
  router.put("/", pseAccess.requireSession.bind(pseAccess), asyncHandler(async (request, response) => {
    response.json(await store.update(request.body));
  }));
  return router;
}
