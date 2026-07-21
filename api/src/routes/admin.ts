// Layer 2: APIs & Backend Logic — painel admin (protegido por JWT)
// GET /api/admin/leads    → lista leads paginados
// GET /api/admin/leads/:id → detalhe de um lead

import { Hono } from 'hono'
import type { Bindings } from '../index'

export const adminRouter = new Hono<{ Bindings: Bindings }>()

// Layer 10: Caching — usa KV para cachear listagem por 60s
adminRouter.get('/leads', async (c) => {
  const page  = Number(c.req.query('page')  ?? 1)
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)
  const offset = (page - 1) * limit

  const cacheKey = `leads:page:${page}:limit:${limit}`
  const cached = await c.env.CACHE.get(cacheKey, 'json') as unknown[] | null
  if (cached) return c.json({ data: cached, source: 'cache', page, limit })

  // Layer 3: Query Optimization — usa índice em created_at para ordenação eficiente
  const { results } = await c.env.DB
    .prepare(`
      SELECT id, nome, email, segmento, investimento, origem, created_at
      FROM leads
      ORDER BY created_at DESC
      LIMIT ?1 OFFSET ?2
    `)
    .bind(limit, offset)
    .all()

  const { results: countResult } = await c.env.DB
    .prepare('SELECT COUNT(*) as total FROM leads')
    .all()

  const total = (countResult[0] as { total: number }).total

  const response = { data: results, total, page, limit, source: 'db' }

  // Salva no cache KV por 60 segundos
  await c.env.CACHE.put(cacheKey, JSON.stringify(results), { expirationTtl: 60 })

  return c.json(response)
})

adminRouter.get('/leads/:id', async (c) => {
  const id = Number(c.req.param('id'))
  if (isNaN(id)) return c.json({ error: 'ID inválido' }, 400)

  const lead = await c.env.DB
    .prepare('SELECT * FROM leads WHERE id = ?1')
    .bind(id)
    .first()

  if (!lead) return c.json({ error: 'Lead não encontrado' }, 404)
  return c.json(lead)
})

// Estatísticas para dashboard
adminRouter.get('/stats', async (c) => {
  const { results } = await c.env.DB
    .prepare(`
      SELECT
        COUNT(*)                                          AS total,
        COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) AS hoje,
        COUNT(CASE WHEN created_at >= date('now', '-7 days') THEN 1 END) AS ultimos_7_dias,
        segmento,
        COUNT(*) AS por_segmento
      FROM leads
      GROUP BY segmento
      ORDER BY por_segmento DESC
    `)
    .all()

  return c.json({ stats: results })
})
