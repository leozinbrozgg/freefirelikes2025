import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccessService, Client, AccessCode, CodeGenerationData } from '@/services/accessService';
import { Plus, Key, CheckCircle, XCircle, Copy, Edit, Trash2, User as UserIcon, Calendar as CalendarIcon, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useWeeklyBackground } from '@/hooks/useWeeklyBackground';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Admin = () => {
  const { toast } = useToast();
  const bg = useWeeklyBackground();
  const [clients, setClients] = useState<Client[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<AccessCode | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<AccessCode | null>(null);

  // Segurança do Admin (IP)
  const [adminSecurity, setAdminSecurity] = useState({
    allowedIp: '',
    enforceIp: false,
    boundIp: ''
  });
  const [savingAdminSec, setSavingAdminSec] = useState(false);

  // Formulário simplificado de geração de códigos
  const [formData, setFormData] = useState({
    clientName: '',
    days: 30,
    allowedIp: '',
    enforceIp: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientsData, codesData] = await Promise.all([
        AccessService.getClients(),
        AccessService.getAccessCodes()
      ]);
      
      setClients(clientsData);
      setCodes(codesData);
    } catch (error) {
      console.error('Erro ao carregar dados do Admin:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminProfile = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      const prof = await AccessService.getAdminProfile(user.id);
      if (prof) {
        setAdminSecurity({
          allowedIp: prof.allowed_ip || '',
          enforceIp: !!prof.enforce_ip,
          boundIp: prof.bound_ip || ''
        });
      } else {
        // inicializa um perfil vazio
        await AccessService.upsertAdminProfile(user.id, { enforce_ip: false });
      }
    } catch (e) {
      console.error('Erro ao carregar perfil do admin', e);
    }
  };

  const saveAdminProfile = async () => {
    try {
      setSavingAdminSec(true);
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      await AccessService.upsertAdminProfile(user.id, {
        allowed_ip: adminSecurity.allowedIp.trim() || null,
        enforce_ip: !!adminSecurity.enforceIp
      } as any);
      await loadAdminProfile();
      toast({ title: 'Salvo', description: 'Configurações de segurança atualizadas.' });
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao salvar configurações.', variant: 'destructive' });
    } finally {
      setSavingAdminSec(false);
    }
  };

  const clearAdminBoundIp = async () => {
    try {
      setSavingAdminSec(true);
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      await AccessService.clearAdminBoundIp(user.id);
      await loadAdminProfile();
      toast({ title: 'IP desvinculado', description: 'O IP vinculado foi limpo.' });
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao limpar IP vinculado.', variant: 'destructive' });
    } finally {
      setSavingAdminSec(false);
    }
  };

  const handleGenerateCodes = async () => {
    try {
      setLoading(true);
      
      if (editingCode) {
        // Atualizar código existente
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + formData.days);
        
        // Atualizar cliente se o nome mudou
        if (editingCode.clients?.name !== formData.clientName) {
          await AccessService.updateClient(editingCode.client_id, {
            name: formData.clientName
          });
        }
        
        // Atualizar código
        await AccessService.updateCode(editingCode.id, {
          type: `${formData.days} dias`,
          hours: formData.days * 24,
          expires_at: expiresAt.toISOString(),
          allowed_ip: formData.allowedIp?.trim() ? formData.allowedIp.trim() : null,
          enforce_ip: !!formData.enforceIp
        });
        
        toast({
          title: 'Sucesso',
          description: 'Código atualizado com sucesso!'
        });
      } else {
        // Gerar novo código
        const generatedCodes = await AccessService.generateCodesForClient({
          clientName: formData.clientName,
          days: formData.days,
          allowedIp: formData.allowedIp?.trim() || undefined,
          enforceIp: formData.enforceIp
        });
        
        toast({
          title: 'Sucesso',
          description: `${generatedCodes.length} código(s) gerado(s) com sucesso!`
        });
      }
      
      setFormData({
        clientName: '',
        days: 30,
        allowedIp: '',
        enforceIp: true
      });
      setShowGenerateForm(false);
      setEditingCode(null);
      loadData();
    } catch (error) {
      toast({
        title: 'Erro',
        description: editingCode ? 'Erro ao atualizar código' : 'Erro ao gerar códigos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Função para copiar código
  const copyCode = async (code: string) => {
    try {
      // Fallback para navegadores mais antigos
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback para navegadores sem suporte ao clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      toast({
        title: 'Sucesso',
        description: 'Código copiado para a área de transferência!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao copiar código',
        variant: 'destructive'
      });
    }
  };

  // Função para editar código
  const editCode = (code: AccessCode) => {
    setEditingCode(code);
    setFormData({
      clientName: code.clients?.name || '',
      days: Math.floor(code.hours / 24),
      allowedIp: code.allowed_ip || '',
      enforceIp: !!code.enforce_ip
    });
    setShowGenerateForm(true);
  };

  // Função para excluir código
  const deleteCode = async (codeId: string) => {
    try {
      setLoading(true);
      await AccessService.deleteCode(codeId);
      await loadData();
      toast({
        title: 'Sucesso',
        description: 'Código excluído com sucesso!'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir código',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 relative">
      {bg && (
        <div className="absolute inset-0 -z-10">
          <img src={bg} alt="background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/70" />
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-bold text-2xl sm:text-3xl whitespace-nowrap">Códigos de Acesso</h1>
          <Button onClick={() => setShowGenerateForm(true)} className="mt-3 w-full gap-2">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Segurança do Admin removida: uso padrão por e-mail e senha */}


        {/* Modal: Gerar/Editar Código de Acesso */}
        <Dialog open={showGenerateForm} onOpenChange={(v) => {
          setShowGenerateForm(!!v);
          if (!v) setEditingCode(null);
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCode ? 'Editar Código de Acesso' : 'Gerar Código de Acesso'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Nome do cliente"
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 30 })}
                    placeholder="Dias de acesso"
                    className="pl-10"
                  />
                </div>
                <div className="md:col-span-2 relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    id="allowedIp"
                    value={formData.allowedIp}
                    onChange={(e) => setFormData({ ...formData, allowedIp: e.target.value })}
                    placeholder="IP permitido (opcional)"
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <Switch id="enforceIp" checked={formData.enforceIp} onCheckedChange={(v) => setFormData({ ...formData, enforceIp: !!v })} />
                  <span className="text-sm">Vincular IP no primeiro uso (enforce IP)</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleGenerateCodes} disabled={loading || !formData.clientName || !formData.days}>
                  {loading ? (editingCode ? 'Atualizando...' : 'Gerando...') : (editingCode ? 'Salvar Alterações' : 'Gerar Código')}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowGenerateForm(false);
                  setEditingCode(null);
                  setFormData({ clientName: '', days: 30, allowedIp: '', enforceIp: true });
                }}>Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lista Simplificada de Códigos */}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="whitespace-nowrap">Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>IP Permitido</TableHead>
                  <TableHead>IP Vinculado</TableHead>
                  <TableHead>Força IP</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{code.clients?.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{code.code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={code.type === 'MENSAL' ? 'default' : 'secondary'} className="whitespace-nowrap">
                        {code.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.used ? 'destructive' : 'default'}>
                        {code.used ? 'Usado' : 'Ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{code.expires_at ? formatDate(code.expires_at) : 'N/A'}</TableCell>
                    <TableCell className="font-mono text-sm">{code.allowed_ip || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{code.bound_ip || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={code.enforce_ip ? 'default' : 'secondary'}>
                        {code.enforce_ip ? 'Ativo' : 'Desligado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyCode(code.code)}
                          title="Copiar código"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editCode(code)}
                          title="Editar código"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCodeToDelete(code);
                            setConfirmOpen(true);
                          }}
                          title="Excluir código"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Confirmação de exclusão estilizada */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir código?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O código
              {codeToDelete?.code ? (
                <span className="font-mono"> {codeToDelete.code}</span>
              ) : null} será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (codeToDelete?.id) {
                  const id = codeToDelete.id;
                  setConfirmOpen(false);
                  setCodeToDelete(null);
                  await deleteCode(id);
                }
              }}
              className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
