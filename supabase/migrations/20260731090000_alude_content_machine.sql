-- ════════════════════════════════════════════════════════════════════════════
-- Alude · Máquina de conteúdo (espelho da Camada D da HH, escopo alude_*)
-- topics → content_items → publications · settings (mix/slots) · views de leitura
-- RLS: service_role only (admin do site usa service role no server).
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. alude_topics · funil de aquisição contínua ──────────────────────────
create table if not exists public.alude_topics (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('radar','agenda','marco','igor','tendencia','ciclo')),
  title text not null,
  angle text,
  notes text,
  pillar text check (pillar in ('pov_cabine','recap','comunidade','curadoria','day_in_the_life','bastidor_estilo')),
  score numeric default 0,
  status text not null default 'novo' check (status in ('novo','aprovado','usado','descartado')),
  used_item_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists alude_topics_status_idx on public.alude_topics(status, score desc);

-- ─── 2. alude_content_items · a peça (1 linha = 1 conteúdo) ─────────────────
create table if not exists public.alude_content_items (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.alude_topics(id) on delete set null,
  pillar text not null check (pillar in ('pov_cabine','recap','comunidade','curadoria','day_in_the_life','bastidor_estilo')),
  format text not null check (format in ('reel','carrossel','story','foto','short','video_longo','playlist_update')),
  title text not null,
  hook text,
  roteiro text,
  caption text,
  hashtags text[] default '{}',
  platforms text[] not null default '{instagram}',
  asset jsonb default '{}'::jsonb,          -- {refs:[], prompts:[], standby:'depende-igor'|null}
  status text not null default 'draft' check (status in ('ideia','draft','em_revisao','aprovado','agendado','publicado','rejeitado','arquivado')),
  rejection_note text,
  scheduled_at timestamptz,
  week_of date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists alude_items_status_idx on public.alude_content_items(status);
create index if not exists alude_items_sched_idx on public.alude_content_items(scheduled_at);
create index if not exists alude_items_week_idx on public.alude_content_items(week_of);

-- ─── 3. alude_publications · fan-out por rede (trilho de publicação) ────────
create table if not exists public.alude_publications (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.alude_content_items(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','youtube','youtube-shorts','spotify')),
  external_id text,
  external_url text,
  scheduled_at timestamptz not null,
  published_at timestamptz,
  status text not null default 'pending' check (status in ('pending','publishing','published','failed','cancelled','awaiting_connection')),
  publisher_attempts integer not null default 0,
  last_error text,
  metrics jsonb default '{}'::jsonb,        -- {reach, plays, likes, comments, saves, shares, fetched:[{at,day}]}
  metrics_fetched_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(item_id, platform)
);
create index if not exists alude_pubs_status_idx on public.alude_publications(status, scheduled_at);

-- ─── 4. alude_settings · mix, slots, pesos (key/value auditável) ────────────
create table if not exists public.alude_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into public.alude_settings (key, value) values
  ('mix_weights', '{"pov_cabine":20,"recap":20,"comunidade":20,"curadoria":15,"day_in_the_life":15,"bastidor_estilo":10}'),
  ('mix_weights_history', '[]'),
  ('slots', '{
    "instagram": [{"dia":"ter","hora":"19:00","formato":"reel"},{"dia":"sex","hora":"19:00","formato":"reel"},{"dia":"dom","hora":"19:00","formato":"reel"},{"dia":"qui","hora":"12:00","formato":"carrossel"}],
    "tiktok":    [{"dia":"ter","hora":"20:00","formato":"reel"},{"dia":"sex","hora":"20:00","formato":"reel"},{"dia":"dom","hora":"20:00","formato":"reel"}],
    "youtube":   [{"dia":"dom","hora":"18:00","formato":"short","cadencia":"quinzenal"}],
    "spotify":   [{"dia":"qui","hora":"10:00","formato":"playlist_update"}]
  }'),
  ('producao_ligada', 'false')
on conflict (key) do nothing;

-- ─── 5. Views de leitura do loop de performance ─────────────────────────────
create or replace view public.alude_pillar_balance as
select
  i.pillar,
  count(*) filter (where i.created_at > now() - interval '28 days') as produzido_28d,
  count(*) filter (where i.status = 'publicado' and i.updated_at > now() - interval '28 days') as publicado_28d,
  ((s.value ->> i.pillar))::numeric as peso_alvo
from public.alude_content_items i
cross join public.alude_settings s
where s.key = 'mix_weights'
group by i.pillar, s.value;

create or replace view public.alude_pillar_performance as
select
  i.pillar,
  i.format,
  p.platform,
  count(*) as pubs_28d,
  percentile_cont(0.5) within group (order by (p.metrics->>'reach')::numeric) as reach_mediana,
  percentile_cont(0.5) within group (order by
    case when (p.metrics->>'reach')::numeric > 0
         then (p.metrics->>'saves')::numeric / (p.metrics->>'reach')::numeric end)
    as saves_por_reach_mediana
from public.alude_publications p
join public.alude_content_items i on i.id = p.item_id
where p.status = 'published'
  and p.published_at > now() - interval '28 days'
  and p.metrics ? 'reach'
group by i.pillar, i.format, p.platform;

-- ─── 6. RLS · service_role only ─────────────────────────────────────────────
alter table public.alude_topics enable row level security;
alter table public.alude_content_items enable row level security;
alter table public.alude_publications enable row level security;
alter table public.alude_settings enable row level security;

drop policy if exists "service_role all alude_topics" on public.alude_topics;
create policy "service_role all alude_topics" on public.alude_topics
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role all alude_content_items" on public.alude_content_items;
create policy "service_role all alude_content_items" on public.alude_content_items
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role all alude_publications" on public.alude_publications;
create policy "service_role all alude_publications" on public.alude_publications
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role all alude_settings" on public.alude_settings;
create policy "service_role all alude_settings" on public.alude_settings
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
