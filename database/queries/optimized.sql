-- ============================================================
-- Sub-camada 3: Query Optimization
-- Exemplos de queries otimizadas vs. ingênuas
-- Sub-camada 7: Monitoring & Tuning — use EXPLAIN QUERY PLAN
-- ============================================================

-- ---- DIAGNÓSTICO: ver plano de execução de uma query ----
-- EXPLAIN QUERY PLAN SELECT * FROM leads WHERE email = 'teste@email.com';
-- Resultado esperado: "SEARCH leads USING INDEX idx_leads_email"
-- Se aparecer "SCAN leads" → não está usando índice → precisa de um


-- ---- 1. Busca de leads recentes com paginação ----
-- RUIM: carrega tudo na memória e fatia depois
-- SELECT * FROM leads ORDER BY created_at DESC;

-- BOM: usa índice + LIMIT/OFFSET direto no banco
SELECT id, nome, email, segmento, status, created_at
FROM   leads
ORDER  BY created_at DESC
LIMIT  20 OFFSET 0;   -- page 1


-- ---- 2. Contar leads por segmento (para dashboard) ----
-- RUIM: duas queries separadas
-- SELECT segmento FROM leads; → processa no app
-- BOM: agrega no banco, retorna só o resumo
SELECT   segmento,
         COUNT(*)                                             AS total,
         COUNT(CASE WHEN status = 'qualificado' THEN 1 END)  AS qualificados,
         COUNT(CASE WHEN status = 'fechado'     THEN 1 END)  AS fechados
FROM     leads
GROUP BY segmento
ORDER BY total DESC;


-- ---- 3. Dashboard: leads dos últimos 30 dias por dia ----
SELECT   date(created_at)  AS dia,
         COUNT(*)           AS leads
FROM     leads
WHERE    created_at >= date('now', '-30 days')  -- usa índice em created_at
GROUP BY dia
ORDER BY dia ASC;


-- ---- 4. Verificar duplicata eficientemente ----
-- RUIM: COUNT(*) conta todas as linhas antes de responder
-- SELECT COUNT(*) FROM leads WHERE email = ?;

-- BOM: para na primeira ocorrência (LIMIT 1)
SELECT 1 FROM leads WHERE email = ? LIMIT 1;


-- ---- Sub-camada 4: Backups & Replication ----
-- Cloudflare D1 oferece "Time Travel" — snapshot automático dos últimos 30 dias
-- Para restaurar: wrangler d1 time-travel restore kaya-leads --timestamp=2026-07-20T00:00:00Z
-- Para exportar backup manual: wrangler d1 export kaya-leads --output=backup.sql


-- ---- Sub-camada 6: Concurrency Control ----
-- D1 usa WAL mode (Write-Ahead Logging) por padrão
-- Leituras não bloqueiam escritas — múltiplos Workers podem ler simultaneamente
-- Para operações atômicas multi-tabela, use transações:
BEGIN;
  INSERT INTO leads (...) VALUES (...);
  INSERT INTO activity_log (acao, lead_id) VALUES ('lead.created', last_insert_rowid());
COMMIT;
