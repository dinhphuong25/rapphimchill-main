CREATE TABLE IF NOT EXISTS hiphim_users (
  email TEXT PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hiphim_pending_registrations (
  email TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);