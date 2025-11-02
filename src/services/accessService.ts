import { supabase } from '@/lib/supabase';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

// Perfil de admin para política de IP
export interface AdminProfile {
  user_id: string;
  allowed_ip: string | null;
  bound_ip: string | null;
  enforce_ip: boolean;
  updated_at?: string;
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
  allowed_ip?: string | null;
  bound_ip?: string | null;
  enforce_ip?: boolean | null;
}

export interface CodeGenerationData {
  clientName: string;
  days: number;
  allowedIp?: string;
  enforceIp?: boolean;
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

  // ========================= ADMIN PROFILES (IP POLICY) =========================
  static async getAdminProfile(userId: string): Promise<AdminProfile | null> {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('user_id, allowed_ip, bound_ip, enforce_ip, updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return null;
    return data as AdminProfile | null;
  }

  static async upsertAdminProfile(userId: string, updates: Partial<AdminProfile>): Promise<AdminProfile | null> {
    const payload = { user_id: userId, ...updates } as any;
    const { data, error } = await supabase
      .from('admin_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select('user_id, allowed_ip, bound_ip, enforce_ip, updated_at')
      .maybeSingle();
    if (error) throw error;
    return data as AdminProfile | null;
  }

  static async clearAdminBoundIp(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('admin_profiles')
      .update({ bound_ip: null })
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  }

  static async bindAdminIpIfNeeded(userId: string, ipAddress?: string): Promise<void> {
    if (!ipAddress) return;
    const profile = await this.getAdminProfile(userId);
    if (!profile) return;
    if (profile.enforce_ip && !profile.bound_ip) {
      await this.upsertAdminProfile(userId, { bound_ip: ipAddress });
    }
  }

  // Buscar todos os códigos de acesso (com cliente relacionado)
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
    if (error && (error as any).code !== 'PGRST116') return null;
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
    return data as Client;
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

  // Verificar se código é válido (não expirado e IP permitido quando aplicável)
  static async isCodeValid(code: string, ipAddress?: string): Promise<boolean> {
    const accessCode = await this.getAccessCodeByCode(code);
    if (!accessCode) return false;
    
    if (accessCode.expires_at) {
      const now = new Date();
      const expiresAt = new Date(accessCode.expires_at);
      // Tolerância para diferenças de relógio do dispositivo (5 minutos)
      const GRACE_MS = 5 * 60 * 1000;
      if (now.getTime() > (expiresAt.getTime() + GRACE_MS)) return false;
    }
    const shouldEnforce = !!(accessCode.allowed_ip && accessCode.allowed_ip.trim() !== '') || !!accessCode.enforce_ip;
    if (shouldEnforce) {
      // Se houver IP permitido definido pelo admin, precisa coincidir
      if (typeof accessCode.allowed_ip === 'string' && accessCode.allowed_ip.trim() !== '') {
        if (!ipAddress) return false;
        if (ipAddress !== accessCode.allowed_ip) return false;
      }
      // Se o código já tiver sido vinculado a um IP no primeiro uso, precisa coincidir
      if (typeof accessCode.bound_ip === 'string' && accessCode.bound_ip?.trim() !== '') {
        if (!ipAddress) return false;
        if (ipAddress !== accessCode.bound_ip) return false;
      }
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
      // Tolerância para diferenças de relógio do dispositivo (5 minutos)
      const GRACE_MS = 5 * 60 * 1000;
      if (now.getTime() > (expiresAt.getTime() + GRACE_MS)) return false;
    }
    
    return true;
  }

  // Marcar código como usado; se não houver bound_ip ainda e receber ipAddress, vincula o IP no primeiro uso
  static async markCodeAsUsed(code: string, deviceId: string, ipAddress?: string): Promise<boolean> {
    // Busca estado atual para decidir bind de IP
    const current = await this.getAccessCodeByCode(code);
    const updates: any = {
      used: true,
      used_at: new Date().toISOString()
    };
    // Vincula IP apenas quando enforce_ip estiver ativo
    if (current?.enforce_ip && ipAddress && (!current?.bound_ip || current.bound_ip.trim() === '')) {
      updates.bound_ip = ipAddress;
    }

    const { data, error } = await supabase
      .from('access_codes')
      .update(updates)
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
    const { clientName, days, allowedIp, enforceIp } = data;
    
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
    // Define expiração para o final do dia local (23:59:59.999)
    expiresAt.setHours(23, 59, 59, 999);
    
    const newCode: Partial<AccessCode> & { code: string; client_id: string; type: string; hours: number; price: number; used: boolean; expires_at: string } = {
      code: code,
      client_id: client.id,
      type: `${days} dias`,
      hours: days * 24,
      price: 0,
      used: false,
      expires_at: expiresAt.toISOString(),
      allowed_ip: allowedIp ? allowedIp : null,
      enforce_ip: !!enforceIp
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

  // Validar código de admin: tenta Supabase (tabela admin_settings, coluna admin_code) e cai para env VITE_ADMIN_CODE
  static async validateAdminCode(inputCode: string): Promise<boolean> {
    const code = (inputCode || '').trim();
    if (!code) return false;
    // 1) Tenta Supabase
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('admin_code')
        .limit(1)
        .maybeSingle();
      if (data && typeof data.admin_code === 'string' && data.admin_code.trim() !== '') {
        if (code === data.admin_code.trim()) return true;
        // Se não bateu, continua para tentar ENV como fallback
      }
    } catch {
      // Tabela pode não existir; segue para fallback
    }
    // 2) Fallback: variável de ambiente
    const envCode = (import.meta as any)?.env?.VITE_ADMIN_CODE as string | undefined;
    if (envCode && envCode.trim() !== '') {
      return code === envCode.trim();
    }
    return false;
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

  // Buscar estatísticas de um cliente específico (versão simplificada)
  static async getClientStats(clientId: string) {
    try {
      // Busca dados básicos do cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('total_likes_sent, unique_players_count, last_activity')
        .eq('id', clientId)
        .single();
      
      if (clientError) throw clientError;

      // Busca histórico de players (se a tabela existir)
      let recentPlayers = [];
      try {
        const { data: players, error: playersError } = await supabase
          .from('client_player_history')
          .select('player_id, player_nickname, total_sent, last_sent_at')
          .eq('client_id', clientId)
          .order('last_sent_at', { ascending: false })
          .limit(10);
        
        if (!playersError && players) {
          recentPlayers = players.map(p => ({
            player_id: p.player_id,
            player_nickname: p.player_nickname,
            total_sent: p.total_sent,
            last_sent_at: p.last_sent_at
          }));
        }
      } catch (error) {
        // Tabela pode não existir ainda, usar array vazio
        console.log('Tabela client_player_history não encontrada');
      }

      return {
        total_likes_sent: client?.total_likes_sent || 0,
        unique_players_count: client?.unique_players_count || 0,
        last_activity: client?.last_activity || new Date().toISOString(),
        recent_players: recentPlayers
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas do cliente:', error);
      // Retorna dados padrão em caso de erro
      return {
        total_likes_sent: 0,
        unique_players_count: 0,
        last_activity: new Date().toISOString(),
        recent_players: []
      };
    }
  }

  // Registrar envio de likes para um cliente (versão simplificada)
  static async recordClientLikeTransaction(
    clientId: string,
    playerId: string,
    playerNickname: string,
    playerRegion: string,
    likesSent: number,
    playerLevel?: number,
    playerExp?: number,
    deviceId?: string,
    ipAddress?: string
  ) {
    try {
      // 1) Tenta executar a função RPC (server-side, atômica)
      const { error: rpcError } = await supabase.rpc('update_client_stats_uuid', {
        client_id_input: clientId,
        player_id_input: playerId,
        player_nickname_input: playerNickname,
        player_region_input: playerRegion,
        likes_sent_input: likesSent,
        player_level_input: playerLevel ?? null,
        player_exp_input: playerExp ?? null,
        device_id_input: deviceId ?? null,
        ip_address_input: ipAddress ?? null
      });

      if (!rpcError) {
        return; // Sucesso via RPC
      }

      console.warn('RPC update_client_stats_uuid falhou, usando fallback cliente:', rpcError);

      // 2) Fallback: lógica client-side
      const { data: currentClient } = await supabase
        .from('clients')
        .select('total_likes_sent')
        .eq('id', clientId)
        .single();

      await supabase
        .from('clients')
        .update({
          total_likes_sent: (currentClient?.total_likes_sent || 0) + likesSent,
          last_activity: new Date().toISOString()
        })
        .eq('id', clientId);

      const { data: existingList } = await supabase
        .from('client_player_history')
        .select('total_sent')
        .eq('client_id', clientId)
        .eq('player_id', playerId)
        .limit(1);

      const existingRecord = existingList?.[0] as { total_sent?: number } | undefined;
      const newTotalSent = (existingRecord?.total_sent || 0) + likesSent;

      if (existingRecord) {
        await supabase
          .from('client_player_history')
          .update({
            player_nickname: playerNickname,
            player_region: playerRegion,
            total_sent: newTotalSent,
            last_sent_at: new Date().toISOString()
          })
          .eq('client_id', clientId)
          .eq('player_id', playerId);
      } else {
        await supabase
          .from('client_player_history')
          .insert({
            client_id: clientId,
            player_id: playerId,
            player_nickname: playerNickname,
            player_region: playerRegion,
            total_sent: likesSent,
            last_sent_at: new Date().toISOString()
          });
      }

      const { count: uniquePlayersCount } = await supabase
        .from('client_player_history')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', clientId);

      await supabase
        .from('clients')
        .update({ unique_players_count: uniquePlayersCount || 0 })
        .eq('id', clientId);
      
    } catch (error) {
      console.error('Erro ao registrar transação do cliente:', error);
      // Não falha o processo principal se houver erro no rastreamento
    }
  }
}