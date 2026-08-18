-- CUTOVER PHASE for hardened community authority.
-- Apply only after the community-write Edge Function and Auth-backed frontend
-- are deployed and verified against the prepare-phase server RPCs.

drop function if exists public.tlp_submit_rating(text, text, text, uuid, jsonb);
drop function if exists public.tlp_submit_comment(text, text, text, uuid, text, text, text);
drop function if exists public.tlp_mark_helpful(text, uuid);
