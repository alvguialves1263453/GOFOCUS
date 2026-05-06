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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">
          Autenticando…
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-5">
      <div className="absolute inset-0 -z-10 bg-[#0a0a0a]" />

      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* logo */}
        <div className="flex justify-center mb-10">
          <img
            src={logo}
            alt="GoFocus"
            className="h-10"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>

        {/* card */}
        <div className="border border-white/8 bg-white/3 rounded-sm p-8 sm:p-10 flex flex-col gap-8">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-serif font-normal text-white tracking-wide">
              Acesso ao Painel
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
              GoFocus Admin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-medium">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full bg-transparent border border-white/10 px-4 py-3 rounded-sm text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-medium">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-transparent border border-white/10 px-4 py-3 rounded-sm text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] text-red-400 text-center uppercase tracking-widest bg-red-500/8 py-2.5 rounded-sm border border-red-500/15"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-white text-black py-3.5 rounded-sm text-[10px] font-semibold uppercase tracking-[0.35em] transition-opacity duration-300 hover:opacity-80 disabled:opacity-30"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-[8px] text-white/18 uppercase tracking-[0.4em] mt-8">
          © {new Date().getFullYear()} GoFocus
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
