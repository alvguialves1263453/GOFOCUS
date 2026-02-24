import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const Admin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();

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
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
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
        <h1 className="font-display text-3xl font-light tracking-[0.15em] text-foreground text-center">
          GoFocus
        </h1>
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {isSignUp ? "Criar Conta" : "Área Administrativa"}
        </p>

        <div className="flex flex-col gap-4 mt-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>

        {error && (
          <p className="text-center text-xs text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="border border-foreground px-8 py-3 text-xs uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background disabled:opacity-40"
        >
          {loading ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isSignUp ? "Já tem conta? Entrar" : "Criar uma conta"}
        </button>
      </motion.form>
    </div>
  );
};

export default Admin;
