-- D1 schema for the Git Challenge Tracker. Replaces data/db.json.
-- Safe to re-run: every statement is IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  -- pbkdf2-sha256$<iterations>$<saltHex>$<hashHex>
  password   TEXT NOT NULL,
  created_at TEXT NOT NULL,
  start_date TEXT NOT NULL
);

-- One row per (user, day). `data` holds the same JSON object the file-backed
-- server stored, so the frontend and the API contract are unchanged.
CREATE TABLE IF NOT EXISTS activities (
  user_id    TEXT NOT NULL,
  day        INTEGER NOT NULL,
  data       TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, day)
);

-- Rate limiting. A Worker isolate is short-lived and there are many of them, so
-- the counters the local server kept in a Map have to be shared state.
--   key "login:<ip>"  -> failed sign-ins, blocked_until set after 10
--   key "signup:<ip>" -> accounts created, capped at 5 per rolling hour
-- Both timestamps are epoch milliseconds. A cron sweeps expired rows hourly.
CREATE TABLE IF NOT EXISTS throttle (
  key           TEXT PRIMARY KEY,
  count         INTEGER NOT NULL DEFAULT 0,
  reset_at      INTEGER NOT NULL DEFAULT 0,
  blocked_until INTEGER NOT NULL DEFAULT 0
);
