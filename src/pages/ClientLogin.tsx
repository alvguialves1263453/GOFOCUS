import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import LiquidBackground from "@/components/LiquidBackground";
import { LogIn } from "lucide-react";

const ClientLogin = () => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { loading: authLoading } = useAuth();
    const handleGoogleLogin = () => {
        setError("O login com Google foi desativado. Por favor, entre em contato com o administrador.");
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <LiquidBackground />
                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] animate-pulse">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <LiquidBackground />
            <motion.div
                className="flex w-full max-w-sm flex-col gap-10 glass-liquid p-10 rounded-[3rem] glow-border shadow-2xl relative z-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="flex flex-col items-center gap-6">
                    <img src={logo} alt="GoFocus" className="w-40 drop-shadow-2xl" />
                    <div className="space-y-2 text-center w-full">
                        <h1 className="font-display text-2xl font-light tracking-[0.2em] text-white uppercase">
                            Área do Cliente
                        </h1>
                        <p className="text-[9px] text-white/40 uppercase tracking-[0.2em]">
                            Acesso Restrito
                        </p>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="text-center space-y-4">
                        <p className="text-[10px] text-white/60 uppercase tracking-[0.2em] leading-relaxed">
                            O acesso via conta Google foi removido.<br />
                            Aguarde novas instruções de acesso.
                        </p>
                        <button
                            onClick={() => navigate("/")}
                            className="text-[9px] text-primary uppercase tracking-[0.4em] font-bold hover:underline"
                        >
                            Voltar ao Início
                        </button>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] text-destructive text-center font-bold uppercase tracking-widest bg-destructive/10 py-3 rounded-xl border border-destructive/20"
                        >
                            {error}
                        </motion.p>
                    )}
                </div>

                <p className="text-center text-[8px] text-white/20 uppercase tracking-[0.5em] font-light">
                    Sistemas GoFocus © 2026
                </p>
            </motion.div>
        </div>
    );
};

export default ClientLogin;
