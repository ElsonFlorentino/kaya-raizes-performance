// Layer 2: Business Logic — operações de lead isoladas das rotas
// Toda interação com o banco passa por aqui (Layer 3: Database)
// Usa prepared statements (Layer 8: Security — previne SQL Injection)

interface LeadInput {
  nome:         string
  email:        string
  telefone:     string
  segmento:     string
  investimento: string | null
  mensagem:     string | null
  origem:       string
  ip:           string | null
}

export async function saveLead(db: D1Database, lead: LeadInput): Promise<void> {
  // Layer 3 sub-camada: Concurrency Control — D1 usa transação implícita por statement
  await db
    .prepare(`
      INSERT INTO leads (nome, email, telefone, segmento, investimento, mensagem, origem, ip)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `)
    .bind(
      lead.nome,
      lead.email,
      lead.telefone,
      lead.segmento,
      lead.investimento,
      lead.mensagem,
      lead.origem,
      lead.ip,
    )
    .run()
}

export async function isDuplicateLead(db: D1Database, email: string): Promise<boolean> {
  // Layer 3 sub-camada: Query Optimization — usa índice idx_leads_email
  const row = await db
    .prepare('SELECT 1 FROM leads WHERE email = ?1 LIMIT 1')
    .bind(email)
    .first()

  return row !== null
}
