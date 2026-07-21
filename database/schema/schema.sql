-- ============================================================
-- Layer 3: Database & Storage
-- Sub-camada 1: Data Modeling
-- Modelagem dos dados do domínio Kaya Raízes Performance
-- ============================================================

-- Tabela principal de leads capturados via formulário e WhatsApp
CREATE TABLE IF NOT EXISTS leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Dados de identificação
  nome          TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  telefone      TEXT    NOT NULL,

  -- Qualificação de negócio
  segmento      TEXT    NOT NULL,                     -- ex: varejo, saúde, educação
  investimento  TEXT,                                  -- faixa de orçamento em mídia
  mensagem      TEXT,                                  -- mensagem livre do formulário

  -- Rastreamento de origem (para saber qual canal gerou o lead)
  origem        TEXT    NOT NULL DEFAULT 'direto',    -- URL/Referer da página
  ip            TEXT,                                  -- IP para deduplicação avançada
  utm_source    TEXT,                                  -- ex: facebook, google
  utm_medium    TEXT,                                  -- paid-social, cpc
  utm_campaign  TEXT,                                  -- nome da campanha

  -- Gestão do lead (funil interno da Kaya)
  status        TEXT    NOT NULL DEFAULT 'novo'       -- novo | contatado | qualificado | fechado | perdido
                CHECK(status IN ('novo','contatado','qualificado','fechado','perdido')),
  responsavel   TEXT,                                  -- quem na Kaya está acompanhando
  notas         TEXT,                                  -- observações internas

  -- Timestamps — sempre UTC
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  contatado_em  TEXT                                   -- quando o primeiro contato foi feito
);

-- Tabela de usuários admin (acesso ao painel)
CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,                      -- bcrypt hash — NUNCA armazene senha em texto puro
  role          TEXT    NOT NULL DEFAULT 'viewer'
                CHECK(role IN ('admin', 'viewer')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- Tabela de log de atividades (audit trail)
CREATE TABLE IF NOT EXISTS activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER REFERENCES admin_users(id),
  acao       TEXT    NOT NULL,                         -- ex: 'lead.status_changed', 'lead.viewed'
  lead_id    INTEGER REFERENCES leads(id),
  detalhes   TEXT,                                     -- JSON com dados da mudança
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
