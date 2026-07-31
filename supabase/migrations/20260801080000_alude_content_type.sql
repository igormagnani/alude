-- ════════════════════════════════════════════════════════════════════════════
-- Alude · Arquitetura de conteúdo v2 (01/08/2026)
-- Nova dimensão content_type (função psicológica, o que o mix pesa);
-- pillar vira cenário (lente secundária). Ver docs/arquitetura-de-conteudo.md.
-- Tabelas vazias em produção (producao_ligada=false desde o dia 1).
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. content_type nas peças e nos tópicos ────────────────────────────────
alter table public.alude_content_items
  add column if not exists content_type text
  check (content_type in ('humor','viral_remix','lifestyle','storytelling','inspiracional','autoridade','valor','engajamento'));

-- peça sempre nasce classificada (tabela vazia, constraint barata)
alter table public.alude_content_items
  alter column content_type set not null;

alter table public.alude_topics
  add column if not exists content_type text
  check (content_type in ('humor','viral_remix','lifestyle','storytelling','inspiracional','autoridade','valor','engajamento'));
-- em tópico é sugestão, pode ser nulo até a triagem

-- ─── 2. mix_weights agora pesa content_type ─────────────────────────────────
update public.alude_settings
set value = '{"humor":15,"viral_remix":10,"lifestyle":12,"storytelling":10,"inspiracional":8,"autoridade":12,"valor":13,"engajamento":20}',
    updated_at = now()
where key = 'mix_weights';

update public.alude_settings
set value = value || jsonb_build_array(jsonb_build_object(
      'at', now(),
      'weights', '{"humor":15,"viral_remix":10,"lifestyle":12,"storytelling":10,"inspiracional":8,"autoridade":12,"valor":13,"engajamento":20}'::jsonb,
      'motivo', 'Arquitetura v2: mix passa a pesar content_type (matriz customizada, docs/arquitetura-de-conteudo.md); cenarios viram lente secundaria')),
    updated_at = now()
where key = 'mix_weights_history';

-- pesos antigos dos cenários ficam como referência de leitura secundária
insert into public.alude_settings (key, value) values
  ('cenario_weights', '{"pov_cabine":20,"recap":20,"comunidade":20,"curadoria":15,"day_in_the_life":15,"bastidor_estilo":10}')
on conflict (key) do nothing;

-- ─── 3. Views do mix por content_type (as alude_pillar_* continuam) ─────────
create or replace view public.alude_mix_balance as
select
  i.content_type,
  count(*) filter (where i.created_at > now() - interval '28 days') as produzido_28d,
  count(*) filter (where i.status = 'publicado' and i.updated_at > now() - interval '28 days') as publicado_28d,
  ((s.value ->> i.content_type))::numeric as peso_alvo
from public.alude_content_items i
cross join public.alude_settings s
where s.key = 'mix_weights'
group by i.content_type, s.value;

create or replace view public.alude_mix_performance as
select
  i.content_type,
  i.format,
  p.platform,
  count(*) as pubs_28d,
  percentile_cont(0.5) within group (order by (p.metrics->>'reach')::numeric) as reach_mediana,
  percentile_cont(0.5) within group (order by (p.metrics->>'comments')::numeric) as comments_mediana,
  percentile_cont(0.5) within group (order by
    case when (p.metrics->>'reach')::numeric > 0
         then (p.metrics->>'saves')::numeric / (p.metrics->>'reach')::numeric end)
    as saves_por_reach_mediana
from public.alude_publications p
join public.alude_content_items i on i.id = p.item_id
where p.status = 'published'
  and p.published_at > now() - interval '28 days'
  and p.metrics ? 'reach'
group by i.content_type, i.format, p.platform;
