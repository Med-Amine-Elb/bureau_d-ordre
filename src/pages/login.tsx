import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ShieldCheck, FileCheck, Landmark, Building2, LayoutDashboard } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("BO");

  const roles = [
    { id: "BO", name: "Bureau d'Ordre", icon: Package, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
    { id: "Prescripteur", name: "Prescripteur", icon: FileCheck, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
    { id: "DCF", name: "Comptabilité (DCF)", icon: LayoutDashboard, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
    { id: "Tresorerie", name: "Trésorerie", icon: Landmark, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
    { id: "Agence", name: "Agence Régionale", icon: Building2, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
    { id: "Admin", name: "Administrateur", icon: ShieldCheck, color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-300" },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login by setting role in localStorage
    localStorage.setItem('userRole', selectedRole);
    // Navigate to respective dashboard
    navigate(`/${selectedRole.toLowerCase()}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl p-8 soft-shadow border border-white relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/30">
            <Package className="w-8 h-8" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">GBM Bureau d'Ordre</h1>
          <p className="text-slate-500 text-sm">Sélectionnez votre rôle pour accéder au système (Simulation)</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Connecté en tant que</label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <div 
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                      isSelected 
                        ? `${role.border} ${role.bg} ring-2 ring-${role.color.split('-')[1]}-500 ring-offset-2 scale-105 shadow-md` 
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <role.icon className={`w-6 h-6 ${isSelected ? role.color : 'text-slate-400'}`} />
                    <span className={`text-xs font-medium text-center ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                      {role.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 font-medium transition-colors soft-shadow-hover flex justify-center items-center gap-2"
          >
            Accéder au Dashboard
          </button>
        </form>
      </div>

      <div className="mt-8 text-center text-slate-400 text-xs">
        <p>GBM Dashboard Prototype © 2026</p>
        <p className="mt-1">Design System basé sur l'architecture PCF</p>
      </div>
    </div>
  )
}
