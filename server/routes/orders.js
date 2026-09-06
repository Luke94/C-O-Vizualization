import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createOrdersRouter(orderStore, andonService) {
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

  router.post(
    "/:orderId/start",
    asyncHandler(async (request, response) => {
      response.json({ order: await orderStore.start(request.params.orderId) });
    })
  );

  router.post(
    "/:orderId/complete",
    asyncHandler(async (request, response) => {
      const order = (await orderStore.list()).find((item) => item.id === request.params.orderId);
      if (!order) return response.status(404).json({ message: "Objednávka nebyla nalezena." });
      await andonService.complete(order);
      response.json({ historyEntry: await orderStore.complete(request.params.orderId) });
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
