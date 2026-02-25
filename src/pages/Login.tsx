import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

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
                <p className="text-sm text-muted-foreground uppercase tracking-widest">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <motion.div
                className="flex w-full max-w-sm flex-col gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="flex flex-col items-center gap-6">
                    <img src={logo} alt="GoFocus" className="w-40" />
                    <h1 className="font-display text-2xl font-light tracking-[0.2em] text-foreground uppercase border-b border-border pb-4 w-full text-center">
                        Login
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">E-mail</label>
                            <input
                                type="email"
                                placeholder="Ex: admin@gofocus.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border border-border bg-background px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/30"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground ml-1">Senha</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full border border-border bg-background px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/30"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-destructive text-center font-medium bg-destructive/10 py-2 border border-destructive/20">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 border border-foreground bg-foreground px-8 py-4 text-xs uppercase tracking-[0.4em] text-background transition-all duration-300 hover:bg-transparent hover:text-foreground disabled:opacity-30 flex items-center justify-center gap-2"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mt-4">
                    Área Administrativa Restrita
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
