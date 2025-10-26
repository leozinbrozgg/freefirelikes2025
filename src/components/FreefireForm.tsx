import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useHistoryRefresh } from "@/contexts/HistoryContext";
import { useAccess } from "@/contexts/AccessContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ThumbsUp, Gamepad2, Clock, User, Calendar, History } from "lucide-react";
import { FreeFireApiService, FreeFireApiResponse } from "@/services/freefireApi";
import { PlayerModal } from "@/components/PlayerModal";
import { ClientHistoryModal } from "@/components/ClientHistoryModal";
import { AccessService } from "@/services/accessService";
import { useWeeklyBackground } from "@/hooks/useWeeklyBackground";

interface FreefireFormData {
  playerId: string;
}


export const FreefireForm = () => {
  const { toast } = useToast();
  const { triggerRefresh } = useHistoryRefresh();
  const { clientName, expiresAt, clientId } = useAccess();
  const bg = useWeeklyBackground();
  const [formData, setFormData] = useState<FreefireFormData>({
    playerId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [playerData, setPlayerData] = useState<FreeFireApiResponse | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  // Timer states
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Button click state
  const [buttonClicked, setButtonClicked] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Controla a duração do estado visual do clique
  useEffect(() => {
    // Se clicou e ainda não está carregando, mostra brevemente (800ms)
    if (buttonClicked && !isLoading) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = setTimeout(() => {
        setButtonClicked(false);
        clickTimeoutRef.current = null;
      }, 800);
    }

    // Se entrar em loading, mantém ativo até o fim
    if (buttonClicked && isLoading) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
    }

    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
    };
  }, [buttonClicked, isLoading]);

  // Quando loading termina, oculta imediatamente o estado de clique
  useEffect(() => {
    if (!isLoading && buttonClicked) {
      setButtonClicked(false);
    }
  }, [isLoading]);

  // Inicializa o timer do localStorage na montagem do componente
  useEffect(() => {
    const savedCooldown = localStorage.getItem('ff-likes-cooldown');
    if (savedCooldown) {
      const cooldownEndTime = parseInt(savedCooldown);
      const now = Date.now();
      const remainingTime = Math.ceil((cooldownEndTime - now) / 1000);
      
      if (remainingTime > 0) {
        setCooldownTime(remainingTime);
        setIsOnCooldown(true);
      } else {
        // Cooldown expirado, limpa o localStorage
        localStorage.removeItem('ff-likes-cooldown');
      }
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (cooldownTime > 0) {
      intervalRef.current = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setIsOnCooldown(false);
            localStorage.removeItem('ff-likes-cooldown');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [cooldownTime]);

  const startCooldown = () => {
    const cooldownEndTime = Date.now() + (3 * 1000); // 3 segundos a partir de agora
    localStorage.setItem('ff-likes-cooldown', cooldownEndTime.toString());
    setCooldownTime(3);
    setIsOnCooldown(true);
  };

  const handleApiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Ativa feedback visual imediato no clique
    setButtonClicked(true);
    
    // Verifica se está em cooldown
    if (isOnCooldown) {
      toast({
        title: "Aguarde o Cooldown! ⏰",
        description: `Aguarde ${cooldownTime} segundos antes de enviar novamente.`,
        variant: "destructive",
      });
      return;
    }
    
    if (!FreeFireApiService.validatePlayerId(formData.playerId)) {
      toast({
        title: "Erro de Validacao",
        description: "ID do jogador deve estar entre 10000000 e 99999999999",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setConnectionStatus('connecting');
    
    try {
      const response = await FreeFireApiService.sendLikes({
        uid: formData.playerId,
        quantity: 100
      });

      setPlayerData(response);
      setConnectionStatus('connected');
      setIsModalOpen(true);
      const realLikesSent = response.Likes_Depois - response.Likes_Antes;
      
      // Registra a transação no banco de dados do cliente
      if (clientId && response.Likes_Enviados > 0) {
        try {
          await AccessService.recordClientLikeTransaction(
            clientId,
            formData.playerId,
            response.PlayerNickname,
            response.PlayerRegion,
            realLikesSent,
            response.PlayerLevel,
            response.PlayerEXP,
            localStorage.getItem('ff-device-id') || undefined,
            undefined // IP address não disponível no frontend
          );
        } catch (error) {
          console.error('Erro ao registrar transação do cliente:', error);
        }
      }
      
      // Atualiza o histórico
      triggerRefresh();
      
      // Inicia o cooldown de 30 segundos
      startCooldown();
      
      // Verifica se os likes foram realmente enviados
      if (response.Likes_Antes === response.Likes_Depois) {
        toast({
          title: "Limite de 24h Atingido! ⏰",
          description: `Este ID já recebeu likes nas últimas 24h. Tente novamente amanhã.`,
          variant: "destructive",
        });
      } else if (response.Likes_Enviados > 0) {
        const realLikesSent = response.Likes_Depois - response.Likes_Antes;
        
        if (realLikesSent < 100) {
          toast({
            title: "Likes aplicados parcialmente",
            description: `${realLikesSent} de 100 likes foram aplicados para ${response.PlayerNickname}. Este ID já recebeu likes nas últimas 24h.`,
          });
        } else {
          toast({
            title: "Likes Enviados com Sucesso! 🔥",
            description: `${realLikesSent} likes enviados para ${response.PlayerNickname}!`,
          });
        }
      } else {
        toast({
          title: "Erro no Envio",
          description: "Não foi possível enviar os likes. Tente novamente.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Erro ao enviar likes:', error);
      setConnectionStatus('error');
      toast({
        title: "Erro ao Enviar Likes",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handlePlayerIdChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, playerId: numericValue }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-center">
        <div className="w-full">
          <Card className="gradient-card border-border/50 shadow-card backdrop-blur-sm relative overflow-hidden">
            {bg && (
              <div className="absolute inset-0 -z-10">
                <img src={bg} alt="background" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-background/30" />
              </div>
            )}
            <CardHeader className="text-left space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent flex-shrink-0 leading-none">
                  Free Fire Likes
                </CardTitle>
                <div
                  className={`${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                    connectionStatus === 'error' ? 'bg-red-500' :
                    'bg-gray-400'
                  } w-[12px] h-[12px] rounded-full relative top-[2px]`}
                />
              </div>

              {/* Informações do cliente */}
              {clientName && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium text-foreground">{clientName}</span>
                  </div>
                  {expiresAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Expira em:</span>
                      <span className="font-medium text-foreground">
                        {new Date(expiresAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  {clientId && (
                    <div className="flex items-center gap-2 text-sm">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Histórico:</span>
                      <button
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        Ver Histórico
                      </button>
                    </div>
                  )}
                </div>
              )}
              {connectionStatus === 'error' && (
                <p className="text-xs text-red-500 mt-1">
                  Usando método alternativo para contornar CORS
                </p>
              )}
            </CardHeader>
              
            <CardContent className="space-y-6">
              <form onSubmit={handleApiSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="relative">
                    <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                    <Input
                      id="playerId"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.playerId}
                      onChange={(e) => handlePlayerIdChange(e.target.value)}
                      placeholder="ID do Jogador"
                      required
                      className="transition-gaming pl-10 bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={`w-full relative rounded-[12px] overflow-hidden pointer-events-none ${
                    (buttonClicked || isLoading)
                      ? `p-[2px] bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] ${isLoading ? 'animate-[gradient_3s_ease_infinite]' : ''}`
                      : ''
                  }`}>
                    <button
                      type="submit"
                      disabled={isLoading || isOnCooldown}
                      onMouseDown={() => setButtonClicked(true)}
                      onTouchStart={() => setButtonClicked(true)}
                      className={`relative z-10 flex h-14 w-full items-center justify-center gap-3 rounded-[10px] px-10 text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pointer-events-auto ${
                        (buttonClicked || isLoading)
                          ? '!bg-transparent !text-foreground'
                          : 'gradient-gaming text-white shadow-gaming hover:shadow-glow glow-hover backdrop-blur-sm'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground"></div>
                          Processando...
                        </>
                      ) : isOnCooldown ? (
                        <>
                          <Clock className="w-5 h-5" />
                          Aguarde {cooldownTime}s
                        </>
                      ) : (
                        <>
                          <ThumbsUp className="w-5 h-5" />
                          Adicionar 100 LIKES
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Modal com informações do jogador */}
      <PlayerModal 
        playerData={playerData} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* Modal com histórico do cliente */}
      <ClientHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        clientName={clientName || ''}
        clientId={clientId}
      />

    </div>
  );
};
