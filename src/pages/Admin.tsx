import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AccessService, Client, AccessCode, CodeGenerationData } from '@/services/accessService';
import { Plus, Key, CheckCircle, XCircle, Copy, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<AccessCode | null>(null);

  // Formulário simplificado de geração de códigos
  const [formData, setFormData] = useState({
    clientName: '',
    days: 30
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
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
          expires_at: expiresAt.toISOString()
        });
        
        toast({
          title: 'Sucesso',
          description: 'Código atualizado com sucesso!'
        });
      } else {
        // Gerar novo código
        const generatedCodes = await AccessService.generateCodesForClient(formData);
        
        toast({
          title: 'Sucesso',
          description: `${generatedCodes.length} código(s) gerado(s) com sucesso!`
        });
      }
      
      setFormData({
        clientName: '',
        days: 30
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
      days: Math.floor(code.hours / 24)
    });
    setShowGenerateForm(true);
  };

  // Função para excluir código
  const deleteCode = async (codeId: string) => {
    if (!confirm('Tem certeza que deseja excluir este código?')) return;
    
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Códigos de Acesso</h1>
          <Button onClick={() => setShowGenerateForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Gerar Códigos
          </Button>
        </div>


        {/* Formulário Simplificado de Geração */}
        {showGenerateForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingCode ? 'Editar Código de Acesso' : 'Gerar Código de Acesso'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="Nome do cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Dias de Acesso</Label>
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 30 })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleGenerateCodes} disabled={loading || !formData.clientName || !formData.days}>
                  {loading ? (editingCode ? 'Atualizando...' : 'Gerando...') : (editingCode ? 'Atualizar Código' : 'Gerar Código')}
                </Button>
                <Button variant="outline" onClick={() => {
                  setShowGenerateForm(false);
                  setEditingCode(null);
                  setFormData({ clientName: '', days: 30 });
                }}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista Simplificada de Códigos */}
        <Card>
          <CardHeader>
            <CardTitle>Códigos de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
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
                    <TableCell>
                      <Badge variant={code.type === 'MENSAL' ? 'default' : 'secondary'}>
                        {code.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.used ? 'destructive' : 'default'}>
                        {code.used ? 'Usado' : 'Ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{code.expires_at ? formatDate(code.expires_at) : 'N/A'}</TableCell>
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
                          onClick={() => deleteCode(code.id!)}
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
    </div>
  );
};

export default Admin;
