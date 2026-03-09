import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";
import LiquidBackground from "@/components/LiquidBackground";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user, loading: authLoading, signIn } = useAuth();

    useEffect(() => {
        if (!authLoading && user) {
            navigate("/admin/dashboard");
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await signIn(email, password);
            navigate("/admin/dashboard");
        } catch (err: any) {
            setError(err.message || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <LiquidBackground />
                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] animate-pulse">Autenticando...</p>
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
                            Admin Login
                        </h1>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-[0.3em] text-white/40 ml-4 font-bold">E-mail</label>
                            <input
                                type="email"
                                placeholder="usuario@gofocus.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full glass-liquid border-white/5 bg-transparent px-6 py-4 rounded-full text-sm text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase tracking-[0.3em] text-white/40 ml-4 font-bold">Senha</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full glass-liquid border-white/5 bg-transparent px-6 py-4 rounded-full text-sm text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-white/10"
                            />
                        </div>
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 bg-white text-black px-8 py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.4em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 flex items-center justify-center glow-border"
                    >
                        {loading ? "Entrando..." : "Acessar Painel"}
                    </button>
                </form>

                <p className="text-center text-[8px] text-white/20 uppercase tracking-[0.5em] font-light">
                    Sistemas GoFocus © 2026
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
