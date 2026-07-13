import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createDatabaseRouter(workbookStore, maxWorkbookBytes) {
  const router = express.Router();
  const rawWorkbookBody = express.raw({
    type: "application/octet-stream",
    limit: maxWorkbookBytes
  });

  router.get(
    "/meta",
    asyncHandler(async (_request, response) => {
      response.json(await workbookStore.getMeta());
    })
  );

  router.put(
    "/",
    rawWorkbookBody,
    asyncHandler(async (request, response) => {
      const encodedFileName = request.get("X-File-Name") || "";
      const fileName = decodeURIComponent(encodedFileName);
      response.json(await workbookStore.replace(request.body, fileName));
    })
  );

  return router;
}
