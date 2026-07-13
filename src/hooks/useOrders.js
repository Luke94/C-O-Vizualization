import { useCallback, useEffect, useMemo, useState } from "react";
import { createOrder, deleteOrder, listOrders, updateOrder } from "../api/ordersApi.js";
import { sortOrders } from "../domain/orders.js";

const REFRESH_INTERVAL_MS = 3000;

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const result = await listOrders();
      setOrders(Array.isArray(result?.orders) ? result.orders : []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const intervalId = window.setInterval(() => refresh({ silent: true }), REFRESH_INTERVAL_MS);
    const handleFocus = () => refresh({ silent: true });
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  const add = useCallback(async (draft) => {
    const result = await createOrder(draft);
    setOrders((current) => [result.order, ...current.filter((order) => order.id !== result.order.id)]);
    return result.order;
  }, []);

  const markReady = useCallback(async (orderId) => {
    const result = await updateOrder(orderId, { prepared: true });
    setOrders((current) => current.map((order) => (order.id === orderId ? result.order : order)));
    return result.order;
  }, []);

  const remove = useCallback(async (orderId) => {
    await deleteOrder(orderId);
    setOrders((current) => current.filter((order) => order.id !== orderId));
  }, []);

  return {
    orders: useMemo(() => sortOrders(orders), [orders]),
    loading,
    error,
    setError,
    refresh,
    add,
    markReady,
    remove
  };
}
