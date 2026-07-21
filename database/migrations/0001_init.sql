-- ============================================================
-- Sub-camada 5: Migrations
-- Migration 0001 — criação inicial do schema
-- Aplicar com: npm run db:migrate (produção) ou db:migrate:local (dev)
-- ============================================================

-- Migrations são incrementais e nunca destrutivas em produção
-- Para desfazer: crie uma migration 0002_rollback.sql

-- Inclui todo o schema inicial + índices + trigger de updated_at

CREATE TABLE IF NOT EXISTS leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  telefone      TEXT    NOT NULL,
  segmento      TEXT    NOT NULL,
  investimento  TEXT,
  mensagem      TEXT,
  origem        TEXT    NOT NULL DEFAULT 'direto',
  ip            TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  status        TEXT    NOT NULL DEFAULT 'novo'
                CHECK(status IN ('novo','contatado','qualificado','fechado','perdido')),
  responsavel   TEXT,
  notas         TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  contatado_em  TEXT
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'viewer'
                CHECK(role IN ('admin', 'viewer')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES admin_users(id),
  acao       TEXT    NOT NULL,
  lead_id    INTEGER REFERENCES leads(id),
  detalhes   TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Sub-camada 2: Indexes — criados após as tabelas
-- (ver database/indexes.sql para explicação de cada um)

CREATE INDEX IF NOT EXISTS idx_leads_email      ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_segmento   ON leads(segmento);
CREATE INDEX IF NOT EXISTS idx_log_lead_id      ON activity_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_log_created_at   ON activity_log(created_at DESC);

-- Sub-camada 6: Concurrency Control
-- Trigger mantém updated_at sempre sincronizado (D1/SQLite não tem ON UPDATE automático)
CREATE TRIGGER IF NOT EXISTS leads_updated_at
  AFTER UPDATE ON leads
  FOR EACH ROW
BEGIN
  UPDATE leads SET updated_at = datetime('now') WHERE id = OLD.id;
END;
