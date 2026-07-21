// ============================================================
// Layer 2: APIs & Backend Logic — ponto de entrada do Worker
// Hono é um framework web ultra-leve feito para edge/Workers
// ============================================================

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { leadsRouter } from './routes/leads'
import { adminRouter } from './routes/admin'
import { securityMiddleware } from './middleware/security'
import { rateLimitMiddleware } from './middleware/rateLimit'
import { authMiddleware } from './middleware/auth'

export type Bindings = {
  DB: D1Database          // Layer 3: Database
  CACHE: KVNamespace      // Layer 10: Cache
  JWT_SECRET: string      // Layer 4: Auth
  SENTRY_DSN: string      // Layer 12: Monitoring
  ENVIRONMENT: string
  ALLOWED_ORIGIN: string
}

const app = new Hono<{ Bindings: Bindings }>()

// ---- Layer 12: Logs de todas as requisições ----
app.use('*', logger())

// ---- Layer 8: Security headers em toda resposta ----
app.use('*', securityMiddleware)

// ---- Layer 10: CORS — só aceita origem do site ----
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = c.env.ALLOWED_ORIGIN
    if (origin === allowed || origin === 'http://localhost:3000') return origin
    return null
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}))

// ---- Layer 9: Rate Limiting nas rotas de API ----
app.use('/api/*', rateLimitMiddleware)

// ---- Rotas públicas ----
app.route('/api/leads', leadsRouter)

// ---- Rotas protegidas (Layer 4: Auth) ----
app.use('/api/admin/*', authMiddleware)
app.route('/api/admin', adminRouter)

// Health check
app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }))

// 404 padrão
app.notFound((c) => c.json({ error: 'Rota não encontrada' }, 404))

// ---- Layer 12: Centraliza erros não tratados ----
app.onError((err, c) => {
  console.error('[KRP Error]', err.message, err.stack)
  return c.json({ error: 'Erro interno do servidor' }, 500)
})

export default app
