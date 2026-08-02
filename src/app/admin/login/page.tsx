"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Não deu pra entrar.");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu pra entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-noite flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">Alude</p>
        <h1 className="display text-4xl text-areia mb-8">Máquina de conteúdo</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="key" className="block text-sm text-areia/70 mb-2">
              Chave de acesso
            </label>
            <input
              id="key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoFocus
              className="w-full rounded-lg bg-breu border border-areia/15 px-4 py-3 text-areia outline-none focus:border-ambar transition-colors"
              placeholder="Sua chave"
            />
          </div>
          {error && <p className="text-sm text-brasa">{error}</p>}
          <button
            type="submit"
            disabled={loading || !key}
            className="w-full rounded-lg bg-ambar text-breu font-semibold py-3 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
