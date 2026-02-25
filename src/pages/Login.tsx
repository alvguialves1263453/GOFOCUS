import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading, signIn } = useAuth();

    const from = location.state?.from?.pathname || "/admin/dashboard";

    useEffect(() => {
        if (!authLoading && user) {
            navigate(from, { replace: true });
        }
    }, [user, authLoading, navigate, from]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn(email, password);
            toast.success("Bem-vindo!");
            navigate(from, { replace: true });
        } catch (err: any) {
            toast.error(err.message || "Credenciais inválidas");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <motion.form
                onSubmit={handleSubmit}
                className="flex w-full max-w-sm flex-col gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="text-center space-y-2">
                    <h1 className="font-display text-4xl font-light tracking-[0.15em] text-foreground">
                        GoFocus
                    </h1>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Área Administrativa
                    </p>
                </div>

                <div className="flex flex-col gap-4 mt-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                        <input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex items-center justify-center gap-2 border border-foreground bg-foreground px-8 py-3.5 text-[10px] uppercase tracking-[0.3em] text-background transition-all duration-300 hover:bg-transparent hover:text-foreground disabled:opacity-40"
                >
                    {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                    {loading ? "Entrando..." : "Entrar"}
                </button>
            </motion.form>
        </div>
    );
};

export default Login;
