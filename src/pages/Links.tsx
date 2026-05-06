import { ArrowUpRight, Camera, Globe } from "lucide-react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";

const Links = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-start py-20 px-6 selection:bg-white/10">
      
      {/* ── HEADER ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center mb-16 text-center"
      >
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full" />
           <img src={logo} alt="GoFocus Logo" className="relative w-28 h-auto opacity-100 invert brightness-100" style={{ filter: "brightness(0) invert(1)" }} />
        </div>
        <h1 className="font-serif text-4xl text-white font-normal mb-3 tracking-tight">
          GoFocus
        </h1>
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-white/20" />
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-medium">
            Cada foto conta uma história
          </p>
          <div className="h-px w-8 bg-white/20" />
        </div>
      </motion.div>

      {/* ── LINKS CONTAINER ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-full max-w-md flex flex-col gap-5"
      >
        
        {/* BANLEK BUTTON - BLUE BRAND COLOR */}
        <a
          href="https://banlek.com/GOFOCUS"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between w-full px-7 py-6 bg-[#5DBFEA] text-white active:scale-[0.98] transition-all duration-300 rounded-sm shadow-[0_0_40px_rgba(93,191,234,0.15)] overflow-hidden"
        >
          {/* subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="flex items-center gap-5 relative z-10">
             <div className="bg-white/20 p-2.5 rounded-sm">
                <Camera className="h-5 w-5 text-white" />
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-[0.2em] mb-1">
                  Loja Banlek
                </span>
                <span className="text-[10px] text-white/90 font-medium tracking-wide">
                  Encontre e adquira suas fotos
                </span>
             </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-white/60 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 relative z-10" />
        </a>

        {/* WEBSITE / PORTFOLIO BUTTON - MINIMALIST */}
        <a
          href="/"
          className="group flex items-center justify-between w-full px-7 py-6 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-white active:scale-[0.98] transition-all duration-300 rounded-sm"
        >
          <div className="flex items-center gap-5">
             <div className="bg-white/5 p-2.5 rounded-sm border border-white/5">
                <Globe className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-[0.2em] mb-1">
                  Portfólio Oficial
                </span>
                <span className="text-[10px] text-white/30 font-medium tracking-wide group-hover:text-white/50 transition-colors">
                  Galeria de trabalhos realizados
                </span>
             </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-white/20 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
        </a>

      </motion.div>

      {/* ── FOOTER ── */}
      <footer className="mt-auto pt-20">
        <div className="flex flex-col items-center gap-4">
           <div className="h-0.5 w-6 bg-white/10 rounded-full" />
           <p className="text-[9px] uppercase tracking-[0.6em] text-white/20">
             Evoluindo a cada clique
           </p>
        </div>
      </footer>

    </div>
  );
};

export default Links;
