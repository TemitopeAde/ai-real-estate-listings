CREATE TABLE IF NOT EXISTS contact_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_id TEXT,
  account_id TEXT,
  site_id TEXT,
  event_time TIMESTAMPTZ,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_events_entity_id_idx
  ON contact_events (entity_id);

CREATE INDEX IF NOT EXISTS contact_events_event_time_idx
  ON contact_events (event_time DESC);

CREATE TABLE IF NOT EXISTS app_lifecycle_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  app_name TEXT,
  owner_email TEXT,
  instance_id TEXT,
  account_id TEXT,
  site_id TEXT,
  occurred_at TIMESTAMPTZ,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_lifecycle_events
  ADD COLUMN IF NOT EXISTS app_name TEXT;

ALTER TABLE app_lifecycle_events
  ADD COLUMN IF NOT EXISTS owner_email TEXT;

CREATE INDEX IF NOT EXISTS app_lifecycle_events_instance_id_idx
  ON app_lifecycle_events (instance_id);

CREATE INDEX IF NOT EXISTS app_lifecycle_events_occurred_at_idx
  ON app_lifecycle_events (occurred_at DESC);
