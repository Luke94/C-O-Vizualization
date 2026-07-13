import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createOrdersRouter(orderStore) {
  const router = express.Router();

  router.get(
    "/",
    asyncHandler(async (_request, response) => {
      response.json({ orders: await orderStore.list() });
    })
  );

  router.post(
    "/",
    asyncHandler(async (request, response) => {
      const order = await orderStore.create(request.body);
      response.status(201).json({ order });
    })
  );

  router.patch(
    "/:orderId",
    asyncHandler(async (request, response) => {
      const order = await orderStore.update(request.params.orderId, request.body);
      response.json({ order });
    })
  );

  router.delete(
    "/:orderId",
    asyncHandler(async (request, response) => {
      await orderStore.remove(request.params.orderId);
      response.status(204).end();
    })
  );

  return router;
}
