import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ACCESS_CONFIG } from '@/config/access';
import { AccessService } from '@/services/accessService';

interface AccessModalProps {
  isOpen: boolean;
  onAccessGranted: () => void;
}

export const AccessModal = ({ isOpen, onAccessGranted }: AccessModalProps) => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const codeToCheck = accessCode.trim().toUpperCase();
      
      // Gera um ID único para este dispositivo/sessão
      const deviceId = localStorage.getItem('ff-device-id') || 
        'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('ff-device-id', deviceId);

      // Verifica se o código é válido usando o Supabase
      const isValid = await AccessService.isCodeValid(codeToCheck);
      if (!isValid) {
        setError('Código inválido ou expirado. Verifique e tente novamente.');
        setIsLoading(false);
        return;
      }

      // Marca o código como usado no Supabase
      const marked = await AccessService.markCodeAsUsed(codeToCheck, deviceId);

      if (marked) {
        // Salva o acesso no localStorage
        localStorage.setItem('ff-access-granted', 'true');
        localStorage.setItem('ff-access-time', Date.now().toString());
        localStorage.setItem('ff-used-code', codeToCheck);
        localStorage.setItem('ff-device-id', deviceId);
        
        // Salva também no sessionStorage para controle adicional
        sessionStorage.setItem('ff-code-used', codeToCheck);
        sessionStorage.setItem('ff-device-id', deviceId);
        
        onAccessGranted();
      } else {
        setError('Este código já foi utilizado. Entre em contato para obter um novo código.');
      }
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessCode(e.target.value);
    setError('');
  };

  const handlePurchaseClick = () => {
    // Redireciona para o WhatsApp com mensagem pré-definida
    window.open('https://wa.me/5515998975154?text=Olá! Quero comprar acesso ao sistema de likes do Free Fire', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="w-80 max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-4rem)] border-border/50 shadow-card backdrop-blur-sm bg-card/95 [&>button]:hidden p-8 !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !fixed relative overflow-hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Borda gradiente animada */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-[gradient_3s_ease_infinite] opacity-75 -z-10"></div>
        <div className="absolute inset-[1px] rounded-lg bg-card -z-10"></div>
        
        <div className="relative space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Input
                id="access-code"
                type="text"
                value={accessCode}
                onChange={handleCodeChange}
                placeholder="Digite seu código"
                className="pl-10 text-center text-lg font-mono tracking-wider bg-background transition-gaming"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {error && (
              <Alert variant="destructive" className="border-destructive/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              variant="gaming"
              size="lg"
              className="w-full"
              disabled={isLoading || !accessCode.trim()}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Liberar Acesso
                </>
              )}
            </Button>
          </form>

          {/* Link sutil com gradiente */}
          <div className="text-center">
            <button
              type="button"
              onClick={handlePurchaseClick}
              className="text-xs font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:from-primary/80 hover:to-secondary/80 transition-all duration-200"
            >
              <span className="font-bold">Não tem código?</span> COMPRE SEU ACESSO PELO WHATSAPP.
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
