-- Fix para problemas de RLS no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS temporariamente para testar
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes DISABLE ROW LEVEL SECURITY;

-- 2. Ou criar políticas permissivas para permitir todas as operações
-- (Descomente as linhas abaixo se preferir manter RLS habilitado)

/*
-- Política para permitir todas as operações na tabela clients
CREATE POLICY "Allow all operations on clients" ON clients
FOR ALL USING (true) WITH CHECK (true);

-- Política para permitir todas as operações na tabela access_codes  
CREATE POLICY "Allow all operations on access_codes" ON access_codes
FOR ALL USING (true) WITH CHECK (true);
*/

-- 3. Verificar se as tabelas existem e têm a estrutura correta
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('clients', 'access_codes')
ORDER BY table_name, ordinal_position;

-- 4. Verificar dados existentes
SELECT 'clients' as table_name, count(*) as total FROM clients
UNION ALL
SELECT 'access_codes' as table_name, count(*) as total FROM access_codes;
