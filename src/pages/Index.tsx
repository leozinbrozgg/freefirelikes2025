import { FreefireForm } from "@/components/FreefireForm";
import { LikeHistory } from "@/components/LikeHistory";
import { AccessModal } from "@/components/AccessModal";
import { useAccess } from "@/contexts/AccessContext";
import { ACCESS_CONFIG } from "@/config/access";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { hasAccess, grantAccess, isLoading } = useAccess();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-gray-600">{ACCESS_CONFIG.MESSAGES.LOADING}</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen relative">
        {/* Sistema no fundo com desfoque */}
        <div className="absolute inset-0 blur-xs opacity-80 pointer-events-none">
          <div className="min-h-screen p-4 space-y-6">
            {/* Formulário principal (desfocado) */}
            <div className="w-full max-w-2xl mx-auto">
              <FreefireForm />
            </div>

            {/* Histórico de Likes (desfocado) */}
            <div className="w-full max-w-2xl mx-auto">
              <LikeHistory />
            </div>
          </div>
        </div>
        
        {/* Modal de acesso centralizado */}
        <div className="relative z-50 min-h-screen flex items-center justify-center">
          <AccessModal isOpen={true} onAccessGranted={grantAccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Formulário principal */}
      <div className="w-full max-w-2xl mx-auto">
        <FreefireForm />
      </div>

      {/* Histórico de Likes */}
      <div className="w-full max-w-2xl mx-auto">
        <LikeHistory />
      </div>
    </div>
  );
};

export default Index;
