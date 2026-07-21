// ============================================================
// Layer 4: Auth & Permissions
// JWT stateless — sem sessão no servidor, sem banco para auth
// O token é assinado com HS256 usando JWT_SECRET (wrangler secret)
// ============================================================

import type { MiddlewareHandler } from 'hono'
import type { Bindings } from '../index'

export const authMiddleware: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Token não fornecido' }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET)

    // Verifica permissão mínima para acesso admin
    if (payload.role !== 'admin') {
      return c.json({ error: 'Acesso negado' }, 403)
    }

    // Injeta dados do usuário no contexto para uso nas rotas
    c.set('user' as never, payload)
    await next()
  } catch {
    return c.json({ error: 'Token inválido ou expirado' }, 401)
  }
}

// ---- Implementação JWT usando Web Crypto API (nativa no Workers) ----

interface JWTPayload {
  sub: string
  role: 'admin' | 'viewer'
  exp: number
  iat: number
}

async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  const [headerB64, payloadB64, signatureB64] = token.split('.')
  if (!headerB64 || !payloadB64 || !signatureB64) throw new Error('JWT malformado')

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const data      = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const signature = base64UrlDecode(signatureB64)
  const valid     = await crypto.subtle.verify('HMAC', key, signature, data)

  if (!valid) throw new Error('Assinatura inválida')

  const payload: JWTPayload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))

  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expirado')

  return payload
}

export async function signJWT(payload: Omit<JWTPayload, 'iat'>, secret: string): Promise<string> {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now     = Math.floor(Date.now() / 1000)
  const body    = btoa(JSON.stringify({ ...payload, iat: now }))
  const message = `${header}.${body}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${message}.${sigB64}`
}

function base64UrlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}
