import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";

export default function ErrorPage() {
  const error: any = useRouteError();
  const navigate = useNavigate();

  console.error(error);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-card border border-border rounded-3xl shadow-2xl overflow-hidden p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-black text-foreground mb-2">Oups ! Une erreur est survenue</h1>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
          {error?.statusText || error?.message || "Le chemin d'accès semble incorrect ou une erreur système est survenue."}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-sidebar-accent hover:bg-border text-foreground rounded-xl font-bold text-sm transition-all"
          >
            <RefreshCcw className="w-4 h-4" /> Actualiser
          </button>
          <button 
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground hover:opacity-90 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20"
          >
            <Home className="w-4 h-4" /> Accueil
          </button>
        </div>

        {error?.status === 404 && (
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Code Erreur: 404 - Not Found</p>
          </div>
        )}
      </div>
    </div>
  );
}
