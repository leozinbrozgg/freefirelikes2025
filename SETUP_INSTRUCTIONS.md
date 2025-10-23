# 🚀 Setup Supabase - Instruções Simples

## 📋 **Passo a Passo:**

### 1. **Acesse o Supabase Dashboard:**
- Vá para [supabase.com](https://supabase.com)
- Faça login na sua conta
- Selecione seu projeto

### 2. **Execute o SQL:**
- Clique em **SQL Editor** no menu lateral
- Clique em **New Query**
- Copie e cole o conteúdo do arquivo `create-tables.sql`
- Clique em **Run** para executar

### 3. **Verificar se funcionou:**
- Vá para **Table Editor**
- Você deve ver as tabelas:
  - `clients`
  - `access_codes`

## 🔧 **Se ainda der erro:**

### **Verificar se está no projeto correto:**
- URL deve ser: `https://pqeydpgqmkwprjnxgklj.supabase.co`
- Verifique se está no projeto certo

### **Verificar permissões:**
- Certifique-se de que tem permissão para criar tabelas
- Se necessário, use a chave de serviço em vez da anon key

## 📝 **SQL para executar:**

```sql
-- Criar tabela de clientes
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de códigos de acesso
CREATE TABLE access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  hours INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_client_id ON access_codes(client_id);
CREATE INDEX idx_access_codes_used ON access_codes(used);

-- Configurar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Criar políticas (permitir todas as operações)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on access_codes" ON access_codes FOR ALL USING (true);
```

## ✅ **Após executar:**
1. Teste gerar um código na página `/admin`
2. Verifique se aparece na tabela
3. Teste editar e excluir

**Execute o SQL e teste novamente!** 🎉
