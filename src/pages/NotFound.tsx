import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LiquidBackground from "@/components/LiquidBackground";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <LiquidBackground />
      <motion.div
        className="glass-liquid p-16 rounded-[4rem] text-center space-y-8 glow-border max-w-lg w-full relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="space-y-4">
          <h1 className="font-display text-8xl font-light text-white/90 tracking-tighter">404</h1>
          <p className="text-[10px] uppercase tracking-[0.5em] text-primary font-bold border-t border-white/5 pt-8">Página Não Encontrada</p>
        </div>

        <p className="text-sm text-white/40 leading-relaxed font-light">O conteúdo que você procura foi movido para outra dimensão visual ou não existe mais.</p>

        <button
          onClick={() => navigate("/")}
          className="bg-white text-black px-12 py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.4em] transition-all hover:scale-[1.05] active:scale-[0.95] glow-border shadow-2xl"
        >
          Voltar ao Início
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
