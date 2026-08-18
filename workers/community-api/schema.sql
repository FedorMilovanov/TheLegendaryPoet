-- The Legendary Poet community backend — Cloudflare D1.
-- No raw IP address, browser-chosen voter identity, password, email, or Turnstile secret is stored here.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tlp_ratings (
  id TEXT NOT NULL UNIQUE,
  target_type TEXT NOT NULL CHECK (target_type IN ('poet', 'poem', 'track', 'article')),
  target_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  scores_json TEXT NOT NULL CHECK (json_valid(scores_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (target_type, target_id, actor_id),
  CHECK (length(target_id) BETWEEN 2 AND 160),
  CHECK (length(actor_id) = 36)
);

CREATE INDEX IF NOT EXISTS tlp_ratings_target_idx
  ON tlp_ratings(target_type, target_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS tlp_comments (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('poet', 'poem', 'track', 'article')),
  target_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('literary', 'history', 'moral', 'performance')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at INTEGER NOT NULL,
  CHECK (length(target_id) BETWEEN 2 AND 160),
  CHECK (length(actor_id) = 36),
  CHECK (length(author) BETWEEN 1 AND 60),
  CHECK (length(text) BETWEEN 8 AND 2000)
);

CREATE INDEX IF NOT EXISTS tlp_comments_target_cursor_idx
  ON tlp_comments(target_type, target_id, status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS tlp_comments_actor_time_idx
  ON tlp_comments(actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tlp_helpful_votes (
  comment_id TEXT NOT NULL REFERENCES tlp_comments(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (comment_id, actor_id),
  CHECK (length(actor_id) = 36)
);

CREATE INDEX IF NOT EXISTS tlp_helpful_comment_idx
  ON tlp_helpful_votes(comment_id);

CREATE TABLE IF NOT EXISTS tlp_rate_buckets (
  network_key TEXT NOT NULL,
  action TEXT NOT NULL,
  scope TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL CHECK (hits > 0),
  PRIMARY KEY (network_key, action, scope, window_start),
  CHECK (length(network_key) = 64),
  CHECK (length(action) BETWEEN 1 AND 32),
  CHECK (length(scope) BETWEEN 1 AND 220)
);

CREATE INDEX IF NOT EXISTS tlp_rate_buckets_window_idx
  ON tlp_rate_buckets(window_start);
