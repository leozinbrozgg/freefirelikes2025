-- ========================================
-- SETUP RÁPIDO - SUPABASE
-- ========================================

-- 1. Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de códigos de acesso
CREATE TABLE IF NOT EXISTS access_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  hours INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_client_id ON access_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_used ON access_codes(used);

-- 4. Configurar Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança (permitir todas as operações)
CREATE POLICY IF NOT EXISTS "Allow all operations on clients" ON clients
  FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Allow all operations on access_codes" ON access_codes
  FOR ALL USING (true);

-- 6. Inserir dados de teste
INSERT INTO clients (name, email, phone) VALUES
('Cliente Teste', 'teste@email.com', '11999999999')
ON CONFLICT (email) DO NOTHING;

-- 7. Inserir código de teste
INSERT INTO access_codes (code, client_id, type, hours, price, expires_at) VALUES
('FF2030', 1, 'MENSAL', 720, 50.00, NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;
