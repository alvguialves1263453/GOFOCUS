import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/ui";
import { useAdminTheme } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  useAdminTheme();
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span role="status" className="flex items-center gap-2 text-[15px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Verificando acesso…
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <img src={logo} alt="" width={1024} height={1024} className="h-9 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
          <span className="font-marquee text-[1.7rem] font-black uppercase leading-none text-foreground">GoFocus</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
          <h1 className="text-[20px] font-semibold text-foreground">{resetMode ? "Recuperar senha" : "Entrar no painel"}</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            {resetMode ? "Enviaremos um link para você criar uma nova senha." : "Use o e-mail e a senha da conta de administrador."}
          </p>

          <form onSubmit={resetMode ? handleResetPassword : handleSubmit} className="mt-6 flex flex-col gap-4" noValidate={false}>
            <Field label="E-mail" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="voce@gofocus.com.br…"
              />
            </Field>

            {!resetMode && (
              <Field label="Senha" htmlFor="login-password">
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/15 px-3 py-2.5 text-[14px] text-destructive">
                {error}
              </p>
            )}
            {resetMode && resetSent && (
              <p role="status" className="rounded-lg bg-[hsl(var(--admin-success)/0.15)] px-3 py-2.5 text-[14px] text-[hsl(var(--admin-success))]">
                Link enviado. Confira sua caixa de entrada.
              </p>
            )}

            <Button type="submit" size="lg" disabled={loading || (resetMode && resetSent)} className="mt-1 w-full">
              {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
              {resetMode ? (loading ? "Enviando…" : resetSent ? "Link enviado" : "Enviar link de recuperação") : loading ? "Entrando…" : "Entrar"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setResetMode(!resetMode);
                setError("");
              }}
              className="self-center rounded-md px-2 py-1 text-[14px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {resetMode ? "Voltar para o login" : "Esqueci minha senha"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13px] text-muted-foreground">
          <a href="/" className="underline-offset-4 hover:text-foreground hover:underline">Voltar ao site</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
