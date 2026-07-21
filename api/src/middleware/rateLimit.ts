// ============================================================
// Layer 9: Rate Limiting
// Usa Cloudflare KV como contador distribuído por IP
// Limite: 10 requisições por minuto por IP
// ============================================================

import type { MiddlewareHandler } from 'hono'
import type { Bindings } from '../index'

const WINDOW_SECONDS = 60
const MAX_REQUESTS   = 10

export const rateLimitMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const ip  = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const key = `ratelimit:${ip}:${Math.floor(Date.now() / (WINDOW_SECONDS * 1000))}`

  const current = await c.env.CACHE.get(key)
  const count   = current ? Number(current) : 0

  if (count >= MAX_REQUESTS) {
    return c.json(
      { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
      429,
      {
        'Retry-After':       String(WINDOW_SECONDS),
        'X-RateLimit-Limit': String(MAX_REQUESTS),
        'X-RateLimit-Reset': String((Math.floor(Date.now() / (WINDOW_SECONDS * 1000)) + 1) * WINDOW_SECONDS),
      }
    )
  }

  // Incrementa contador; TTL = janela de tempo + 5s de margem
  await c.env.CACHE.put(key, String(count + 1), { expirationTtl: WINDOW_SECONDS + 5 })

  // Injeta headers informativos na resposta
  c.header('X-RateLimit-Limit',     String(MAX_REQUESTS))
  c.header('X-RateLimit-Remaining', String(MAX_REQUESTS - count - 1))

  await next()
}
