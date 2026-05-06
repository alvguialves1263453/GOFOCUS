import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const ClientLogin = () => {
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { loading: authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505]">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
            <motion.div
                className="w-full max-w-sm space-y-12"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="flex flex-col items-center gap-8">
                    <img src={logo} alt="GoFocus" className="h-10 brightness-0 invert" />
                    <div className="space-y-3 text-center">
                        <h1 className="font-serif text-2xl font-normal text-white px-4">
                            Área do Cliente
                        </h1>
                        <p className="text-[9px] text-white/30 uppercase tracking-[0.4em]">
                            Acesso Restrito
                        </p>
                    </div>
                </div>

                <div className="border border-white/10 bg-white/[0.02] p-10 rounded-sm space-y-8">
                    <div className="text-center space-y-6">
                        <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] leading-relaxed">
                            O acesso direto via conta Google foi removido.<br />
                            Aguarde as novas instruções de acesso seguro.
                        </p>
                        
                        <div className="h-px w-8 bg-white/10 mx-auto" />

                        <button
                            onClick={() => navigate("/")}
                            className="bg-white text-black px-8 py-3 rounded-sm text-[9px] font-bold uppercase tracking-[0.4em] transition-opacity hover:opacity-80 w-full"
                        >
                            Voltar ao Início
                        </button>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[9px] text-red-400 text-center uppercase tracking-widest bg-red-500/5 py-2.5 border border-red-500/10"
                        >
                            {error}
                        </motion.p>
                    )}
                </div>

                <p className="text-center text-[8px] text-white/10 uppercase tracking-[0.6em]">
                    GoFocus Narrative © 2026
                </p>
            </motion.div>
        </div>
    );
};

export default ClientLogin;
