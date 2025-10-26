import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useWeeklyBackground } from '@/hooks/useWeeklyBackground';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const bg = useWeeklyBackground();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (remember) {
        localStorage.setItem('admin-login-remember', '1');
        localStorage.setItem('admin-login-email', email.trim());
      } else {
        localStorage.removeItem('admin-login-remember');
        localStorage.removeItem('admin-login-email');
      }
      toast({ title: 'Login efetuado', description: 'Acesso liberado ao painel.' });
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-preencher e-mail se marcado "lembrar" (não armazena senha)
  if (typeof window !== 'undefined' && !email) {
    try {
      const r = localStorage.getItem('admin-login-remember') === '1';
      if (r) {
        setRemember(true);
        setEmail(localStorage.getItem('admin-login-email') || '');
      }
    } catch {}
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {bg && (
        <div className="absolute inset-0 -z-10">
          <img src={bg} alt="background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/70" />
        </div>
      )}
      <div className="w-full max-w-md relative overflow-hidden rounded-lg">
        {/* Borda gradiente animada (estilo AccessModal) */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-[gradient_3s_ease_infinite] opacity-75 -z-10"></div>
        <div className="absolute inset-[1px] rounded-lg bg-card -z-10"></div>

        <Card className="bg-transparent border-0 shadow-none">
          <CardHeader />
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="border-destructive/50">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="pl-10 bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="pl-10 pr-10 bg-background" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 select-none">
                  <input type="checkbox" className="accent-primary" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Salvar e-mail
                </label>
              </div>
              <Button type="submit" variant="gaming" size="lg" disabled={loading || !email.trim() || !password} className="w-full">
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
;

export default AdminLogin;
