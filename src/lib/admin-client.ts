"use client";

/** Fetch pro client contra as rotas /api/admin, sempre same-origin (cookie vai junto). */
export async function adminFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Erro ${res.status}`);
  return json;
}
