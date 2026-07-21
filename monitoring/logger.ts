// ============================================================
// Layer 12: Error Tracking & Logs
// Dois canais: console estruturado (Workers Logs) + Sentry (alertas)
// ============================================================

export type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level:    LogLevel
  message:  string
  context?: Record<string, unknown>
  ts:       string
}

// Logger estruturado — Workers Logs captura console.log como JSON
export function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    context,
    ts: new Date().toISOString(),
  }
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  fn(JSON.stringify(entry))
}

// Atalhos semânticos
export const logger = {
  info:  (msg: string, ctx?: Record<string, unknown>) => log('info',  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log('warn',  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
}

// ---- Integração Sentry (opcional) ----
// Para ativar: wrangler secret put SENTRY_DSN
// e instalar @sentry/cloudflare

export function captureException(err: Error, context?: Record<string, unknown>): void {
  logger.error(err.message, { stack: err.stack, ...context })
  // Em produção com Sentry configurado:
  // Sentry.captureException(err, { extra: context })
}

// ---- O que logar (boas práticas) ----
// ✅ Toda requisição que falha (4xx, 5xx)
// ✅ Operações de escrita no banco (lead criado, status alterado)
// ✅ Rate limit atingido (quem está abusando)
// ✅ Token inválido / tentativa de acesso não autorizado
// ❌ Dados pessoais em logs (email, telefone, IP completo)
// ❌ Logs de sucesso em rotas de alto volume (polui e custa $)
