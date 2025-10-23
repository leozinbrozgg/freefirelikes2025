-- ========================================
-- SETUP SUPABASE - SISTEMA DE CÓDIGOS DE ACESSO
-- ========================================

-- 1. Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de códigos de acesso
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  hours INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
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
CREATE INDEX IF NOT EXISTS idx_access_codes_expires_at ON access_codes(expires_at);

-- 4. Configurar Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança (permitir todas as operações)
CREATE POLICY IF NOT EXISTS "Allow all operations on clients" ON clients
  FOR ALL USING (true);

CREATE POLICY IF NOT EXISTS "Allow all operations on access_codes" ON access_codes
  FOR ALL USING (true);

-- 6. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Triggers para updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_codes_updated_at BEFORE UPDATE ON access_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Inserir dados de teste (opcional)
INSERT INTO clients (name, email, phone) VALUES
('Cliente Teste', 'teste@email.com', '11999999999')
ON CONFLICT (email) DO NOTHING;

-- 9. Inserir código de teste (opcional)
INSERT INTO access_codes (code, client_id, type, hours, price, expires_at) VALUES
('FF2030', (SELECT id FROM clients WHERE email = 'teste@email.com'), '30 dias', 720, 0, NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;
