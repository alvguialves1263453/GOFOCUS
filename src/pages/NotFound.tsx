import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
      <motion.div
        className="text-center space-y-12 max-w-sm w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="space-y-6">
          <h1 className="font-serif text-[120px] leading-none font-normal text-white/5 tracking-tighter select-none">404</h1>
          <div className="space-y-2 translate-y-[-40px]">
            <p className="text-[10px] uppercase tracking-[0.6em] text-white/40 font-bold">Página não encontrada</p>
            <div className="h-px w-8 bg-white/10 mx-auto mt-6" />
          </div>
        </div>

        <p className="text-[11px] uppercase tracking-widest text-white/25 leading-relaxed font-light px-8">
            O conteúdo que você procura foi movido para outra dimensão visual ou não existe mais.
        </p>

        <button
          onClick={() => navigate("/")}
          className="bg-white text-black px-10 py-3.5 rounded-sm text-[9px] font-bold uppercase tracking-[0.4em] transition-opacity hover:opacity-80 shadow-2xl"
        >
          Voltar ao Início
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
