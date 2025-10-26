import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ACCESS_CONFIG } from '@/config/access';
import { AccessService } from '@/services/accessService';

interface AccessContextType {
  hasAccess: boolean;
  grantAccess: () => void;
  revokeAccess: () => void;
  isLoading: boolean;
  clientName?: string;
  expiresAt?: string;
  clientId?: string;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

interface AccessProviderProps {
  children: ReactNode;
}

export const AccessProvider = ({ children }: AccessProviderProps) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clientName, setClientName] = useState<string>();
  const [expiresAt, setExpiresAt] = useState<string>();
  const [clientId, setClientId] = useState<string>();

  useEffect(() => {
    // Verifica se o usuário já tem acesso
    const checkAccess = async () => {
      const usedCode = localStorage.getItem('ff-used-code');
      
      if (usedCode) {
        try {
          // Verifica se o código ainda é válido no Supabase (mesmo se já foi usado)
          const isStillValid = await AccessService.isCodeStillValid(usedCode);
          if (isStillValid) {
            // Busca informações do código para obter nome do cliente e data de expiração
            const accessCode = await AccessService.getAccessCodeByCode(usedCode);
            if (accessCode) {
              setHasAccess(true);
              setClientName(accessCode.clients?.name);
              setExpiresAt(accessCode.expires_at);
              setClientId(accessCode.client_id);
            }
          } else {
            // Código expirado, limpa o localStorage
            localStorage.removeItem('ff-access-granted');
            localStorage.removeItem('ff-access-time');
            localStorage.removeItem('ff-used-code');
            localStorage.removeItem('ff-device-id');
            sessionStorage.removeItem('ff-code-used');
            sessionStorage.removeItem('ff-device-id');
            setClientName(undefined);
            setExpiresAt(undefined);
            setClientId(undefined);
          }
        } catch (error) {
          console.error('Erro ao verificar acesso:', error);
          // Em caso de erro, assume que não tem acesso
          setHasAccess(false);
          setClientName(undefined);
          setExpiresAt(undefined);
          setClientId(undefined);
        }
      }
      
      setIsLoading(false);
    };

    checkAccess();
  }, []);

  const grantAccess = async () => {
    setHasAccess(true);
    // Busca informações do código usado para obter nome do cliente e data de expiração
    const usedCode = localStorage.getItem('ff-used-code');
    if (usedCode) {
      try {
        const accessCode = await AccessService.getAccessCodeByCode(usedCode);
        if (accessCode) {
          setClientName(accessCode.clients?.name);
          setExpiresAt(accessCode.expires_at);
          setClientId(accessCode.client_id);
        }
      } catch (error) {
        console.error('Erro ao buscar informações do código:', error);
      }
    }
  };

  const revokeAccess = () => {
    setHasAccess(false);
    setClientName(undefined);
    setExpiresAt(undefined);
    setClientId(undefined);
    localStorage.removeItem('ff-access-granted');
    localStorage.removeItem('ff-access-time');
    localStorage.removeItem('ff-used-code');
    localStorage.removeItem('ff-device-id');
    sessionStorage.removeItem('ff-code-used');
    sessionStorage.removeItem('ff-device-id');
  };

  return (
    <AccessContext.Provider value={{ hasAccess, grantAccess, revokeAccess, isLoading, clientName, expiresAt, clientId }}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};
