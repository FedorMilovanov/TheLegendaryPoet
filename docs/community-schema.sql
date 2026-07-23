-- The Legendary Poet: shared ratings and comments (Supabase/Postgres)
-- Safe to run repeatedly. Existing legacy rows remain readable.

create extension if not exists pgcrypto;

create table if not exists public.tlp_ratings (
  id text primary key,
  target_type text not null,
  target_id text not null,
  scores jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.tlp_ratings add column if not exists voter_id uuid;
create unique index if not exists tlp_ratings_one_vote_per_browser on public.tlp_ratings(target_type, target_id, voter_id) where voter_id is not null;

create table if not exists public.tlp_comments (
  id text primary key,
  target_type text not null,
  target_id text not null,
  author text not null,
  text text not null,
  kind text not null,
  helpful integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.tlp_comments add column if not exists voter_id uuid;
alter table public.tlp_comments add column if not exists status text not null default 'published';

create table if not exists public.tlp_comment_votes (
  comment_id text not null references public.tlp_comments(id) on delete cascade,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, voter_id)
);

create or replace view public.tlp_ratings_public as
select id, target_type, target_id, scores, created_at from public.tlp_ratings;

create or replace view public.tlp_comments_public as
select c.id, c.target_type, c.target_id, c.author, c.text, c.kind,
       count(v.comment_id)::integer as helpful, c.created_at
from public.tlp_comments c
left join public.tlp_comment_votes v on v.comment_id = c.id
where c.status = 'published'
group by c.id, c.target_type, c.target_id, c.author, c.text, c.kind, c.created_at;

create or replace function public.tlp_submit_rating(
  p_id text, p_target_type text, p_target_id text, p_voter_id uuid, p_scores jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare item record;
begin
  if p_target_type not in ('poet','poem','track','article') then raise exception 'invalid target type'; end if;
  if length(p_target_id) < 1 or length(p_target_id) > 160 then raise exception 'invalid target id'; end if;
  if jsonb_typeof(p_scores) <> 'object' or p_scores = '{}'::jsonb then raise exception 'scores must be an object'; end if;
  for item in select key, value from jsonb_each(p_scores) loop
    if item.key not in ('language','depth','legacy','truth','beauty','form','impact','voice','music','text','clarity','fairness') then raise exception 'invalid score key'; end if;
    if jsonb_typeof(item.value) <> 'number' or (item.value::text)::numeric < 1 or (item.value::text)::numeric > 5 then raise exception 'score outside 1..5'; end if;
  end loop;
  insert into public.tlp_ratings(id,target_type,target_id,voter_id,scores,created_at)
  values (left(p_id,160),p_target_type,left(p_target_id,160),p_voter_id,p_scores,now())
  on conflict (target_type,target_id,voter_id) where voter_id is not null
  do update set scores=excluded.scores, created_at=now();
end $$;

create or replace function public.tlp_submit_comment(
  p_id text, p_target_type text, p_target_id text, p_voter_id uuid,
  p_author text, p_text text, p_kind text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_target_type not in ('poet','poem','track','article') then raise exception 'invalid target type'; end if;
  if p_kind not in ('literary','history','moral','performance') then raise exception 'invalid comment kind'; end if;
  if char_length(trim(p_text)) < 3 or char_length(p_text) > 1200 then raise exception 'invalid comment length'; end if;
  if char_length(p_author) > 60 then raise exception 'author too long'; end if;
  insert into public.tlp_comments(id,target_type,target_id,voter_id,author,text,kind,status,created_at)
  values (left(p_id,160),p_target_type,left(p_target_id,160),p_voter_id,coalesce(nullif(trim(p_author),''),'Анонимный читатель'),trim(p_text),p_kind,'published',now())
  on conflict (id) do nothing;
end $$;

create or replace function public.tlp_mark_helpful(p_comment_id text, p_voter_id uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.tlp_comment_votes(comment_id,voter_id)
  select p_comment_id,p_voter_id where exists (select 1 from public.tlp_comments where id=p_comment_id and status='published')
  on conflict do nothing;
$$;

alter table public.tlp_ratings enable row level security;
alter table public.tlp_comments enable row level security;
alter table public.tlp_comment_votes enable row level security;
revoke all on public.tlp_ratings, public.tlp_comments, public.tlp_comment_votes from anon, authenticated;
grant select on public.tlp_ratings_public, public.tlp_comments_public to anon, authenticated;
grant execute on function public.tlp_submit_rating(text,text,text,uuid,jsonb) to anon, authenticated;
grant execute on function public.tlp_submit_comment(text,text,text,uuid,text,text,text) to anon, authenticated;
grant execute on function public.tlp_mark_helpful(text,uuid) to anon, authenticated;
