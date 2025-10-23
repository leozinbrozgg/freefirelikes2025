# 🚀 Setup do Supabase - Sistema de Códigos de Acesso

## 📋 **Passo a Passo:**

### 1. **Acesse o Supabase Dashboard:**
- Vá para [supabase.com](https://supabase.com)
- Faça login na sua conta
- Selecione seu projeto

### 2. **Execute o Schema SQL:**
- Vá para **SQL Editor** no menu lateral
- Clique em **New Query**
- Copie e cole todo o conteúdo do arquivo `supabase-access-schema.sql`
- Clique em **Run** para executar

### 3. **Verificar Tabelas Criadas:**
- Vá para **Table Editor**
- Você deve ver as tabelas:
  - `clients`
  - `access_codes`
  - `code_usage`
  - `device_tracking`

### 4. **Configurar Variáveis de Ambiente:**
Certifique-se de que seu arquivo `.env` tem:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

## 🔧 **Comandos SQL para Executar:**

```sql
-- Execute este SQL no Supabase SQL Editor:

-- 1. Criar tabela de clientes
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de códigos de acesso
CREATE TABLE access_codes (
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

-- 3. Criar índices
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_client_id ON access_codes(client_id);
CREATE INDEX idx_access_codes_used ON access_codes(used);

-- 4. Configurar RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança
CREATE POLICY "Allow all operations on clients" ON clients
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on access_codes" ON access_codes
  FOR ALL USING (true);
```

## ✅ **Verificação:**
Após executar o SQL, teste gerando um código na página `/admin` para verificar se está funcionando.

## 🆘 **Se ainda der erro:**
1. Verifique se as tabelas foram criadas
2. Verifique se as variáveis de ambiente estão corretas
3. Verifique se as políticas RLS estão ativas
4. Teste a conexão no Supabase Dashboard
