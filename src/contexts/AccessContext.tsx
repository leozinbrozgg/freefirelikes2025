import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ACCESS_CONFIG } from '@/config/access';
import { AccessService } from '@/services/accessService';

interface AccessContextType {
  hasAccess: boolean;
  grantAccess: () => void;
  revokeAccess: () => void;
  isLoading: boolean;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

interface AccessProviderProps {
  children: ReactNode;
}

export const AccessProvider = ({ children }: AccessProviderProps) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica se o usuário já tem acesso
    const checkAccess = async () => {
      const usedCode = localStorage.getItem('ff-used-code');
      
      if (usedCode) {
        try {
          // Verifica se o código ainda é válido no Supabase (mesmo se já foi usado)
          const isStillValid = await AccessService.isCodeStillValid(usedCode);
          if (isStillValid) {
            setHasAccess(true);
          } else {
            // Código expirado, limpa o localStorage
            localStorage.removeItem('ff-access-granted');
            localStorage.removeItem('ff-access-time');
            localStorage.removeItem('ff-used-code');
            localStorage.removeItem('ff-device-id');
            sessionStorage.removeItem('ff-code-used');
            sessionStorage.removeItem('ff-device-id');
          }
        } catch (error) {
          console.error('Erro ao verificar acesso:', error);
          // Em caso de erro, assume que não tem acesso
          setHasAccess(false);
        }
      }
      
      setIsLoading(false);
    };

    checkAccess();
  }, []);

  const grantAccess = () => {
    setHasAccess(true);
  };

  const revokeAccess = () => {
    setHasAccess(false);
    localStorage.removeItem('ff-access-granted');
    localStorage.removeItem('ff-access-time');
    localStorage.removeItem('ff-used-code');
    localStorage.removeItem('ff-device-id');
    sessionStorage.removeItem('ff-code-used');
    sessionStorage.removeItem('ff-device-id');
  };

  return (
    <AccessContext.Provider value={{ hasAccess, grantAccess, revokeAccess, isLoading }}>
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
