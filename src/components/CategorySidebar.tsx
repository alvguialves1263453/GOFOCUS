import { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Calendar, Camera, DollarSign,
  Instagram,
  FolderKanban, Shield, MessageCircle,
  ChevronRight, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Projetos", icon: FolderKanban },
  { to: "/admin/instagram", label: "Instagram", icon: Instagram },
  { to: "/admin/orcamentos", label: "Orçamentos", icon: DollarSign },
  { to: "/admin/eventos", label: "Eventos", icon: Calendar },
];

const PUBLIC_LINKS = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/eventos", label: "Eventos", icon: Calendar },
  { to: "/#portfolio", label: "Portfolio", icon: Camera },
];

export default function CategorySidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isAdmin = profile?.role === "admin";

  const handleMouseEnter = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  }, []);

  const handleNav = useCallback((to: string) => {
    if (location.pathname === to) {
      setIsOpen(false);
      return;
    }
    navigate(to);
    setIsOpen(false);
  }, [navigate, location.pathname]);

  const navLinks = isAdmin ? ADMIN_LINKS : PUBLIC_LINKS;

  // The admin has its own frame and navigation.
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* Edge trigger */}
      <div
        onMouseEnter={handleMouseEnter}
        className="fixed left-0 top-0 bottom-0 z-[60] hidden w-4 cursor-default group md:block"
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-white/0 via-white/30 to-white/0 rounded-r-full transition-all duration-300 group-hover:h-16 group-hover:via-white/50" />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed left-0 top-0 bottom-0 w-64 z-[60] bg-[#050505]/95 backdrop-blur-2xl border-r border-white/[0.06] shadow-2xl shadow-black/50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] shrink-0">
          <span className="text-[9px] uppercase tracking-[0.45em] text-white/30 font-semibold">
            {isAdmin ? "Admin" : "Navegação"}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white/5 text-white/20 hover:text-white/60 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Nav content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 custom-scrollbar">
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 mb-3">
              <Shield className="h-3 w-3 text-[#e2a820]/60" />
              <span className="text-[8px] uppercase tracking-[0.4em] text-[#e2a820]/50 font-semibold">
                Painel Administrativo
              </span>
            </div>
          )}

          {navLinks.map((link) => {
            const isActive = (() => {
              if (link.to === "/admin/orcamentos") {
                return location.pathname === "/admin/orcamentos" && link.label === "Orçamentos";
              }
              return location.pathname === link.to;
            })();

            return (
              <button
                key={link.label}
                onClick={() => handleNav(link.to)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] tracking-[0.2em] transition-all duration-200 text-left",
                  isAdmin ? "uppercase" : "uppercase tracking-[0.25em]",
                  isActive
                    ? isAdmin
                      ? "text-[#e2a820] bg-[#e2a820]/8 font-semibold shadow-[inset_2px_0_0_0_#e2a820]"
                      : "text-[#e2a820] bg-[#e2a820]/8 font-semibold"
                    : "text-white/35 hover:text-white/70 hover:bg-white/[0.04]"
                )}
              >
                <link.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{link.label}</span>
                <ChevronRight className={cn(
                  "h-3 w-3 ml-auto shrink-0 transition-opacity",
                  isActive ? "opacity-100 text-[#e2a820]" : "opacity-30 text-white/15"
                )} />
              </button>
            );
          })}

          {!isAdmin && (
            <>
              <div className="my-4 border-t border-white/[0.06]" />
              <div className="px-3 space-y-2">
                <span className="flex items-center gap-2 text-[8px] uppercase tracking-[0.4em] text-white/20 font-semibold">
                  <MessageCircle className="h-3 w-3" />
                  Fale Conosco
                </span>
                <a
                  href="https://instagram.com/gofocus.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.2em] text-white/35 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
                >
                  <Instagram className="h-3.5 w-3.5 shrink-0" />
                  <span>Instagram</span>
                </a>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/[0.06] shrink-0">
          <p className="text-[7px] uppercase tracking-[0.5em] text-white/12 text-center">
            GoFocus
          </p>
        </div>
      </motion.aside>
    </>
  );
}
