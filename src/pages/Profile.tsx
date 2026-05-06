import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ArrowLeft, Mail, ShieldCheck, Calendar } from "lucide-react";
import logo from "@/assets/logo.png";

const Profile = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505]">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">Carregando...</p>
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
        <div className="min-h-screen bg-[#050505] text-white font-body selection:bg-white/20 px-6 py-12 sm:py-24">
            <div className="mx-auto max-w-2xl space-y-12">
                {/* Navigation */}
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-3 text-[9px] uppercase tracking-[0.4em] text-white/30 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                        Retornar ao Painel
                    </button>
                    <img src={logo} alt="GoFocus" className="h-5 brightness-0 invert opacity-20" />
                </div>

                {/* Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-16"
                >
                    {/* Header Info */}
                    <div className="flex flex-col items-center gap-8">
                        <div className="h-20 w-20 rounded-sm bg-white/5 flex items-center justify-center border border-white/10 text-white/20 font-serif text-3xl">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center space-y-2">
                            <h1 className="font-serif text-4xl font-normal text-white/90">
                                {user.email?.split('@')[0] || "Usuário"}
                            </h1>
                            <p className="text-[9px] uppercase tracking-[0.5em] text-white/20 font-medium italic">Sessão Autenticada</p>
                        </div>
                    </div>

                    {/* Data List */}
                    <div className="space-y-0.5 border border-white/10 rounded-sm overflow-hidden bg-white/3">
                        <InfoRow 
                            icon={Mail} 
                            label="Identificador de Acesso" 
                            value={user.email || ""} 
                        />
                        <InfoRow 
                            icon={ShieldCheck} 
                            label="Chave da Conta" 
                            value={user.id} 
                            isMono 
                        />
                        <InfoRow 
                            icon={Calendar} 
                            label="Data de Registro" 
                            value={formatDate(user.created_at)} 
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-4">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-transparent border border-red-900/30 text-red-400 text-[10px] uppercase font-bold tracking-[0.5em] hover:bg-red-950/20 hover:border-red-800 transition-all"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Finalizar Sessão
                        </button>
                    </div>
                </motion.div>

                {/* Footer */}
                <div className="pt-12 text-center text-[8px] text-white/10 uppercase tracking-[0.6em] space-y-4">
                    <p>Integridade de Dados e Segurança Visual GoFocus</p>
                    <p>© 2026 Narrative Interiors</p>
                </div>
            </div>
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value, isMono }: { icon: any, label: string, value: string, isMono?: boolean }) => (
    <div className="flex items-center gap-6 p-6 bg-[#050505] hover:bg-white/[0.015] transition-colors group">
        <div className="h-8 w-8 shrink-0 flex items-center justify-center text-white/15 group-hover:text-white/30 transition-colors">
            <Icon className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div className="space-y-1 overflow-hidden">
            <p className="text-[8px] uppercase tracking-[0.3em] text-white/20">{label}</p>
            <p className={`text-xs text-white/70 truncate ${isMono ? 'font-mono tracking-tighter opacity-50' : 'font-medium'}`}>
                {value}
            </p>
        </div>
    </div>
);

export default Profile;
