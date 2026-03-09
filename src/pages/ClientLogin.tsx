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
    const { user, loading: authLoading, signInWithGoogle } = useAuth();

    useEffect(() => {
        if (!authLoading && user) {
            navigate("/dashboard");
        }
    }, [user, authLoading, navigate]);

    const handleGoogleLogin = async () => {
        setError("");
        setLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || "Erro ao fazer login com Google");
            setLoading(false);
        }
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
                            Acesse suas fotos e projetos
                        </p>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="bg-white text-black px-8 py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.4em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3 glow-border"
                    >
                        <LogIn className="w-4 h-4" />
                        {loading ? "Redirecionando..." : "Entrar com Google"}
                    </button>

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
