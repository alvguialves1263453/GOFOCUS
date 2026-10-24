import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import "@/components/home/glass.css";

// Intrinsic logo size, so the browser reserves space before it loads.
const LOGO_W = 1024;
const LOGO_H = 1024;

const linkClass =
  "rounded-full px-4 py-2 font-grotesk text-[14px] text-[#ECE8E1]/80 transition-colors hover:bg-white/10 hover:text-[#ECE8E1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2A820]";

/** Floating liquid-glass pill that tightens once the page scrolls. */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const { user, profile, signOut } = useAuth();
  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:pt-4">
      <div
        className={`glass-lite pointer-events-auto flex w-full items-center justify-between rounded-full transition-[max-width,padding] duration-500 ease-out ${
          compact ? "max-w-[620px] py-1.5 pl-4 pr-1.5" : "max-w-[760px] py-2.5 pl-5 pr-2.5"
        }`}
      >
        <Link to="/" aria-label="GoFocus, página inicial" className="flex items-center">
          <img
            src={logo}
            alt=""
            width={LOGO_W}
            height={LOGO_H}
            className={`w-auto transition-[height] duration-500 ${compact ? "h-6" : "h-7"}`}
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link to="/eventos" className={linkClass}>
            Eventos
          </Link>
          <a href="/#portfolio" className={linkClass}>
            Portfólio
          </a>
          {user && isAdmin && (
            <Link to="/admin/dashboard" className={`${linkClass} flex items-center gap-1.5 text-[#E2A820]`}>
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          {user && (
            <button type="button" onClick={() => signOut()} className={`${linkClass} flex items-center gap-1.5`}>
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-white/10 md:hidden"
        >
          {open ? <X className="h-5 w-5 text-[#ECE8E1]" /> : <Menu className="h-5 w-5 text-[#ECE8E1]" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass-lite pointer-events-auto absolute inset-x-3 top-[4.75rem] flex flex-col gap-1 rounded-[28px] p-3 md:hidden"
          >
            <Link to="/eventos" onClick={() => setOpen(false)} className={`${linkClass} py-3 text-[16px]`}>
              Eventos
            </Link>
            <a href="/#portfolio" onClick={() => setOpen(false)} className={`${linkClass} py-3 text-[16px]`}>
              Portfólio
            </a>
            {user && isAdmin && (
              <Link
                to="/admin/dashboard"
                onClick={() => setOpen(false)}
                className={`${linkClass} flex items-center gap-2 py-3 text-[16px] text-[#E2A820]`}
              >
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
                className={`${linkClass} flex items-center gap-2 py-3 text-left text-[16px]`}
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
