import { supabaseAdmin } from "@/lib/supabase";
import { ITEM_STATUS_LABELS, PLATFORM_LABELS } from "@/lib/content-constants";
import { ProducaoToggle } from "@/components/admin/ProducaoToggle";

const COUNT_STATUSES = ["draft", "em_revisao", "aprovado", "agendado", "publicado"] as const;

export default async function PainelPage() {
  const [{ data: items }, { data: topicosNovos }, { data: proximos }, { data: producaoRow }] = await Promise.all([
    supabaseAdmin.from("alude_content_items").select("status"),
    supabaseAdmin.from("alude_topics").select("id").eq("status", "novo"),
    supabaseAdmin
      .from("alude_content_items")
      .select("id, title, platforms, scheduled_at, status")
      .not("scheduled_at", "is", null)
      .in("status", ["aprovado", "agendado"])
      .order("scheduled_at", { ascending: true })
      .limit(7),
    supabaseAdmin.from("alude_settings").select("value").eq("key", "producao_ligada").single(),
  ]);

  const counts: Record<string, number> = {};
  for (const status of COUNT_STATUSES) counts[status] = 0;
  for (const item of items ?? []) {
    if (item.status in counts) counts[item.status] += 1;
  }

  const producaoLigada = producaoRow?.value === true;

  const igConfigurado = Boolean(process.env.ALUDE_IG_USER_ID && process.env.ALUDE_IG_ACCESS_TOKEN);
  const conexoes = [
    { nome: "Instagram", ok: igConfigurado },
    { nome: "TikTok", ok: false },
    { nome: "YouTube", ok: false },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-dourado text-xs uppercase tracking-[0.2em] mb-2">Painel</p>
        <h1 className="display text-3xl text-areia">Como a máquina está hoje</h1>
      </div>

      <ProducaoToggle ligada={producaoLigada} />

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Peças por estágio</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {COUNT_STATUSES.map((status) => (
            <div key={status} className="rounded-xl border border-areia/10 bg-breu/60 px-4 py-4">
              <p className="text-2xl display text-areia">{counts[status]}</p>
              <p className="text-xs text-areia/50 mt-1">{ITEM_STATUS_LABELS[status]}</p>
            </div>
          ))}
          <div className="rounded-xl border border-areia/10 bg-breu/60 px-4 py-4">
            <p className="text-2xl display text-ambar">{topicosNovos?.length ?? 0}</p>
            <p className="text-xs text-areia/50 mt-1">Tópicos novos</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Próximos agendamentos</h2>
        {proximos && proximos.length > 0 ? (
          <ul className="divide-y divide-areia/10 rounded-xl border border-areia/10 bg-breu/60">
            {proximos.map((item) => (
              <li key={item.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-sm text-areia">{item.title}</span>
                <span className="text-xs text-areia/50 shrink-0">
                  {(item.platforms ?? []).map((p: string) => PLATFORM_LABELS[p] ?? p).join(", ")} ·{" "}
                  {item.scheduled_at
                    ? new Date(item.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                    : "sem data"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-areia/40 italic">Nada agendado ainda.</p>
        )}
      </section>

      <section>
        <h2 className="text-sm text-areia/50 uppercase tracking-wide mb-3">Conexões</h2>
        <div className="flex flex-wrap gap-3">
          {conexoes.map((c) => (
            <div
              key={c.nome}
              className="rounded-lg border border-areia/10 bg-breu/60 px-4 py-2 flex items-center gap-2"
            >
              <span className={`h-2 w-2 rounded-full ${c.ok ? "bg-ambar" : "bg-areia/25"}`} />
              <span className="text-sm text-areia/80">{c.nome}</span>
              <span className="text-xs text-areia/40">{c.ok ? "configurado" : "aguardando conexão"}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
