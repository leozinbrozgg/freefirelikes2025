import { supabase } from '@/lib/supabase';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface AccessCode {
  id: string;
  code: string;
  client_id: string;
  type: string;
  hours: number;
  price: number;
  used: boolean;
  used_at?: string;
  expires_at: string;
  created_at: string;
  clients?: Client;
}

export interface CodeGenerationData {
  clientName: string;
  days: number;
}

export class AccessService {
  // Buscar todos os clientes
  static async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  // Buscar cliente por ID
  static async getClientById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  // Buscar cliente por nome
  static async getClientByName(name: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error && error.code !== 'PGRST116') return null;
    return data;
  }

  // Criar novo cliente
  static async createClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Buscar todos os códigos de acesso
  static async getAccessCodes(): Promise<AccessCode[]> {
    const { data, error } = await supabase
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
    
    if (error) throw error;
    return data || [];
  }

  // Buscar código por código
  static async getAccessCodeByCode(code: string): Promise<AccessCode | null> {
    const { data, error } = await supabase
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
      .eq('code', code)
      .single();
    
    if (error) return null;
    return data;
  }

  // Verificar se código é válido (não expirado)
  static async isCodeValid(code: string): Promise<boolean> {
    const accessCode = await this.getAccessCodeByCode(code);
    if (!accessCode) return false;
    
    if (accessCode.expires_at) {
      const now = new Date();
      const expiresAt = new Date(accessCode.expires_at);
      if (now > expiresAt) return false;
    }
    
    return true;
  }

  // Verificar se código ainda é válido (não expirado, mesmo se usado)
  static async isCodeStillValid(code: string): Promise<boolean> {
    const accessCode = await this.getAccessCodeByCode(code);
    if (!accessCode) return false;
    
    if (accessCode.expires_at) {
      const now = new Date();
      const expiresAt = new Date(accessCode.expires_at);
      if (now > expiresAt) return false;
    }
    
    return true;
  }

  // Marcar código como usado
  static async markCodeAsUsed(code: string, deviceId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('access_codes')
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('code', code)
      .select();
    
    if (error) return false;
    return data && data.length > 0;
  }

  // Gerar código aleatório no formato FF2030
  static generateRandomCode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    // Duas letras aleatórias
    const letter1 = letters.charAt(Math.floor(Math.random() * letters.length));
    const letter2 = letters.charAt(Math.floor(Math.random() * letters.length));
    
    // Quatro números aleatórios
    const num1 = numbers.charAt(Math.floor(Math.random() * numbers.length));
    const num2 = numbers.charAt(Math.floor(Math.random() * numbers.length));
    const num3 = numbers.charAt(Math.floor(Math.random() * numbers.length));
    const num4 = numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    return `${letter1}${letter2}${num1}${num2}${num3}${num4}`;
  }

  // Gerar códigos para cliente
  static async generateCodesForClient(data: CodeGenerationData): Promise<AccessCode[]> {
    const { clientName, days } = data;
    
    // Verificar se cliente já existe
    let client = await this.getClientByName(clientName);
    
    // Se não existe, criar novo cliente
    if (!client) {
      try {
        // Gerar email único para evitar conflitos
        const timestamp = Date.now();
        const uniqueEmail = `${clientName.toLowerCase().replace(/\s+/g, '')}_${timestamp}@cliente.com`;
        
        client = await this.createClient({
          name: clientName,
          email: uniqueEmail,
          phone: '00000000000'
        });
      } catch (error: any) {
        // Se erro de email duplicado, tentar buscar novamente
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          client = await this.getClientByName(clientName);
          if (!client) {
            throw new Error('Erro ao criar cliente: email duplicado e cliente não encontrado');
          }
        } else {
          throw error;
        }
      }
    }

    // Gerar código aleatório no formato FF2030
    const code = this.generateRandomCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    
    const newCode = {
      code: code,
      client_id: client.id,
      type: `${days} dias`,
      hours: days * 24,
      price: 0,
      used: false,
      expires_at: expiresAt.toISOString()
    };

    // Inserir código no banco
    const { data: insertedCode, error } = await supabase
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
    
    if (error) throw error;
    return insertedCode || [];
  }

  // Atualizar código
  static async updateCode(codeId: string, updates: Partial<AccessCode>): Promise<AccessCode | null> {
    const { data, error } = await supabase
      .from('access_codes')
      .update(updates)
      .eq('id', codeId)
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Atualizar cliente
  static async updateClient(clientId: string, updates: Partial<Client>): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Excluir código
  static async deleteCode(codeId: string): Promise<boolean> {
    const { error } = await supabase
      .from('access_codes')
      .delete()
      .eq('id', codeId);
    
    if (error) throw error;
    return true;
  }

  // Buscar estatísticas
  static async getStats() {
    const { data: clients } = await supabase
      .from('clients')
      .select('id', { count: 'exact' });
    
    const { data: codes } = await supabase
      .from('access_codes')
      .select('id', { count: 'exact' });
    
    const { data: usedCodes } = await supabase
      .from('access_codes')
      .select('id', { count: 'exact' })
      .eq('used', true);
    
    const { data: activeCodes } = await supabase
      .from('access_codes')
      .select('id', { count: 'exact' })
      .eq('used', false);
    
    return {
      totalClients: clients?.length || 0,
      totalCodes: codes?.length || 0,
      usedCodes: usedCodes?.length || 0,
      activeCodes: activeCodes?.length || 0
    };
  }
}