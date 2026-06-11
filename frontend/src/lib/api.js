export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function parseError(res) {
  try {
    const body = await res.json();
    return body.detail ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function getJSON(path) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`);
  } catch {
    throw new Error("無法連線到後端，請確認後端伺服器已啟動");
  }
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function postJSON(path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("無法連線到後端，請確認後端伺服器已啟動");
  }
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
