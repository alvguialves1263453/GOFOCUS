import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Admin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "1234") {
      sessionStorage.setItem("gofocus_auth", "true");
      navigate("/admin/dashboard");
    } else {
      setError("Credenciais inválidas");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <motion.form
        onSubmit={handleLogin}
        className="flex w-full max-w-sm flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-3xl font-light tracking-[0.15em] text-foreground text-center">
          GoFocus
        </h1>
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Área Administrativa
        </p>

        <div className="flex flex-col gap-4 mt-4">
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>

        {error && (
          <p className="text-center text-xs text-destructive">{error}</p>
        )}

        <button
          type="submit"
          className="border border-foreground px-8 py-3 text-xs uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
        >
          Entrar
        </button>
      </motion.form>
    </div>
  );
};

export default Admin;
