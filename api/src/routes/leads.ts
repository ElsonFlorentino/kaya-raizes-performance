// Layer 2: APIs & Backend Logic — rota de captura de leads
// POST /api/leads → valida, persiste no D1, responde

import { Hono } from 'hono'
import type { Bindings } from '../index'
import { saveLead, isDuplicateLead } from '../services/leads'

export const leadsRouter = new Hono<{ Bindings: Bindings }>()

const REQUIRED_FIELDS = ['nome', 'email', 'telefone', 'segmento'] as const

leadsRouter.post('/', async (c) => {
  let body: Record<string, string>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Payload inválido — envie JSON' }, 400)
  }

  // Validação de campos obrigatórios
  const missing = REQUIRED_FIELDS.filter((f) => !body[f]?.trim())
  if (missing.length) {
    return c.json({ error: `Campos obrigatórios faltando: ${missing.join(', ')}` }, 422)
  }

  // Honeypot anti-spam (campo oculto no formulário)
  if (body._hp) return c.json({ ok: true }) // silencia bots

  // Validação básica de e-mail
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return c.json({ error: 'E-mail inválido' }, 422)
  }

  const db = c.env.DB

  // Layer 3 + sub-camada Concurrency Control: verifica duplicata antes de inserir
  const duplicate = await isDuplicateLead(db, body.email)
  if (duplicate) {
    // Retorna 200 mesmo duplicado — não revela ao usuário que e-mail já existe
    return c.json({ ok: true, message: 'Entraremos em contato em breve.' })
  }

  await saveLead(db, {
    nome:         body.nome.trim(),
    email:        body.email.trim().toLowerCase(),
    telefone:     body.telefone.trim(),
    segmento:     body.segmento.trim(),
    investimento: body.investimento?.trim() ?? null,
    mensagem:     body.mensagem?.trim() ?? null,
    origem:       c.req.header('Referer') ?? 'direto',
    ip:           c.req.header('CF-Connecting-IP') ?? null,
  })

  return c.json({ ok: true, message: 'Entraremos em contato em breve.' }, 201)
})
