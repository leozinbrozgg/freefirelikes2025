import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  ThumbsUp, 
  Calendar, 
  Users, 
  TrendingUp,
  Gamepad2,
  Clock,
  X
} from "lucide-react";
import { AccessService } from '@/services/accessService';

interface PlayerHistory {
  player_id: string;
  player_nickname: string;
  total_sent: number;
  last_sent_at: string;
}

interface ClientStats {
  total_likes_sent: number;
  unique_players_count: number;
  last_activity: string;
  recent_players: PlayerHistory[];
}

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientId?: string;
}

export const ClientHistoryModal = ({ isOpen, onClose, clientName, clientId }: ClientHistoryModalProps) => {
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen && clientId) {
      fetchClientStats();
    }
  }, [isOpen, clientId]);

  const fetchClientStats = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const clientStats = await AccessService.getClientStats(clientId);
      setStats(clientStats);
    } catch (err) {
      console.error('Erro ao buscar estatísticas do cliente:', err);
      setError('Erro ao carregar estatísticas do cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Histórico do Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Cliente */}
          <Card className="gradient-card border-border/50 shadow-card backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 gradient-gaming rounded-full flex items-center justify-center shadow-glow">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">{clientName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Estatísticas de uso do sistema
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Carregando estatísticas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchClientStats} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          ) : stats ? (
            <>
              {/* Estatísticas Gerais (somente Total de Likes) */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <Card className="gradient-card border-border/50 shadow-card backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <ThumbsUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.total_likes_sent}</p>
                        <p className="text-sm text-muted-foreground">Total de Likes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Players (sem card para ganho de espaço) */}
              <div>
                {stats.recent_players.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {stats.recent_players.map((player, index) => (
                        <div key={`${player.player_id}-${index}`}>
                          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{player.player_nickname}</p>
                                <p className="text-sm text-muted-foreground">
                                  ID: {player.player_id}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {player.total_sent}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(player.last_sent_at)}
                              </p>
                            </div>
                          </div>
                          {index < stats.recent_players.length - 1 && (
                            <Separator className="my-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8">
                    <Gamepad2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum player recebeu likes ainda
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
