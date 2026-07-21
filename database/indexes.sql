-- ============================================================
-- Sub-camada 2: Indexes
-- Índices aceleram leitura ao custo de escrita mais lenta
-- Crie índice apenas em colunas usadas em WHERE, ORDER BY, JOIN
-- ============================================================

-- idx_leads_email: busca rápida de duplicata antes de inserir
-- Usado em: isDuplicateLead() → WHERE email = ?
-- Sem índice: full table scan em 10k leads = lento
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- idx_leads_status: filtra leads por etapa do funil
-- Usado em: /admin/leads?status=novo
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- idx_leads_created_at: ordena lista de leads do mais novo para o mais antigo
-- Usado em: ORDER BY created_at DESC (default da listagem admin)
-- DESC é importante: SQLite usa o índice se a direção bater
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- idx_leads_segmento: filtro e agrupamento por segmento de negócio
-- Usado em: stats → GROUP BY segmento
CREATE INDEX IF NOT EXISTS idx_leads_segmento ON leads(segmento);

-- idx_log_lead_id: busca log de atividades de um lead específico
CREATE INDEX IF NOT EXISTS idx_log_lead_id ON activity_log(lead_id);

-- ---- O QUE NÃO INDEXAR ----
-- Colunas com baixa cardinalidade (ex: role com 2 valores) — não ajuda
-- Colunas raramente consultadas — custo de escrita sem benefício de leitura
-- Texto longo como 'mensagem' — SQLite não indexa parcialmente
