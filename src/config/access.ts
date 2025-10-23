// ========================================
// CONFIGURAÇÃO DE ACESSO - SISTEMA DE CÓDIGOS
// ========================================

// Tipos de acesso disponíveis
export const ACCESS_TYPES = {
  DIARIO: { name: 'Diário', hours: 24, price: 5.00 },
  SEMANAL: { name: 'Semanal', hours: 168, price: 15.00 },
  MENSAL: { name: 'Mensal', hours: 720, price: 50.00 },
  TRIMESTRAL: { name: 'Trimestral', hours: 2160, price: 120.00 },
  ANUAL: { name: 'Anual', hours: 8760, price: 400.00 }
};

// Clientes e seus códigos de acesso
export const CLIENTS = [
  {
    id: 1,
    name: 'Cliente A',
    email: 'clienteA@email.com',
    phone: '11999999999',
    codes: [
      { code: 'FE2030', type: 'MENSAL', hours: 720, used: false, createdAt: '2024-01-15' },
      { code: 'FE2031', type: 'MENSAL', hours: 720, used: false, createdAt: '2024-01-15' }
    ]
  },
  {
    id: 2,
    name: 'Cliente B', 
    email: 'clienteB@email.com',
    phone: '11888888888',
    codes: [
      { code: 'FF2130', type: 'MENSAL', hours: 720, used: false, createdAt: '2024-01-16' },
      { code: 'FF2131', type: 'SEMANAL', hours: 168, used: false, createdAt: '2024-01-16' }
    ]
  },
  {
    id: 3,
    name: 'Cliente C',
    email: 'clienteC@email.com', 
    phone: '11777777777',
    codes: [
      { code: 'FF1F30', type: 'MENSAL', hours: 720, used: false, createdAt: '2024-01-17' }
    ]
  }
];

// Códigos já utilizados (para controle)
export const USED_CODES = [
  'FF2030',    // Usado em produção
  'VIP2024',   // Usado em produção
  'PREMIUM',   // Usado em produção
  'TESTE'      // Código de teste usado
];

// Configuração principal do sistema
export const ACCESS_CONFIG = {
  // Tempo de expiração padrão (em horas)
  DEFAULT_EXPIRATION_HOURS: 720,
  
  // Mensagens do sistema
  MESSAGES: {
    INVALID_CODE: 'Código de acesso inválido. Verifique e tente novamente.',
    LOADING: 'Carregando sistema...',
    ACCESS_REQUIRED: 'Este sistema requer um código de acesso para ser utilizado.',
    CONTACT_INFO: 'Entre em contato conosco para obter seu código de acesso.',
    CODE_TIP: '💡 Dica: O código é sensível a maiúsculas e minúsculas',
    CODE_ALREADY_USED: 'Este código já foi utilizado. Entre em contato para obter um novo código.',
    CODE_EXPIRED: 'Este código expirou. Entre em contato para renovar.'
  },

  // Configurações do Supabase
  SUPABASE: {
    // URL e chave do Supabase (já configuradas no projeto)
    URL: import.meta.env.VITE_SUPABASE_URL || '',
    ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    
    // Tabelas do Supabase
    TABLES: {
      CLIENTS: 'clients',
      ACCESS_CODES: 'access_codes',
      CODE_USAGE: 'code_usage',
      DEVICE_TRACKING: 'device_tracking'
    }
  }
};

// Função para buscar cliente por código
export const findClientByCode = (code: string) => {
  for (const client of CLIENTS) {
    const clientCode = client.codes.find(c => c.code === code);
    if (clientCode) {
      return { client, code: clientCode };
    }
  }
  return null;
};

// Função para verificar se código é válido
export const isValidCode = (code: string) => {
  const result = findClientByCode(code);
  return result && !result.code.used && !USED_CODES.includes(code);
};

// Função para marcar código como usado
export const markCodeAsUsed = (code: string) => {
  const result = findClientByCode(code);
  if (result) {
    result.code.used = true;
    USED_CODES.push(code);
  }
};