import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getProjectsAsync, type Project } from "@/lib/storage";
import { LogOut, LayoutDashboard, FolderKanban, ShoppingCart, User as UserIcon, ArrowRight } from "lucide-react";
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
            <div className="flex min-h-screen items-center justify-center bg-[#050505]">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-body selection:bg-white/20">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logo} alt="GoFocus" className="h-6 brightness-0 invert" />
                        <div className="h-4 w-px bg-white/10 hidden sm:block" />
                        <p className="hidden sm:block text-[9px] uppercase tracking-[0.3em] text-white/40">Área do Cliente</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="hidden md:block text-[10px] text-white/40">
                            Olá, <span className="text-white/80">{user.email?.split('@')[0]}</span>
                        </span>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-white/40 hover:text-white transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Sair
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Sidebar */}
                    <aside className="lg:col-span-3 space-y-8">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-sm bg-white/5 flex items-center justify-center border border-white/10">
                                    <UserIcon className="w-4 h-4 text-white/40" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Conta Ativa</p>
                                    <p className="text-xs text-white/70 truncate">{user.email}</p>
                                </div>
                            </div>

                            <nav className="flex flex-col gap-1">
                                <MenuItem icon={LayoutDashboard} label="Visão Geral" active onClick={() => navigate("/dashboard")} />
                                <MenuItem icon={UserIcon} label="Meu Perfil" onClick={() => navigate("/perfil")} />
                                <MenuItem icon={FolderKanban} label="Projetos" />
                                <MenuItem icon={ShoppingCart} label="Carrinho" />
                            </nav>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="lg:col-span-9 space-y-16">
                        <section>
                            <div className="flex items-end justify-between mb-8">
                                <div>
                                    <h2 className="font-serif text-3xl font-normal text-white/90">Meus Projetos</h2>
                                    <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 mt-2">{projects.length} itens encontrados</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="aspect-[16/9] bg-white/5 animate-pulse border border-white/5 rounded-sm" />
                                    ))}
                                </div>
                            ) : projects.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {projects.slice(0, 4).map((project, index) => (
                                        <motion.div
                                            key={project.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="group relative aspect-[16/9] cursor-pointer overflow-hidden bg-white/3 border border-white/10 hover:border-white/20 transition-all"
                                            onClick={() => navigate(`/projeto/${project.id}`)}
                                        >
                                            {project.photos && project.photos.length > 0 ? (
                                                <img
                                                    src={project.photos[0].url}
                                                    alt={project.clientName}
                                                    className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/2">
                                                    <FolderKanban className="w-8 h-8 text-white/5" />
                                                </div>
                                            )}
                                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-[8px] uppercase tracking-[0.4em] text-white/40 mb-1">Projeto</p>
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-serif text-lg text-white/90">{project.clientName}</h3>
                                                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 border border-dashed border-white/10 text-center space-y-4 rounded-sm">
                                    <FolderKanban className="w-8 h-8 text-white/10 mx-auto" strokeWidth={1} />
                                    <p className="text-white/20 uppercase tracking-[0.2em] text-[9px]">Nenhum projeto selecionado.</p>
                                </div>
                            )}
                        </section>

                        {/* Teaser */}
                        <div className="p-10 border border-white/10 bg-white/[0.02] rounded-sm relative overflow-hidden group">
                            <div className="relative z-10 space-y-6 max-w-lg">
                                <h3 className="font-serif text-2xl text-white/80 leading-snug">
                                    Amplie sua experiência visual com acesso ilimitado.
                                </h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed">
                                    Alguns registros exclusivos aguardam sua ativação. Explore as opções de licenciamento vitalício.
                                </p>
                                <button className="bg-white text-black px-6 py-2.5 rounded-sm text-[9px] font-bold uppercase tracking-[0.3em] transition-opacity hover:opacity-80">
                                    Explorar Loja
                                </button>
                            </div>
                            <ShoppingCart className="absolute -right-12 -bottom-12 w-48 h-48 text-white/5 transition-transform duration-[4s] group-hover:rotate-12" />
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mx-auto max-w-7xl px-4 sm:px-6 py-12 border-t border-white/5 mt-20 text-center">
                <p className="text-[8px] uppercase tracking-[0.5em] text-white/15">
                    © {new Date().getFullYear()} GoFocus — Sistemas de Imagem
                </p>
            </footer>
        </div>
    );
};

const MenuItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-sm text-[10px] font-semibold uppercase tracking-wider transition-all w-full text-left ${
            active 
            ? "bg-white text-black" 
            : "text-white/40 hover:bg-white/5 hover:text-white/70"
        }`}
    >
        <Icon className="w-3.5 h-3.5" />
        {label}
    </button>
);

export default Dashboard;
