// Script para testar especificamente a função generateCodesForClient
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pqeydpgqmkwprjnxgklj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZXlkcGdxbWt3cHJqbnhna2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjMzMTksImV4cCI6MjA3NDAzOTMxOX0.d8v273r_iO-ZU4E4Mn8L-BPBibvTM3V9Ie0vbMmuHSM';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simular a função generateCodesForClient
async function generateCodesForClient(data) {
  const { clientName, days } = data;
  
  console.log(`🔍 Gerando código para: ${clientName} (${days} dias)`);
  
  // Verificar se cliente já existe
  console.log('1. Verificando se cliente existe...');
  const { data: existingClient, error: findError } = await supabase
    .from('clients')
    .select('*')
    .eq('name', clientName)
    .single();
  
  let client = existingClient;
  
  if (findError && findError.code !== 'PGRST116') {
    console.log('❌ Erro ao buscar cliente:', findError);
    throw findError;
  }
  
  if (!client) {
    console.log('2. Cliente não existe, criando novo...');
    try {
      // Gerar email único para evitar conflitos
      const timestamp = Date.now();
      const uniqueEmail = `${clientName.toLowerCase().replace(/\s+/g, '')}_${timestamp}@cliente.com`;
      
      console.log(`   Email único: ${uniqueEmail}`);
      
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert([{
          name: clientName,
          email: uniqueEmail,
          phone: '00000000000'
        }])
        .select()
        .single();
      
      if (createError) {
        console.log('❌ Erro ao criar cliente:', createError);
        
        // Se erro de email duplicado, tentar buscar novamente
        if (createError.code === '23505' || createError.message?.includes('duplicate key')) {
          console.log('   Tentando buscar cliente novamente...');
          const { data: retryClient, error: retryError } = await supabase
            .from('clients')
            .select('*')
            .eq('name', clientName)
            .single();
          
          if (retryError) {
            throw new Error('Erro ao criar cliente: email duplicado e cliente não encontrado');
          }
          
          client = retryClient;
          console.log('✅ Cliente encontrado após retry:', client);
        } else {
          throw createError;
        }
      } else {
        client = newClient;
        console.log('✅ Cliente criado com sucesso:', client);
      }
    } catch (error) {
      console.log('❌ Erro geral ao criar cliente:', error);
      throw error;
    }
  } else {
    console.log('✅ Cliente já existe:', client);
  }

  // Gerar código aleatório no formato FF2030
  console.log('3. Gerando código aleatório...');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  const letter1 = letters.charAt(Math.floor(Math.random() * letters.length));
  const letter2 = letters.charAt(Math.floor(Math.random() * letters.length));
  const num1 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const num2 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const num3 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  const num4 = numbers.charAt(Math.floor(Math.random() * numbers.length));
  
  const code = `${letter1}${letter2}${num1}${num2}${num3}${num4}`;
  console.log(`   Código gerado: ${code}`);

  // Calcular data de expiração
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  console.log(`   Expira em: ${expiresAt.toISOString()}`);
  
  const newCode = {
    code: code,
    client_id: client.id,
    type: `${days} dias`,
    hours: days * 24,
    price: 0,
    used: false,
    expires_at: expiresAt.toISOString()
  };

  console.log('4. Inserindo código no banco...');
  console.log('   Dados do código:', newCode);

  // Inserir código no banco
  const { data: insertedCode, error: codeError } = await supabase
    .from('access_codes')
    .insert([newCode])
    .select(`
      *,
      clients (
        id,
        name,
        email,
        phone
      )
    `);
  
  if (codeError) {
    console.log('❌ Erro ao inserir código:', codeError);
    throw codeError;
  }
  
  console.log('✅ Código inserido com sucesso:', insertedCode);
  return insertedCode || [];
}

// Testar a função
async function testGenerateCodes() {
  try {
    const result = await generateCodesForClient({
      clientName: 'Cliente Teste 2',
      days: 30
    });
    
    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('Resultado:', result);
  } catch (error) {
    console.log('\n❌ Teste falhou:', error);
  }
}

testGenerateCodes();
