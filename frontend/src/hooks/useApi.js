import { useEffect, useState } from "react";
import { getJSON } from "../lib/api";

/**
 * 抓取一個或多個 API 端點。
 * 傳入字串回傳單一結果，傳入陣列回傳對應陣列。
 */
export function useApi(paths) {
  const key = Array.isArray(paths) ? paths.join("|") : paths;
  const single = !Array.isArray(paths);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, attempt: -1, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all(key.split("|").map(getJSON))
      .then((results) => {
        if (cancelled) return;
        setResult({ key, attempt, data: single ? results[0] : results, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({ key, attempt, data: null, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [key, single, attempt]);

  // loading 由「結果是否對應目前的請求」推導，避免在 effect 內同步 setState
  const fresh = result.key === key && result.attempt === attempt;
  return {
    data: fresh ? result.data : null,
    error: fresh ? result.error : null,
    loading: !fresh,
    retry: () => setAttempt((n) => n + 1),
  };
}
