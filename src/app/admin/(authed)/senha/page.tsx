"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/senha", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: senha }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Não deu pra salvar.");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-sm">
      <h1 className="display text-3xl text-areia mb-2">Senha nova</h1>
      <p className="text-sm text-areia/70 mb-6">Pelo menos 8 caracteres. Vale pra entrar no admin com e-mail e senha.</p>
      <form onSubmit={salvar} className="space-y-4">
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" autoFocus placeholder="senha nova" className="w-full rounded-lg bg-breu border border-areia/15 px-4 py-3 text-areia outline-none focus:border-ambar transition-colors" />
        {erro && <p className="text-sm text-brasa">{erro}</p>}
        <button type="submit" disabled={salvando || senha.length < 8} className="w-full rounded-lg bg-ambar text-breu font-semibold py-3 transition-opacity hover:opacity-90 disabled:opacity-40">
          {salvando ? "Salvando..." : "Salvar senha"}
        </button>
      </form>
    </div>
  );
}
