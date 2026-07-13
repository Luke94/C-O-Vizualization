import { requestJson } from "./client.js";

export function listOrders() {
  return requestJson("api/v1/orders");
}

export function createOrder(order) {
  return requestJson("api/v1/orders", {
    method: "POST",
    body: JSON.stringify(order)
  });
}

export function updateOrder(orderId, changes) {
  return requestJson(`api/v1/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    body: JSON.stringify(changes)
  });
}

export function deleteOrder(orderId) {
  return requestJson(`api/v1/orders/${encodeURIComponent(orderId)}`, {
    method: "DELETE"
  });
}
