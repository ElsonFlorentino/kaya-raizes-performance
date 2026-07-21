// ============================================================
// Layer 8: Security & RLS
// Headers de segurança em todas as respostas
// RLS (Row Level Security) é aplicado na camada de serviço
// via prepared statements parametrizados — nunca SQL concatenado
// ============================================================

import type { MiddlewareHandler } from 'hono'
import type { Bindings } from '../index'

export const securityMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  await next()

  // Impede clickjacking
  c.header('X-Frame-Options', 'DENY')

  // Impede MIME-type sniffing
  c.header('X-Content-Type-Options', 'nosniff')

  // Força HTTPS em futuros acessos (HSTS)
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // Desativa referrer em cross-origin
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Restringe funcionalidades do browser
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Content Security Policy
  c.header('Content-Security-Policy', [
    "default-src 'none'",
    "connect-src 'self'",
  ].join('; '))

  // Remove header que revela tecnologia usada
  c.header('X-Powered-By', '')
}

// ---- RLS via prepared statements ----
// Toda query no banco usa .bind() com parâmetros — nunca interpolação de string
// Exemplo SEGURO:   db.prepare('SELECT * FROM leads WHERE id = ?1').bind(id)
// Exemplo INSEGURO: db.prepare(`SELECT * FROM leads WHERE id = ${id}`) ← SQL Injection
