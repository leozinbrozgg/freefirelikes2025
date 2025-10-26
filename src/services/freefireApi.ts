export interface FreeFireApiResponse {
  Likes_Antes: number;
  Likes_Depois: number;
  Likes_Enviados: number;
  PlayerEXP: number;
  PlayerLevel: number;
  PlayerNickname: string;
  PlayerRegion: string;
}

export interface LikeHistoryEntry {
  id: string;
  playerId: string;
  playerNickname: string;
  playerRegion: string;
  quantity: number;
  likesAntes: number;
  likesDepois: number;
  likesEnviados: number;
  playerLevel: number;
  playerEXP: number;
  timestamp: number;
  success: boolean;
}

export interface FreeFireApiRequest {
  uid: string;
  quantity: number;
}

// Endpoints internos (Serverless Vercel)
const INTERNAL_SEND_LIKES = '/api/send-likes';
const INTERNAL_PLAYER_INFO = '/api/player';

export class FreeFireApiService {
  // Função para buscar informações do jogador
  static async getPlayerInfo(playerId: string): Promise<{ nickname: string; region: string } | null> {
    try {
      const targetUrl = `${INTERNAL_PLAYER_INFO}?uid=${encodeURIComponent(playerId)}&_t=${Date.now()}`;
      console.log('Buscando informações do jogador (internal):', targetUrl);

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar jogador: ${response.status}`);
      }

      const data = await response.json();
      console.log('Informações do jogador recebidas:', data);
      
      if (data && data.PlayerNickname && data.PlayerNickname !== `Player_${playerId}`) {
        return {
          nickname: data.PlayerNickname,
          region: data.PlayerRegion || 'BR'
        };
      }
      
      return null;
    } catch (error) {
      // Erro silencioso - API de player não está disponível, mas não é crítico
      console.log('API interna de informações do jogador não disponível, seguindo sem nickname');
      
      return null;
    }
  }

  static async sendLikes(request: FreeFireApiRequest): Promise<FreeFireApiResponse> {
    let apiResponse: FreeFireApiResponse;
    
    // Busca informações do jogador primeiro
    const playerInfo = await this.getPlayerInfo(request.uid);
    
    // Envia diretamente a quantidade solicitada (máximo 100 likes por 24h)
    console.log(`📤 Enviando ${request.quantity} likes diretamente...`);
    apiResponse = await this.sendLikesNormal(request, playerInfo);

    // Prioriza o nickname da resposta da API externa se for válido
    // Só usa o nickname da getPlayerInfo como fallback se necessário
    if (apiResponse.PlayerNickname && apiResponse.PlayerNickname !== `Player_${request.uid}`) {
      console.log('Usando nickname da API externa:', apiResponse.PlayerNickname);
    } else if (playerInfo && playerInfo.nickname) {
      console.log('Usando nickname da getPlayerInfo:', playerInfo.nickname);
      apiResponse.PlayerNickname = playerInfo.nickname;
      apiResponse.PlayerRegion = playerInfo.region;
    } else {
      // Bloqueia operação quando não há confirmação de jogador existente
      throw new Error('Jogador não encontrado. Verifique o ID e tente novamente.');
    }

    // Salva no histórico (local e Supabase)
    try {
      await this.saveToHistory(apiResponse, request);
    } catch (error) {
      console.error('Erro ao salvar no histórico:', error);
      // Continua mesmo se falhar ao salvar
    }

    return apiResponse;
  }

  // Método para enviar likes (método único e direto)
  static async sendLikesNormal(request: FreeFireApiRequest, playerInfo?: { nickname: string; region: string } | null): Promise<FreeFireApiResponse> {
    // Sempre usa a função serverless interna
    return await this.sendLikesWithBackend(request);
  }

  // Método usando função serverless interna
  static async sendLikesWithBackend(request: FreeFireApiRequest): Promise<FreeFireApiResponse> {
    const backendUrl = INTERNAL_SEND_LIKES;
    console.log('Enviando via função interna:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: request.uid,
        quantity: request.quantity
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro no servidor backend: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Resposta via servidor backend:', data);
    
    // Valida se a resposta contém os campos necessários
    if (!data || typeof data.Likes_Antes !== 'number' || typeof data.Likes_Depois !== 'number') {
      throw new Error('Resposta do servidor backend inválida');
    }
    
    return data as FreeFireApiResponse;
  }

  // Fallbacks antigos (proxy/JSONP/no-cors) removidos para evitar expor chaves

  // Removido fallback de simulação para evitar dados fictícios

  static validatePlayerId(playerId: string): boolean {
    const numericId = parseInt(playerId);
    return !isNaN(numericId) && numericId >= 10000000 && numericId <= 99999999999;
  }

  static validateQuantity(quantity: number): boolean {
    return quantity > 0 && quantity <= 1000;
  }

  // Removido gerador de nickname amigável para não criar jogadores fictícios

  // Métodos para gerenciar histórico
  static async saveToHistory(apiResponse: FreeFireApiResponse, request: Omit<FreeFireApiRequest, 'key'>): Promise<void> {
    // Log detalhado para debug
    console.log('🔍 Analisando dados da API:', {
      uid: request.uid,
      quantity: request.quantity,
      likesAntes: apiResponse.Likes_Antes,
      likesDepois: apiResponse.Likes_Depois,
      likesEnviados: apiResponse.Likes_Enviados,
      diferenca: apiResponse.Likes_Depois - apiResponse.Likes_Antes
    });

    const realLikesSent = apiResponse.Likes_Depois - apiResponse.Likes_Antes;
    const isSuccess = realLikesSent > 0 && apiResponse.Likes_Depois > apiResponse.Likes_Antes;

    console.log('✅ Resultado da análise:', {
      success: isSuccess,
      likesReportados: apiResponse.Likes_Enviados,
      likesReais: realLikesSent,
      diferenca: Math.abs(apiResponse.Likes_Enviados - realLikesSent),
      motivo: isSuccess ? 'Likes enviados com sucesso' : 
              realLikesSent <= 0 ? 'Nenhum like enviado' :
              apiResponse.Likes_Depois <= apiResponse.Likes_Antes ? 'Likes não aumentaram' :
              'Condição desconhecida'
    });

    const historyEntry: LikeHistoryEntry = {
      id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId: request.uid,
      playerNickname: apiResponse.PlayerNickname,
      playerRegion: apiResponse.PlayerRegion,
      quantity: request.quantity,
      likesAntes: apiResponse.Likes_Antes,
      likesDepois: apiResponse.Likes_Depois,
      likesEnviados: realLikesSent,
      playerLevel: apiResponse.PlayerLevel,
      playerEXP: apiResponse.PlayerEXP,
      timestamp: Date.now(),
      success: isSuccess
    };

    // Salva apenas no Supabase (banco de dados)
    try {
      const { SupabaseService } = await import('./supabaseService');
      await SupabaseService.saveLikeHistory(historyEntry);
    } catch (error) {
      console.error('Erro ao salvar no Supabase:', error);
      // Continua mesmo se falhar no Supabase
    }
  }

}

