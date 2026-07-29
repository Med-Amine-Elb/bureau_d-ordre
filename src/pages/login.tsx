import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { dataService } from "@/lib/dataService";
import type { AgenceLookup } from "@/lib/dataService";
import gsap from "gsap";

const MOCK_CREDENTIALS: Record<string, { email: string; pass: string }> = {
  BO: { email: "bo.agent@sbm.ma", pass: "SbmBO2026!" },
  Prescripteur: { email: "prescripteur@sbm.ma", pass: "SbmPresc2026!" },
  DCF: { email: "dcf.compta@sbm.ma", pass: "SbmDcf2026!" },
  Tresorerie: { email: "tresorerie@sbm.ma", pass: "SbmTresor2026!" },
  Agence: { email: "agence.rabat.agdal@sbm.ma", pass: "SbmAgence2026!" },
  Admin: { email: "admin@sbm.ma", pass: "SbmAdmin2026!" },
};

const ROLES_METADATA = [
  { id: "BO", shortName: "BO" },
  { id: "Prescripteur", shortName: "Prescripteur" },
  { id: "DCF", shortName: "DCF" },
  { id: "Tresorerie", shortName: "Trésorerie" },
  { id: "Agence", shortName: "Agence" },
  { id: "Admin", shortName: "Admin" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(MOCK_CREDENTIALS.BO.email);
  const [password, setPassword] = useState(MOCK_CREDENTIALS.BO.pass);
  const [selectedRole, setSelectedRole] = useState("BO");
  const [selectedAgence, setSelectedAgence] = useState("Rabat Agdal");
  const [agences, setAgences] = useState<AgenceLookup[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const formPanelRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const imgWrapperRef = useRef<HTMLDivElement>(null);

  // Load agences
  useEffect(() => {
    const loadAgences = async () => {
      try {
        const list = await dataService.getAgencesLookup();
        const active = list.filter(a => a.new_is_active);
        setAgences(active);
        if (active.length > 0) setSelectedAgence(active[0].new_name);
      } catch (err) {
        console.error(err);
      }
    };
    loadAgences();
  }, []);

  // Page entrance animation
  useEffect(() => {
    gsap.fromTo(leftPanelRef.current,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, duration: 1.1, ease: "power3.out" }
    );
    gsap.fromTo(formPanelRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.15 }
    );
  }, []);

  // Mouse move for 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!leftPanelRef.current) return;
    const rect = leftPanelRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePos({ x, y });
  };

  // Role detection from email
  useEffect(() => {
    const l = email.toLowerCase();
    if (l.includes("presc")) setSelectedRole("Prescripteur");
    else if (l.includes("dcf") || l.includes("compta")) setSelectedRole("DCF");
    else if (l.includes("tresor")) setSelectedRole("Tresorerie");
    else if (l.includes("agence")) setSelectedRole("Agence");
    else if (l.includes("admin")) setSelectedRole("Admin");
    else if (l.includes("bo")) setSelectedRole("BO");
  }, [email]);

  const handleQuickConnect = (roleId: string) => {
    setSelectedRole(roleId);
    const creds = MOCK_CREDENTIALS[roleId];
    if (!creds) return;
    if (roleId === "Agence") {
      const sanitized = selectedAgence.toLowerCase().replace(/\s+/g, ".");
      setEmail(`agence.${sanitized}@sbm.ma`);
    } else {
      setEmail(creds.email);
    }
    setPassword(creds.pass);
  };

  const handleAgenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedAgence(val);
    if (selectedRole === "Agence") {
      setEmail(`agence.${val.toLowerCase().replace(/\s+/g, ".")}@sbm.ma`);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const tl = gsap.timeline();
    tl.to(leftPanelRef.current, { opacity: 0, x: -40, duration: 0.7, ease: "power2.inOut" });
    tl.to(formPanelRef.current, { opacity: 0, y: -20, duration: 0.6, ease: "power2.inOut" }, "-=0.5");
    setTimeout(() => {
      localStorage.setItem("userRole", selectedRole);
      if (selectedRole === "Agence") localStorage.setItem("userAgence", selectedAgence);
      navigate(`/${selectedRole.toLowerCase()}/dashboard`);
    }, 800);
  };

  // 3D tilt style applied on hover
  const tiltStyle = isHovering
    ? {
      transform: `perspective(900px) rotateX(${-mousePos.y * 7}deg) rotateY(${mousePos.x * 7}deg) scale(1.012)`,
      transition: "transform 0.05s linear",
    }
    : {
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)",
      transition: "transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)",
    };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden bg-white font-sans">

      {/* ─── Keyframe animations injected via <style> ─── */}
      <style>{`
        body { background: #fff !important; }

        /* Seamless slow Ken Burns loop:
           Starts scale(1) at center, drifts slightly, then returns
           so the end frame blends invisibly into the start. */
        @keyframes kenburns {
          0%   { transform: scale(1)    translate(0px, 0px); }
          25%  { transform: scale(1.06) translate(-1%, -0.5%); }
          50%  { transform: scale(1.08) translate(0.5%, -1%); }
          75%  { transform: scale(1.05) translate(1%, 0.5%); }
          100% { transform: scale(1)    translate(0px, 0px); }
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.34; }
        }

        /* Applied to the img when NOT hovering */
        .kb-animate {
          animation: kenburns 14s ease-in-out infinite;
          will-change: transform;
        }

        /* Pause the loop on hover so the 3D tilt takes over smoothly */
        .kb-paused {
          animation-play-state: paused;
        }

        .glow-bg {
          animation: glow-pulse 7s ease-in-out infinite;
        }

        /* Password input autofill quirks */
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #F0F1F4 inset;
        }
      `}</style>

      {/* ══════════════════════════════════════════
          LEFT PANEL — Animated illustration + logo
         ══════════════════════════════════════════ */}
      <div
        ref={leftPanelRef}
        className="hidden md:flex md:w-1/2 relative h-screen overflow-hidden bg-[#F4F5F7]"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Ambient blue glow that breathes behind the illustration */}
        <div
          className="glow-bg absolute inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse at 50% 60%, rgba(31,59,115,0.18) 0%, transparent 70%)",
          }}
        />

        {/* 3D tilt wrapper — wraps both the image AND the logo overlay */}
        <div
          ref={imgWrapperRef}
          style={tiltStyle}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          {/* The illustration image — Ken Burns plays when not hovering */}
          <img
            src="/images/login_illustration.png"
            alt="Bureau d'Ordre"
            className={`w-full h-full object-cover select-none pointer-events-none ${isHovering ? "kb-paused" : "kb-animate"}`}
            style={{ transformOrigin: "center center" }}
            draggable={false}
          />

          {/* SBM logo — layered directly over the illustration, centered and prominent */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ filter: "drop-shadow(0 2px 8px rgba(31,59,115,0.25))" }}
          >
            <div className="bg-white/70 backdrop-blur-md rounded-xl px-5 py-3 border border-white/80 shadow-lg flex items-center gap-2.5">
              <img
                src="/images/logo_sbm.png"
                alt="Groupe SBM"
                className="h-7 object-contain"
              />
              <span className="text-[#1F3B73] text-[11px] font-semibold tracking-widest uppercase select-none">
                Bureau d'Ordre
              </span>
            </div>
          </div>

          {/* Subtle vignette to blend image edges into the panel bg */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, transparent 55%, #F4F5F7 100%)",
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — Authentication form
         ══════════════════════════════════════════ */}
      <div className="w-full md:w-1/2 min-h-screen flex flex-col justify-between px-8 py-10 md:px-24 bg-white">

        {/* Top brand row */}
        <div className="flex justify-between items-center">
          <img src="/images/logo_sbm.png" alt="SBM" className="h-12 object-contain" />
          <span className="text-[11px] font-mono text-slate-400 tracking-widest uppercase">
            Accès Intranet
          </span>
        </div>

        {/* Form block */}
        <div ref={formPanelRef} className="w-full max-w-sm my-auto space-y-7">

          <div className="space-y-1.5">
            <h1 className="text-[32px] font-normal leading-tight text-[#111827] tracking-tight">
              Connexion au Bureau d'Ordre
            </h1>
            <p className="text-[14px] text-slate-400">
              Plateforme de gestion des dossiers financiers.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[13px] text-slate-400">
                Identifiant professionnel
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nom.prenom@sbm.ma"
                required
                className="w-full bg-[#F0F1F4] text-[#111827] placeholder-slate-400 text-sm py-3 px-4 rounded-[10px] border-0 focus:bg-white focus:ring-2 focus:ring-[#1F3B73]/20 focus:outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[13px] text-slate-400">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#F0F1F4] text-[#111827] placeholder-slate-400 text-sm py-3 pl-4 pr-11 rounded-[10px] border-0 focus:bg-white focus:ring-2 focus:ring-[#1F3B73]/20 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#111827] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Agence dropdown */}
            {selectedRole === "Agence" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="agence" className="text-[13px] text-slate-400">
                  Sélectionner votre Agence
                </label>
                <select
                  id="agence"
                  value={selectedAgence}
                  onChange={handleAgenceChange}
                  className="w-full bg-[#F0F1F4] text-[#111827] text-sm py-3 px-4 rounded-[10px] border-0 focus:bg-white focus:ring-2 focus:ring-[#1F3B73]/20 focus:outline-none transition-all cursor-pointer"
                >
                  {agences.length > 0
                    ? agences.map(ag => (
                      <option key={ag.new_branchid} value={ag.new_name}>{ag.new_name}</option>
                    ))
                    : (
                      <>
                        <option>Rabat Agdal</option>
                        <option>Casa Anfa</option>
                        <option>Tanger Ville</option>
                        <option>Marrakech Guéliz</option>
                        <option>Fès Ville</option>
                      </>
                    )}
                </select>
              </div>
            )}

            {/* Remember me */}
            <label className="flex items-center gap-2 cursor-pointer select-none group pt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1F3B73] focus:ring-[#1F3B73]/20 cursor-pointer"
              />
              <span className="text-[13px] text-slate-400 group-hover:text-slate-500 transition-colors">
                Se souvenir de moi
              </span>
            </label>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#1F3B73] hover:bg-[#16294F] active:scale-[0.99] text-white text-sm font-medium py-3.5 rounded-[10px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1F3B73]/30 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authentification…
                </>
              ) : "Se connecter"}
            </button>
          </form>

          <p className="text-[13px] text-slate-400">
            Besoin d'un accès ? Contactez votre administrateur.
          </p>
        </div>

        {/* Dev quick-connect panel */}
        <div className="space-y-1.5 opacity-40 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1F3B73] inline-block" />
            Simulation de session (Test quick-connect) :
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ROLES_METADATA.map(role => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleQuickConnect(role.id)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer
                  ${selectedRole === role.id
                    ? "bg-[#1F3B73]/10 text-[#1F3B73] ring-1 ring-[#1F3B73]"
                    : "bg-[#F0F1F4] text-[#111827] hover:bg-[#1F3B73] hover:text-white"
                  }`}
              >
                {role.shortName}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
