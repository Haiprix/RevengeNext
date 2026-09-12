-- AltMaster database schema (Cloudflare D1)
-- Run: wrangler d1 execute altmaster --file=schema.sql

DROP TABLE IF EXISTS appeals;
DROP TABLE IF EXISTS alts;

CREATE TABLE alts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	main_id TEXT NOT NULL,
	alt_id TEXT NOT NULL,
	warning TEXT NOT NULL DEFAULT '',
	reporter_id TEXT,
	status TEXT NOT NULL DEFAULT 'pending'
		CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	decided_at INTEGER,
	decided_by TEXT
);

CREATE UNIQUE INDEX idx_alts_pair ON alts(main_id, alt_id);
CREATE INDEX idx_alts_main_approved ON alts(main_id) WHERE status = 'approved';
CREATE INDEX idx_alts_alt_approved ON alts(alt_id) WHERE status = 'approved';
CREATE INDEX idx_alts_status ON alts(status);

CREATE TABLE appeals (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	alt_id INTEGER NOT NULL REFERENCES alts(id) ON DELETE CASCADE,
	disputer_id TEXT NOT NULL,
	reason TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'open'
		CHECK (status IN ('open', 'resolved')),
	decision TEXT CHECK (decision IN ('removed', 'kept')),
	created_at INTEGER NOT NULL DEFAULT (unixepoch()),
	resolved_at INTEGER,
	resolved_by TEXT
);

CREATE INDEX idx_appeals_alt ON appeals(alt_id);
CREATE INDEX idx_appeals_status ON appeals(status) WHERE status = 'open';