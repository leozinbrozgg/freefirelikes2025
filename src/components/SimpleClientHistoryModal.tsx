import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  ThumbsUp, 
  Users, 
  Clock,
  X
} from "lucide-react";
import { AccessService } from '@/services/accessService';

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientId?: number;
}

export const SimpleClientHistoryModal = ({ isOpen, onClose, clientName, clientId }: ClientHistoryModalProps) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchClientStats();
    }
  }, [isOpen, clientId]);

  const fetchClientStats = async () => {
    if (!clientId) return;
    
    setIsLoading(true);
    
    try {
      const clientStats = await AccessService.getClientStats(clientId);
      setStats(clientStats);
    } catch (err) {
      console.error('Erro ao buscar estatísticas do cliente:', err);
      setStats({
        total_likes_sent: 0,
        unique_players_count: 0,
        last_activity: new Date().toISOString(),
        recent_players: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader className="pb-4">
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
          ) : stats ? (
            <>
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="gradient-card border-border/50 shadow-card backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <ThumbsUp className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.total_likes_sent || 0}</p>
                        <p className="text-sm text-muted-foreground">Total de Likes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="gradient-card border-border/50 shadow-card backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.unique_players_count || 0}</p>
                        <p className="text-sm text-muted-foreground">Players Únicos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="gradient-card border-border/50 shadow-card backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">
                          {stats.last_activity ? new Date(stats.last_activity).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">Última Atividade</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Players */}
              {stats.recent_players && stats.recent_players.length > 0 ? (
                <Card className="gradient-card border-border/50 shadow-card backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Players que Receberam Likes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.recent_players.map((player: any, index: number) => (
                        <div key={`${player.player_id}-${index}`} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{player.player_nickname}</p>
                              <p className="text-sm text-muted-foreground">ID: {player.player_id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{player.total_sent} likes</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(player.last_sent_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="gradient-card border-border/50 shadow-card backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Nenhum player recebeu likes ainda
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
