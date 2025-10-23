// Script para testar conexão com Supabase
// Execute no console do navegador para debug

const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    // Testar URL
    const response = await fetch('https://pqeydpgqmkwprjnxgklj.supabase.co/rest/v1/', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZXlkcGdxbWt3cHJqbnhna2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjMzMTksImV4cCI6MjA3NDAzOTMxOX0.d8v273r_iO-ZU4E4Mn8L-BPBibvTM3V9Ie0vbMmuHSM',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZXlkcGdxbWt3cHJqbnhna2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjMzMTksImV4cCI6MjA3NDAzOTMxOX0.d8v273r_iO-ZU4E4Mn8L-BPBibvTM3V9Ie0vbMmuHSM'
      }
    });
    
    console.log('✅ Conexão com Supabase OK');
    console.log('Status:', response.status);
    
    // Testar tabelas
    const tablesResponse = await fetch('https://pqeydpgqmkwprjnxgklj.supabase.co/rest/v1/clients', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZXlkcGdxbWt3cHJqbnhna2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjMzMTksImV4cCI6MjA3NDAzOTMxOX0.d8v273r_iO-ZU4E4Mn8L-BPBibvTM3V9Ie0vbMmuHSM',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZXlkcGdxbWt3cHJqbnhna2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NjMzMTksImV4cCI6MjA3NDAzOTMxOX0.d8v273r_iO-ZU4E4Mn8L-BPBibvTM3V9Ie0vbMmuHSM'
      }
    });
    
    if (tablesResponse.status === 404) {
      console.log('❌ Tabelas não encontradas - Execute o SQL no Supabase');
    } else {
      console.log('✅ Tabelas encontradas');
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
  }
};

// Executar teste
testSupabaseConnection();
