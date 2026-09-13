"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Modo = "senha" | "link" | "recuperar";
const AVISOS: Record<string, string> = { "sem-acesso": "Essa conta não tem acesso ao admin.", link: "Esse link não vale mais. Pede outro." };

function Formulario() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";
  const [modo, setModo] = useState<Modo>("senha");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(AVISOS[params.get("erro") ?? ""] ?? null);
  const [enviando, setEnviando] = useState(false);
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const corpo: Record<string, unknown> = { email, next };
      if (modo === "senha") corpo.password = senha;
      if (modo === "link") corpo.link = true;
      if (modo === "recuperar") corpo.recuperar = true;
      const res = await fetch("/api/admin/login", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Não deu pra entrar.");
      if (modo === "senha") {
        window.location.assign(json.next ?? next);
        return;
      }
      setEnviadoPara(email);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra entrar.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = "w-full rounded-lg bg-breu border border-areia/15 px-4 py-3 text-areia outline-none focus:border-ambar transition-colors";

  if (enviadoPara) {
    return (
      <p className="text-sm text-areia/80">
        {modo === "recuperar" ? "Mandei o link pra criar uma senha nova" : "Mandei o link de entrada"} pra <span className="text-areia">{enviadoPara}</span>. Abre o e-mail e clica; vale por uma hora.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus placeholder="seu e-mail" className={campo} />
      {modo === "senha" && <input name="password" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" placeholder="senha" className={campo} />}
      {erro && <p role="alert" className="text-sm text-brasa">{erro}</p>}
      <button type="submit" disabled={enviando || !email || (modo === "senha" && !senha)} className="w-full rounded-lg bg-ambar text-breu font-semibold py-3 transition-opacity hover:opacity-90 disabled:opacity-40">
        {enviando ? "Um instante..." : modo === "senha" ? "Entrar" : modo === "link" ? "Me manda o link" : "Criar senha nova"}
      </button>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-areia/60">
        {modo !== "senha" && <button type="button" onClick={() => setModo("senha")} className="hover:text-areia">Entrar com senha</button>}
        {modo !== "link" && <button type="button" onClick={() => setModo("link")} className="hover:text-areia">Entrar com link por e-mail</button>}
        {modo !== "recuperar" && <button type="button" onClick={() => setModo("recuperar")} className="hover:text-areia">Esqueci a senha</button>}
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-noite flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">Alude</p>
        <h1 className="display text-4xl text-areia mb-8">Máquina de conteúdo</h1>
        <Suspense>
          <Formulario />
        </Suspense>
      </div>
    </main>
  );
}
