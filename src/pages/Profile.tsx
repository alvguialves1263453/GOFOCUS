import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ArrowLeft, User as UserIcon, Mail, ShieldCheck, Calendar } from "lucide-react";
import LiquidBackground from "@/components/LiquidBackground";
import logo from "@/assets/logo.png";

const Profile = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <LiquidBackground />
                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] animate-pulse">Carregando...</p>
            </div>
        );
    }

    if (!user) {
        navigate("/login");
        return null;
    }

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    };

    return (
        <div className="min-h-screen relative px-6 py-10 sm:py-20">
            <LiquidBackground />

            <div className="mx-auto max-w-2xl relative z-10">
                {/* Header / Back Button */}
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-white/40 hover:text-white transition-all group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Voltar ao Painel
                    </button>
                    <img src={logo} alt="GoFocus" className="w-20 opacity-40 hover:opacity-100 transition-opacity" />
                </div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-liquid p-10 rounded-[3rem] border border-white/5 glow-border relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <UserIcon className="w-64 h-64" />
                    </div>

                    <div className="relative z-10 space-y-12">
                        {/* Avatar & Name */}
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="h-24 w-24 rounded-full bg-primary/20 p-1 border-2 border-primary/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                                {user.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <div className="h-full w-full rounded-full bg-black/40 flex items-center justify-center text-primary text-3xl font-display">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <h1 className="font-display text-3xl font-light text-white tracking-tight uppercase">
                                    {user.user_metadata?.full_name || "Seu Perfil"}
                                </h1>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold">Logado com Google</p>
                                </div>
                            </div>
                        </div>

                        {/* Account Details */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex items-center gap-5 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-primary/60" />
                                </div>
                                <div className="space-y-1 overflow-hidden">
                                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/30">E-mail de acesso</p>
                                    <p className="text-xs text-white/80 font-medium truncate">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-primary/60" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/30">ID da Conta</p>
                                    <p className="text-[10px] text-white/60 font-mono tracking-tighter">{user.id}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-primary/60" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] uppercase tracking-[0.2em] text-white/30">Membro desde</p>
                                    <p className="text-xs text-white/80 font-medium">{formatDate(user.created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-4 pt-4">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-3 py-6 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] uppercase font-bold tracking-[0.4em] hover:bg-destructive hover:text-white transition-all duration-500"
                            >
                                <LogOut className="w-4 h-4" />
                                Encerrar Sessão
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Teaser */}
                <p className="mt-12 text-center text-[8px] text-white/15 uppercase tracking-[0.5em] font-light leading-relaxed">
                    Sua segurança é nossa prioridade.<br />
                    GoFocus Narrative Interiors © 2026
                </p>
            </div>
        </div>
    );
};

export default Profile;
