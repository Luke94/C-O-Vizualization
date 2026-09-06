import { useCallback, useEffect, useRef, useState } from "react";
import { getDatabaseFileUrl, getDatabaseMeta, uploadDatabase } from "../api/databaseApi.js";
import { loadRowsFromFile, loadRowsFromUrl } from "../utils/excel.js";
import { getApplicationSettings } from "../api/pseApi.js";

const EMPTY_DATABASE = { rows: [], sheetName: "", headers: [], pnColumn: "" };
const META_REFRESH_INTERVAL_MS = 10000;

export function useWorkbook() {
  const [database, setDatabase] = useState(EMPTY_DATABASE);
  const [serverMeta, setServerMeta] = useState({ updatedAt: "", allowUpload: false, sizeBytes: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const updatedAtRef = useRef("");
  const [columnMapping, setColumnMapping] = useState({});
  const columnMappingRef = useRef({});

  const applyWorkbook = useCallback(async (meta, mapping) => {
    const workbook = await loadRowsFromUrl(getDatabaseFileUrl(meta.updatedAt || Date.now()), mapping);
    updatedAtRef.current = meta.updatedAt || "";
    setDatabase(workbook);
    setServerMeta(meta);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [meta, settings] = await Promise.all([getDatabaseMeta(), getApplicationSettings()]);
      const mapping = settings?.columnMapping ?? {};
      setColumnMapping(mapping);
      columnMappingRef.current = mapping;
      await applyWorkbook(meta, mapping);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [applyWorkbook]);

  useEffect(() => {
    load();

    // Other open clients automatically pick up a newly uploaded workbook.
    const intervalId = window.setInterval(async () => {
      try {
        const meta = await getDatabaseMeta();
        if (meta.updatedAt && meta.updatedAt !== updatedAtRef.current) {
          await applyWorkbook(meta, columnMappingRef.current);
        } else {
          setServerMeta(meta);
        }
      } catch (refreshError) {
        setError(refreshError.message);
      }
    }, META_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [applyWorkbook, load]);

  const replace = useCallback(async (file) => {
    try {
      setUploading(true);
      setError("");

      // Parse first so an invalid workbook never replaces the shared source.
      const parsedWorkbook = await loadRowsFromFile(file, columnMapping);
      const meta = await uploadDatabase(file);

      updatedAtRef.current = meta.updatedAt || "";
      setDatabase(parsedWorkbook);
      setServerMeta(meta);
      return meta;
    } catch (uploadError) {
      setError(uploadError.message);
      throw uploadError;
    } finally {
      setUploading(false);
    }
  }, [columnMapping]);

  return {
    database,
    meta: {
      sheetName: database.sheetName,
      rowCount: database.rows.length,
      pnColumn: database.pnColumn,
      updatedAt: serverMeta.updatedAt,
      allowUpload: Boolean(serverMeta.allowUpload),
      sizeBytes: serverMeta.sizeBytes
    },
    loading,
    uploading,
    error,
    setError,
    reload: load,
    replace,
    columnMapping,
    async saveMapping(mapping) {
      setColumnMapping(mapping);
      columnMappingRef.current = mapping;
      await applyWorkbook(serverMeta, mapping);
    }
  };
}
