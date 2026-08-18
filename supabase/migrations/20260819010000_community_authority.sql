-- PREPARE PHASE for TLP community write authority.
-- Existing production schema is assumed to be installed already. This migration
-- adds the trusted path without removing legacy browser RPCs, so the old client
-- continues to work until the new frontend + Edge path is verified.

drop index if exists public.tlp_ratings_one_vote_per_browser;
create unique index if not exists tlp_ratings_one_vote_per_actor
  on public.tlp_ratings(target_type, target_id, voter_id)
  where voter_id is not null;

create table if not exists public.tlp_community_abuse_buckets (
  network_key text not null,
  action text not null,
  scope text not null,
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  primary key (network_key, action, scope, window_start),
  check (network_key ~ '^[a-f0-9]{64}$'),
  check (char_length(action) between 1 and 32),
  check (char_length(scope) between 1 and 220)
);
create index if not exists tlp_community_abuse_window_idx
  on public.tlp_community_abuse_buckets(window_start);

create or replace function public.tlp_take_community_budget(
  p_network_key text,
  p_action text,
  p_scope text,
  p_window_seconds integer,
  p_limit integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bucket_start timestamptz;
  current_hits integer;
begin
  if p_network_key is null or p_network_key !~ '^[a-f0-9]{64}$' then raise exception 'invalid network authority'; end if;
  if p_action is null or char_length(p_action) > 32 then raise exception 'invalid abuse action'; end if;
  if p_scope is null or char_length(p_scope) > 220 then raise exception 'invalid abuse scope'; end if;
  if p_window_seconds < 10 or p_window_seconds > 86400 then raise exception 'invalid abuse window'; end if;
  if p_limit < 1 or p_limit > 10000 then raise exception 'invalid abuse limit'; end if;

  bucket_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.tlp_community_abuse_buckets(network_key, action, scope, window_start, hits)
  values (p_network_key, p_action, p_scope, bucket_start, 1)
  on conflict (network_key, action, scope, window_start)
  do update set hits = public.tlp_community_abuse_buckets.hits + 1
  returning hits into current_hits;

  if current_hits > p_limit then
    raise exception 'community rate limit' using errcode = 'P0001';
  end if;

  delete from public.tlp_community_abuse_buckets
  where window_start < clock_timestamp() - interval '48 hours';
end
$$;

create or replace function public.tlp_submit_rating_server(
  p_target_type text,
  p_target_id text,
  p_actor_id uuid,
  p_network_key text,
  p_scores jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  score numeric;
  expected_keys text[];
begin
  if p_actor_id is null then raise exception 'actor id is required'; end if;
  if p_target_type not in ('poet', 'poem', 'track', 'article') then raise exception 'invalid target type'; end if;
  if p_target_id is null or p_target_id !~ '^[a-z0-9][a-z0-9-]{1,159}$' then raise exception 'invalid target id'; end if;
  if jsonb_typeof(p_scores) <> 'object' or p_scores = '{}'::jsonb then raise exception 'scores must be an object'; end if;

  expected_keys := case p_target_type
    when 'poet' then array['language', 'depth', 'legacy', 'truth']
    when 'poem' then array['beauty', 'form', 'impact']
    when 'track' then array['voice', 'music', 'text']
    when 'article' then array['clarity', 'depth', 'fairness']
  end;

  if jsonb_object_length(p_scores) <> array_length(expected_keys, 1) or not (p_scores ?& expected_keys) then
    raise exception 'score dimensions do not match target type';
  end if;

  for item in select key, value from jsonb_each(p_scores) loop
    if jsonb_typeof(item.value) <> 'number' then raise exception 'score is not numeric'; end if;
    score := (item.value::text)::numeric;
    if score < 1 or score > 5 or score <> trunc(score) then raise exception 'score outside integer range 1..5'; end if;
  end loop;

  perform public.tlp_take_community_budget(p_network_key, 'rating', '*', 3600, 60);
  perform public.tlp_take_community_budget(p_network_key, 'rating', p_target_type || ':' || p_target_id, 3600, 8);

  insert into public.tlp_ratings(id, target_type, target_id, voter_id, scores, created_at)
  values ('rating-' || gen_random_uuid()::text, p_target_type, p_target_id, p_actor_id, p_scores, now())
  on conflict (target_type, target_id, voter_id) where voter_id is not null
  do update set scores = excluded.scores, created_at = now();
end
$$;

create or replace function public.tlp_submit_comment_server(
  p_id text,
  p_target_type text,
  p_target_id text,
  p_actor_id uuid,
  p_network_key text,
  p_author text,
  p_text text,
  p_kind text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_author text;
  clean_text text;
begin
  if p_actor_id is null then raise exception 'actor id is required'; end if;
  if p_id is null or p_id !~ '^comment-[a-z0-9][a-z0-9-]{7,199}$' then raise exception 'invalid comment id'; end if;
  if p_target_type not in ('poet', 'poem', 'track', 'article') then raise exception 'invalid target type'; end if;
  if p_target_id is null or p_target_id !~ '^[a-z0-9][a-z0-9-]{1,159}$' then raise exception 'invalid target id'; end if;
  if p_kind not in ('literary', 'history', 'moral', 'performance') then raise exception 'invalid comment kind'; end if;

  clean_author := regexp_replace(coalesce(trim(p_author), ''), '[[:cntrl:]]', '', 'g');
  clean_text := trim(coalesce(p_text, ''));
  if char_length(clean_author) > 60 then raise exception 'author too long'; end if;
  if char_length(clean_text) < 8 or char_length(clean_text) > 2000 then raise exception 'invalid comment length'; end if;

  if exists (
    select 1 from public.tlp_comments
    where voter_id = p_actor_id and created_at > now() - interval '20 seconds'
  ) then
    raise exception 'comment rate limit';
  end if;

  perform public.tlp_take_community_budget(p_network_key, 'comment', '*', 3600, 12);
  perform public.tlp_take_community_budget(p_network_key, 'comment', p_target_type || ':' || p_target_id, 3600, 6);

  insert into public.tlp_comments(id, target_type, target_id, voter_id, author, text, kind, status, created_at)
  values (
    p_id,
    p_target_type,
    p_target_id,
    p_actor_id,
    coalesce(nullif(clean_author, ''), 'Анонимный читатель'),
    clean_text,
    p_kind,
    'published',
    now()
  )
  on conflict (id) do nothing;
end
$$;

create or replace function public.tlp_mark_helpful_server(
  p_comment_id text,
  p_actor_id uuid,
  p_network_key text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  comment_target_type text;
  comment_target_id text;
begin
  if p_actor_id is null then raise exception 'actor id is required'; end if;
  if p_comment_id is null or p_comment_id !~ '^comment-[a-z0-9][a-z0-9-]{7,199}$' then raise exception 'invalid comment id'; end if;

  select target_type, target_id into comment_target_type, comment_target_id
  from public.tlp_comments
  where id = p_comment_id and status = 'published';

  if comment_target_type is null or comment_target_id is null then raise exception 'comment not found'; end if;

  perform public.tlp_take_community_budget(p_network_key, 'helpful', '*', 3600, 120);
  perform public.tlp_take_community_budget(
    p_network_key,
    'helpful',
    comment_target_type || ':' || comment_target_id,
    3600,
    40
  );

  insert into public.tlp_comment_votes(comment_id, voter_id)
  values (p_comment_id, p_actor_id)
  on conflict do nothing;
end
$$;

alter table public.tlp_community_abuse_buckets enable row level security;
revoke all on public.tlp_community_abuse_buckets from anon, authenticated;
revoke all on function public.tlp_take_community_budget(text, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.tlp_submit_rating_server(text, text, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.tlp_submit_comment_server(text, text, text, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.tlp_mark_helpful_server(text, uuid, text) from public, anon, authenticated;

grant execute on function public.tlp_take_community_budget(text, text, text, integer, integer) to service_role;
grant execute on function public.tlp_submit_rating_server(text, text, uuid, text, jsonb) to service_role;
grant execute on function public.tlp_submit_comment_server(text, text, text, uuid, text, text, text, text) to service_role;
grant execute on function public.tlp_mark_helpful_server(text, uuid, text) to service_role;

-- Deliberately do NOT revoke/drop legacy browser mutation RPCs here.
-- 20260819011000_community_authority_cutover.sql owns that terminal cutover.
