import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProjectsAsync,
  saveProjectAsync,
  deleteProjectAsync,
  generateSlug,
  getCategoriesAsync,
  saveCategoryAsync,
  deleteCategoryAsync,
  type Project,
  type ProjectPhoto,
  type Category
} from "@/lib/storage";
import { deleteFromImageKit } from "@/lib/imagekit";
import { useAuth } from "@/hooks/useAuth";
import { Plus, FolderOpen, Trash2, Image, Loader2, LogOut, Link as LinkIcon, Check, QrCode, Tag, ExternalLink, X } from "lucide-react";
import LiquidBackground from "@/components/LiquidBackground";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// NAO MEXER PQ DEU CERTO! (NAO SABER COMO TA FEITO, MAS FUNCIONA)
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrProject, setQrProject] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadProjects();
      loadCategories();
    }
  }, [user, authLoading]);

  const loadProjects = async () => {
    const data = await getProjectsAsync();
    setProjects(data);
  };

  const loadCategories = async () => {
    const data = await getCategoriesAsync();
    setCategories(data);
  };

  const handleSave = async () => {
    if (!projectName.trim()) return;
    setSaving(true);
    try {
      const newProject: Project = {
        id: "", // storage.ts will generate
        clientName: projectName.trim(),
        slug: "", // storage.ts will generate
        photos: [],
        createdAt: new Date().toISOString(),
        featured: false,
        coverIndex: 0,
        categoryId: selectedCategoryId || undefined
      };
      const result = await saveProjectAsync(newProject);
      if (result.remote) {
        toast.success("Projeto criado e sincronizado com a nuvem!");
      } else {
        toast.error("Salvo apenas localmente: " + (result.error || "Erro de permissão RLS."));
      }
      setProjectName("");
      setSelectedCategoryId("");
      setShowForm(false);
      loadProjects();
    } catch (err: any) {
      toast.error("Erro ao salvar projeto");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;
    setCategorySaving(true);
    try {
      const newCategory: Category = {
        id: "", // storage.ts will generate if empty
        name: categoryName.trim(),
        slug: "" // storage.ts will generate if empty
      };
      const result = await saveCategoryAsync(newCategory);
      if (result.remote) {
        toast.success("Categoria criada e sincronizada!");
      } else {
        toast.error("Salvo apenas localmente: " + (result.error || "Erro de permissão."));
      }
      setCategoryName("");
      setShowCategoryForm(false);
      loadCategories();
    } catch (err: any) {
      console.error("Erro na UI ao salvar categoria:", err);
      toast.error(err.message || "Erro ao salvar categoria");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Os projetos associados não serão excluídos, mas ficarão sem categoria.")) return;
    try {
      await deleteCategoryAsync(id);
      toast.success("Categoria excluída");
      loadCategories();
    } catch (err) {
      toast.error("Erro ao excluir categoria");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;

    const projectToDelete = projects.find(p => p.id === id);

    try {
      if (projectToDelete && projectToDelete.photos) {
        // Delete all photos from ImageKit
        await Promise.all(
          projectToDelete.photos
            .filter(p => !!p.publicId)
            .map(p => deleteFromImageKit(p.publicId))
        );
      }

      await deleteProjectAsync(id);
      toast.success("Projeto excluído");
      loadProjects();
    } catch (err) {
      toast.error("Erro ao excluir projeto");
    }
  };

  const handleCopyLink = (e: React.MouseEvent, slug: string, id: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/cliente/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShowQr = (e: React.MouseEvent, name: string, slug: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/cliente/${slug}`;
    setQrProject({ name, url });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LiquidBackground />
        <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] animate-pulse">Autenticando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-foreground selection:bg-primary/30">
      <LiquidBackground />

      <header className="px-3 py-4 sm:px-6 sm:py-8 relative z-20">
        <div className="mx-auto flex flex-col sm:flex-row max-w-6xl items-center justify-between gap-6 sm:gap-4 glass-liquid px-5 sm:px-8 py-4 rounded-[2rem] sm:rounded-full glow-border">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <h1 className="font-display text-2xl sm:text-xl font-light tracking-[0.2em] text-white">GoFocus</h1>
            <span className="text-[8px] uppercase tracking-[0.4em] text-white/30 sm:border-l sm:border-white/10 sm:pl-4 font-bold">Painel de Controle</span>
          </div>
          <div className="flex items-center gap-10 sm:gap-8">
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] sm:text-[9px] uppercase tracking-[0.3em] text-white/50 hover:text-white transition-all font-bold">
              Ver Site <ExternalLink className="h-3 w-3" />
            </a>
            <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] sm:text-[9px] uppercase tracking-[0.3em] text-white/50 hover:text-white transition-all font-bold">
              <LogOut className="h-3 w-3" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 relative z-10">
        <Tabs defaultValue="projects" className="w-full">
          <div className="mb-12 flex flex-col items-center justify-between gap-10 bg-black/20 p-8 sm:p-10 rounded-[3rem] border border-white/5 backdrop-blur-3xl lg:flex-row">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="font-display text-4xl sm:text-3xl font-light tracking-tight text-white/90">Gestão de Conteúdo</h2>
              <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-bold">Organize seus projetos e categorias</p>
            </div>
            <TabsList className="bg-white/5 p-1.5 rounded-full border border-white/5 w-full max-w-[340px] sm:w-auto">
              <TabsTrigger value="projects" className="flex-1 text-[9px] uppercase tracking-widest px-8 py-3.5 rounded-full data-[state=active]:bg-white data-[state=active]:text-black transition-all font-bold sm:flex-none">Projetos</TabsTrigger>
              <TabsTrigger value="categories" className="flex-1 text-[9px] uppercase tracking-widest px-8 py-3.5 rounded-full data-[state=active]:bg-white data-[state=active]:text-black transition-all font-bold sm:flex-none">Categorias</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="projects">
            <div className="mb-10 flex items-center justify-between">
              <h3 className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-bold px-4 border-l-2 border-primary">Projetos Ativos</h3>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`inline-flex items-center gap-3 px-8 py-4 text-[9px] uppercase tracking-[0.3em] transition-all duration-500 rounded-full font-bold ${showForm
                  ? "glass-liquid text-white border-white/10"
                  : "bg-white text-black glow-border shadow-xl hover:scale-105"
                  }`}
              >
                {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showForm ? "Fechar" : "Novo Projeto"}
              </button>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  className="mb-12 glass-liquid p-10 rounded-[3rem] glow-border shadow-2xl"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex flex-col gap-8 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-[0.4em] text-white/50 ml-4 font-bold">Título do Projeto</label>
                        <input
                          type="text"
                          placeholder="Ex: Casamento em Milão"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="w-full glass-liquid border-white/5 bg-transparent px-8 py-5 rounded-full text-sm text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-white/10"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] uppercase tracking-[0.4em] text-white/50 ml-4 font-bold">Categoria</label>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                          <SelectTrigger className="w-full glass-liquid border-white/5 bg-transparent px-8 py-5 h-auto rounded-full text-sm text-white focus:outline-none focus:ring-0 focus:ring-offset-0 border-white/5 transition-all">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent className="glass-liquid border-white/10 text-white">
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="focus:bg-white/10 focus:text-white">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving || !projectName.trim()}
                      className="inline-flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] glow-border shadow-xl disabled:opacity-30"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      {saving ? "Processando..." : "Criar Projeto Vitalício"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center glass-liquid py-32 rounded-[4rem] border-white/5 border-dashed">
                <FolderOpen className="h-10 w-10 text-white/10 mb-6" strokeWidth={1} />
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">A imensidão está vazia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    categories={categories}
                    onClick={() => navigate(`/admin/projeto/${project.id}`)}
                    onCopyLink={handleCopyLink}
                    onShowQr={handleShowQr}
                    onDelete={handleDelete}
                    copiedId={copiedId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories">
            <div className="mb-10 flex items-center justify-between">
              <h3 className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-bold px-4 border-l-2 border-primary">Estrutura de Categorias</h3>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className={`inline-flex items-center gap-3 px-8 py-4 text-[9px] uppercase tracking-[0.3em] transition-all duration-500 rounded-full font-bold ${showCategoryForm
                  ? "glass-liquid text-white border-white/10"
                  : "bg-white text-black glow-border shadow-xl hover:scale-105"
                  }`}
              >
                {showCategoryForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showCategoryForm ? "Fechar" : "Nova Categoria"}
              </button>
            </div>

            <AnimatePresence>
              {showCategoryForm && (
                <motion.div
                  className="mb-12 glass-liquid p-10 rounded-[3rem] glow-border shadow-2xl"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex flex-col gap-8 max-w-md">
                    <div className="space-y-3">
                      <label className="text-[9px] uppercase tracking-[0.4em] text-white/50 ml-4 font-bold">Título da Categoria</label>
                      <input
                        type="text"
                        placeholder="Ex: Arquitetura, Interiores"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="w-full glass-liquid border-white/5 bg-transparent px-8 py-5 rounded-full text-sm text-white focus:outline-none focus:border-primary/30 transition-all placeholder:text-white/10"
                      />
                    </div>
                    <button
                      onClick={handleSaveCategory}
                      disabled={categorySaving || !categoryName.trim()}
                      className="inline-flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] glow-border shadow-xl disabled:opacity-30"
                    >
                      {categorySaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                      {categorySaving ? "Processando..." : "Registrar Categoria"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center glass-liquid py-32 rounded-[4rem] border-white/5 border-dashed">
                <Tag className="h-10 w-10 text-white/10 mb-6" strokeWidth={1} />
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">Sem nichos definidos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between glass-liquid p-8 rounded-[2.5rem] group hover:border-white/20 transition-all glow-border">
                    <div className="space-y-1">
                      <h4 className="font-display text-lg text-white/90">{category.name}</h4>
                      <p className="text-[8px] text-white/20 uppercase tracking-[0.4em] font-bold">{category.slug}</p>
                    </div>
                    <button onClick={() => handleDeleteCategory(category.id)} className="flex h-10 w-10 items-center justify-center rounded-full glass border border-white/5 text-white/30 hover:border-destructive/30 hover:text-destructive transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!qrProject} onOpenChange={(open) => !open && setQrProject(null)}>
          <DialogContent className="sm:max-w-md glass-liquid border-white/10 glow-border">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-light tracking-[0.2em] text-center uppercase text-white/90">QR Code do Projeto</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-8 py-8">
              <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-primary">{qrProject?.name}</span>
              <div className="bg-white p-6 rounded-[2rem] shadow-[0_30px_60px_rgba(255,255,255,0.1)]">
                {qrProject && (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrProject.url)}`}
                    alt="QR Code"
                    className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px]"
                  />
                )}
              </div>
              <p className="text-[9px] text-center uppercase tracking-[0.3em] text-white/40 px-6 leading-relaxed">
                Escaneie para visualizar este portfólio em outro dispositivo
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

function ProjectCard({ project, categories, onClick, onCopyLink, onShowQr, onDelete, copiedId }: any) {
  const photo = project.photos?.[project.coverIndex || 0];
  const category = categories.find((c: any) => c.id === project.categoryId);

  return (
    <motion.div
      className="group relative glass-liquid rounded-[3rem] overflow-hidden cursor-pointer border-white/5 glow-border shadow-2xl transition-all hover:-translate-y-2 duration-500"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
    >
      <div className="relative aspect-[16/10] bg-white/5 overflow-hidden">
        {photo ? (
          <img src={photo.url} alt={project.clientName} className="h-full w-full object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-60 group-hover:opacity-100" />
        ) : (
          <div className="flex h-full items-center justify-center"><Image className="h-8 w-8 text-white/5" strokeWidth={1} /></div>
        )}
        {category && (
          <div className="absolute top-5 left-5 glass-liquid px-4 py-1.5 rounded-full text-[7px] font-bold uppercase tracking-[0.3em] text-white border-white/10 glow-border">
            {category.name}
          </div>
        )}
      </div>
      <div className="p-6 sm:p-8 space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h3 className="font-display text-xl sm:text-2xl text-white/90 tracking-tight leading-none group-hover:text-white transition-colors truncate">{project.clientName}</h3>
            <p className="text-[9px] text-white/20 uppercase tracking-[0.4em] font-bold">
              {project.photos?.length || 0} Captura{(project.photos?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.1 }} className="h-10 w-10 flex items-center justify-center glass-liquid rounded-full border-white/10 glow-border">
            <ExternalLink className="h-3.5 w-3.5 text-white/40" />
          </motion.div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={(e) => onCopyLink(e, project.slug, project.id)} className="flex-1 flex h-12 items-center justify-center gap-3 glass-liquid rounded-full border-white/5 text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:border-white/20 transition-all glow-border">
            {copiedId === project.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <LinkIcon className="h-3.5 w-3.5" />}
            {copiedId === project.id ? "Copiado" : "Link"}
          </button>
          <button onClick={(e) => onShowQr(e, project.clientName, project.slug)} className="flex h-12 w-12 items-center justify-center glass-liquid rounded-full border-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all glow-border">
            <QrCode className="h-4 w-4" />
          </button>
          <button onClick={(e) => onDelete(e, project.id)} className="flex h-12 w-12 items-center justify-center glass-liquid rounded-full border-white/5 text-white/20 hover:text-destructive hover:border-destructive/30 transition-all glow-border">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default AdminDashboard;
