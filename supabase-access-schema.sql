-- ========================================
-- SCHEMA SUPABASE - SISTEMA DE CÓDIGOS DE ACESSO
-- ========================================

-- Tabela de clientes
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de códigos de acesso
CREATE TABLE access_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- DIARIO, SEMANAL, MENSAL, TRIMESTRAL, ANUAL
  hours INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de uso de códigos (rastreamento)
CREATE TABLE code_usage (
  id SERIAL PRIMARY KEY,
  code_id INTEGER REFERENCES access_codes(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Tabela de rastreamento de dispositivos
CREATE TABLE device_tracking (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  code_id INTEGER REFERENCES access_codes(id) ON DELETE CASCADE,
  first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);

-- Índices para performance
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_client_id ON access_codes(client_id);
CREATE INDEX idx_access_codes_used ON access_codes(used);
CREATE INDEX idx_code_usage_code_id ON code_usage(code_id);
CREATE INDEX idx_code_usage_client_id ON code_usage(client_id);
CREATE INDEX idx_code_usage_device_id ON code_usage(device_id);
CREATE INDEX idx_device_tracking_device_id ON device_tracking(device_id);
CREATE INDEX idx_device_tracking_client_id ON device_tracking(client_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_codes_updated_at BEFORE UPDATE ON access_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar se código é válido
CREATE OR REPLACE FUNCTION is_code_valid(code_input VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM access_codes 
    WHERE code = code_input 
    AND used = FALSE 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Função para marcar código como usado
CREATE OR REPLACE FUNCTION mark_code_as_used(
  code_input VARCHAR(50),
  device_id_input VARCHAR(255),
  device_info_input JSONB DEFAULT NULL,
  ip_address_input INET DEFAULT NULL,
  user_agent_input TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- Busca o código
  SELECT * INTO code_record FROM access_codes WHERE code = code_input;
  
  IF NOT FOUND OR code_record.used = TRUE THEN
    RETURN FALSE;
  END IF;
  
  -- Marca como usado
  UPDATE access_codes 
  SET used = TRUE, used_at = NOW()
  WHERE code = code_input;
  
  -- Registra o uso
  INSERT INTO code_usage (
    code_id, client_id, device_id, device_info, ip_address, user_agent, expires_at
  ) VALUES (
    code_record.id, 
    code_record.client_id, 
    device_id_input, 
    device_info_input,
    ip_address_input,
    user_agent_input,
    NOW() + (code_record.hours || ' hours')::INTERVAL
  );
  
  -- Atualiza rastreamento de dispositivo
  INSERT INTO device_tracking (device_id, client_id, code_id)
  VALUES (device_id_input, code_record.client_id, code_record.id)
  ON CONFLICT (device_id) 
  DO UPDATE SET 
    last_used_at = NOW(),
    usage_count = device_tracking.usage_count + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Inserir dados iniciais
INSERT INTO clients (name, email, phone) VALUES
('Cliente A', 'clienteA@email.com', '11999999999'),
('Cliente B', 'clienteB@email.com', '11888888888'),
('Cliente C', 'clienteC@email.com', '11777777777');

INSERT INTO access_codes (code, client_id, type, hours, price) VALUES
('FE2030', 1, 'MENSAL', 720, 50.00),
('FE2031', 1, 'MENSAL', 720, 50.00),
('FF2130', 2, 'MENSAL', 720, 50.00),
('FF2131', 2, 'SEMANAL', 168, 15.00),
('FF1F30', 3, 'MENSAL', 720, 50.00);

-- Políticas de segurança (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tracking ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de códigos (para validação)
CREATE POLICY "Allow code validation" ON access_codes
  FOR SELECT USING (true);

-- Política para permitir atualização de códigos (para marcar como usado)
CREATE POLICY "Allow code updates" ON access_codes
  FOR UPDATE USING (true);

-- Política para inserir uso de códigos
CREATE POLICY "Allow code usage insert" ON code_usage
  FOR INSERT WITH CHECK (true);

-- Política para inserir rastreamento de dispositivos
CREATE POLICY "Allow device tracking insert" ON device_tracking
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow device tracking update" ON device_tracking
  FOR UPDATE USING (true);
