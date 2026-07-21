-- ============================================================
-- Seeds — dados de teste para ambiente local
-- Aplicar com: npm run db:seed:local (NUNCA em produção)
-- ============================================================

INSERT INTO admin_users (email, password_hash, role) VALUES
  ('admin@kayaraizes.com.br', '$2b$10$SUBSTITUA_PELO_HASH_REAL', 'admin');

INSERT INTO leads (nome, email, telefone, segmento, investimento, status, origem) VALUES
  ('Ana Ferreira',   'ana@exemplo.com.br',   '(11) 99999-0001', 'Varejo',    'R$ 1.000 - R$ 3.000', 'novo',        'https://kayaraizes.com.br'),
  ('Bruno Costa',    'bruno@exemplo.com.br',  '(21) 99999-0002', 'Saúde',     'R$ 3.000 - R$ 7.000', 'contatado',   'https://kayaraizes.com.br/?utm_source=instagram'),
  ('Carla Mendes',   'carla@exemplo.com.br',  '(31) 99999-0003', 'Educação',  'R$ 500 - R$ 1.000',   'qualificado', 'https://kayaraizes.com.br/?utm_source=google'),
  ('Diego Souza',    'diego@exemplo.com.br',  '(41) 99999-0004', 'Imóveis',   'R$ 7.000+',            'fechado',     'whatsapp-direto'),
  ('Elena Rodrigues','elena@exemplo.com.br',  '(51) 99999-0005', 'Varejo',    'R$ 1.000 - R$ 3.000', 'perdido',     'https://kayaraizes.com.br');
