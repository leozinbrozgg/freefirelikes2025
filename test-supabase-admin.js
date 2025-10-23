// Script para testar operações da página admin no Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pqeydpgqmkwprjnxgklj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZXlkcGdxbWt3cHJqbnhna2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjMzMTksImV4cCI6MjA3NDAzOTMxOX0.d8v273r_iO-ZU4E4Mn8L-BPBibvTM3V9Ie0vbMmuHSM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseOperations() {
  console.log('🔍 Testando operações do Admin...\n');

  try {
    // 1. Testar listagem de clientes
    console.log('1. Testando listagem de clientes...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (clientsError) {
      console.log('❌ Erro ao buscar clientes:', clientsError);
    } else {
      console.log('✅ Clientes encontrados:', clients?.length || 0);
    }

    // 2. Testar listagem de códigos
    console.log('\n2. Testando listagem de códigos...');
    const { data: codes, error: codesError } = await supabase
      .from('access_codes')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });
    
    if (codesError) {
      console.log('❌ Erro ao buscar códigos:', codesError);
    } else {
      console.log('✅ Códigos encontrados:', codes?.length || 0);
    }

    // 3. Testar criação de cliente
    console.log('\n3. Testando criação de cliente...');
    const testClient = {
      name: 'Cliente Teste',
      email: 'teste@cliente.com',
      phone: '11999999999'
    };

    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert([testClient])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar cliente:', createError);
      
      // Se erro 409 (Conflict), tentar buscar cliente existente
      if (createError.code === '409') {
        console.log('🔍 Cliente já existe, buscando...');
        const { data: existingClient, error: findError } = await supabase
          .from('clients')
          .select('*')
          .eq('name', testClient.name)
          .single();
        
        if (findError) {
          console.log('❌ Erro ao buscar cliente existente:', findError);
        } else {
          console.log('✅ Cliente existente encontrado:', existingClient);
        }
      }
    } else {
      console.log('✅ Cliente criado com sucesso:', newClient);
    }

    // 4. Testar criação de código
    console.log('\n4. Testando criação de código...');
    const testCode = {
      code: 'TEST123',
      client_id: newClient?.id || 'test-id',
      type: '30 dias',
      hours: 720,
      price: 0,
      used: false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const { data: newCode, error: codeError } = await supabase
      .from('access_codes')
      .insert([testCode])
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
      console.log('❌ Erro ao criar código:', codeError);
    } else {
      console.log('✅ Código criado com sucesso:', newCode);
    }

  } catch (error) {
    console.log('❌ Erro geral:', error);
  }
}

testSupabaseOperations();
