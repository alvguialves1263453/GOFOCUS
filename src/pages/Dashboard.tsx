import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getProjectsAsync, type Project } from "@/lib/storage";
import { LogOut, LayoutDashboard, FolderKanban, ShoppingCart, User as UserIcon } from "lucide-react";
import LiquidBackground from "@/components/LiquidBackground";
import logo from "@/assets/logo.png";

const Dashboard = () => {
    const { user, loading: authLoading, signOut } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/login");
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function loadProjects() {
            try {
                const allProjects = await getProjectsAsync();
                // In a real scenario, we would filter by user email or ID
                // For now, showing a subset or all as placeholder
                setProjects(allProjects);
            } catch (err) {
                console.error("Erro ao carregar projetos:", err);
            } finally {
                setLoading(false);
            }
        }
        if (user) loadProjects();
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        navigate("/login");
    };

    if (authLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <LiquidBackground />
                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] animate-pulse">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative px-6 py-10 sm:py-20">
            <LiquidBackground />

            <div className="mx-auto max-w-6xl relative z-10">
                {/* Header */}
                <header className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-20 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 glow-border">
                    <div className="flex items-center gap-6">
                        <img src={logo} alt="GoFocus" className="w-24 sm:w-32" />
                        <div className="h-10 w-px bg-white/10 hidden sm:block" />
                        <div className="text-center sm:text-left">
                            <h1 className="font-display text-xl font-light tracking-[0.1em] text-white/90">
                                Olá, <span className="text-primary font-normal">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                            </h1>
                            <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">Bem-vindo à sua área exclusiva</p>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 text-[9px] uppercase tracking-[0.4em] text-white/40 hover:text-white transition-all duration-500 glass-liquid px-6 py-4 rounded-full border-white/5"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Sidebar / Stats */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="glass-liquid p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-8">
                            <div className="space-y-2">
                                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">Seu Perfil</p>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        {user.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] text-white truncate">{user.email}</p>
                                    </div>
                                </div>
                            </div>

                            <nav className="flex flex-col gap-2">
                                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-2">Menu</p>
                                <button className="flex items-center gap-4 p-4 rounded-2xl bg-primary text-black text-[10px] font-bold uppercase tracking-[0.2em]">
                                    <LayoutDashboard className="w-4 h-4" />
                                    Painel
                                </button>
                                <button className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all">
                                    <FolderKanban className="w-4 h-4" />
                                    Meus Projetos
                                </button>
                                <button className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all">
                                    <ShoppingCart className="w-4 h-4" />
                                    Carrinho
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-10">
                        <section>
                            <div className="flex items-center justify-between mb-8 px-4">
                                <h2 className="font-display text-2xl font-light tracking-[0.1em] text-white/90 uppercase">Meus Projetos</h2>
                                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">{projects.length} Projetos</p>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-64 rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5" />
                                    ))}
                                </div>
                            ) : projects.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {projects.slice(0, 4).map((project, index) => (
                                        <motion.div
                                            key={project.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] glass-liquid border-white/5 shadow-2xl h-80 flex flex-col justify-end p-8 border border-white/5 hover:border-primary/30 transition-all active:scale-[0.98]"
                                            onClick={() => navigate(`/projeto/${project.id}`)}
                                        >
                                            {project.photos && project.photos.length > 0 && (
                                                <img
                                                    src={project.photos[0].url}
                                                    alt={project.clientName}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-[2s]"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                            <div className="relative z-10 space-y-2">
                                                <p className="text-[8px] uppercase tracking-[0.4em] text-primary font-bold">Residencial</p>
                                                <h3 className="font-display text-2xl font-light text-white/90">{project.clientName}</h3>
                                                <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
                                                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/40">{project.photos?.length || 0} Fotos</span>
                                                    <span className="text-[9px] uppercase tracking-[0.2em] text-primary">Ver Galeria →</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-liquid p-20 rounded-[2.5rem] border border-white/5 text-center space-y-4">
                                    <FolderKanban className="w-12 h-12 text-white/10 mx-auto" />
                                    <p className="text-white/40 uppercase tracking-[0.2em] text-[10px]">Nenhum projeto vinculado ainda.</p>
                                </div>
                            )}
                        </section>

                        {/* Marketplace Banner (Teaser) */}
                        <div className="bg-gradient-to-br from-primary/20 to-transparent p-10 rounded-[2.5rem] border border-primary/10 glow-border relative overflow-hidden group">
                            <div className="relative z-10 space-y-6 max-w-md">
                                <h3 className="font-display text-3xl font-light text-white/90 uppercase tracking-tight leading-tight">
                                    Libere seu portfólio completo
                                </h3>
                                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] leading-relaxed">
                                    Algumas fotos e projetos exclusivos requerem ativação. Adicione ao carrinho e finalize para ter acesso vitalício.
                                </p>
                                <button className="bg-white text-black px-8 py-4 rounded-full text-[9px] font-bold uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95">
                                    Explorar Loja
                                </button>
                            </div>
                            <ShoppingCart className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 transition-transform duration-[3s] group-hover:scale-110" />
                        </div>
                    </div>
                </div>

                <footer className="mt-20 text-center pb-10">
                    <p className="text-[8px] uppercase tracking-[0.5em] text-white/15">
                        © {new Date().getFullYear()} GoFocus Narrative Interiors — Sistemas Premium
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Dashboard;
