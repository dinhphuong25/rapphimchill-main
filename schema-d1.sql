-- Cloudflare D1 Database Schema for Hi Phim
-- Database: hiphim-users (ID: a5300649-2281-459d-8f57-a0e6f3c5dda7)

CREATE TABLE IF NOT EXISTS hiphim_users (
  email TEXT PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_hiphim_users_id ON hiphim_users (id);

CREATE TABLE IF NOT EXISTS hiphim_pending_registrations (
  email TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS hiphim_ratings (
  slug TEXT PRIMARY KEY,
  total_score REAL NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  data TEXT
);

CREATE TABLE IF NOT EXISTS hiphim_reports (
  id TEXT PRIMARY KEY,
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  episode_name TEXT,
  server_name TEXT,
  issue_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  user_id TEXT,
  user_email TEXT,
  user_name TEXT,
  resolved_at INTEGER,
  data TEXT
);
CREATE INDEX IF NOT EXISTS idx_hiphim_reports_created ON hiphim_reports (created_at DESC);

CREATE TABLE IF NOT EXISTS hiphim_system_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  created_at INTEGER NOT NULL,
  author TEXT,
  data TEXT
);

CREATE TABLE IF NOT EXISTS hiphim_site_config (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS hiphim_watch_party_rooms (
  room_id TEXT PRIMARY KEY,
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  state TEXT NOT NULL,
  messages TEXT NOT NULL,
  members TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hiphim_party_updated ON hiphim_watch_party_rooms (updated_at DESC);
