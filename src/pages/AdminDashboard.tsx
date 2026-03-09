import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectsAsync, saveProjectAsync, deleteProjectAsync, generateSlug, type Project, type ProjectPhoto } from "@/lib/storage";
import { deleteFromImageKit } from "@/lib/imagekit";
import { useAuth } from "@/hooks/useAuth";
import { Plus, FolderOpen, Trash2, Image, Loader2, LogOut, Link as LinkIcon, Check, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrProject, setQrProject] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    if (!authLoading && user) loadProjects();
  }, [user, authLoading]);

  const loadProjects = async () => {
    const data = await getProjectsAsync();
    setProjects(data);
  };

  const handleSave = async () => {
    if (!projectName.trim()) return;
    setSaving(true);
    try {
      const newProject: Project = {
        id: crypto.randomUUID(),
        clientName: projectName.trim(),
        slug: generateSlug(projectName.trim()),
        photos: [],
        createdAt: new Date().toISOString(),
        featured: false,
        coverIndex: 0
      };
      await saveProjectAsync(newProject);
      toast.success("Projeto criado com sucesso!");
      setProjectName("");
      setShowForm(false);
      loadProjects();
    } catch (err: any) {
      toast.error("Erro ao salvar projeto");
    } finally {
      setSaving(false);
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-6 py-5 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-light tracking-[0.15em] text-foreground">GoFocus</h1>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.3em] text-muted-foreground border-l border-border pl-4">Admin</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">Ver Site</a>
            <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-3 w-3" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-lg font-light tracking-wide text-foreground">Projetos</h2>
          <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-2.5 text-[10px] uppercase tracking-[0.3em] text-background transition-all duration-300 hover:bg-transparent hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
            {showForm ? "Cancelar" : "Novo Projeto"}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div className="mb-10 border border-border p-8 bg-secondary/20" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <div className="flex flex-col gap-5 max-w-md">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nome do Projeto</label>
                  <input type="text" placeholder="Ex: Casamento Maria e João" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors" />
                </div>
                <button onClick={handleSave} disabled={saving || !projectName.trim()} className="inline-flex items-center justify-center gap-2 border border-foreground bg-foreground px-6 py-2.5 text-[10px] uppercase tracking-[0.3em] text-background transition-all duration-300 hover:bg-transparent hover:text-foreground disabled:opacity-30">
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saving ? "Salvando..." : "Salvar Projeto"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border py-24">
            <FolderOpen className="h-8 w-8 text-muted-foreground/20 mb-4" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Nenhum projeto criado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const photo = project.photos?.[project.coverIndex || 0];
              return (
                <motion.div key={project.id} className="group relative border border-border overflow-hidden cursor-pointer bg-secondary/10 transition-all hover:border-foreground/30 hover:bg-secondary/20" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate(`/admin/projeto/${project.id}`)}>
                  <div className="relative aspect-[16/10] bg-secondary/30 overflow-hidden">
                    {photo ? (
                      <img src={photo.url} alt={`Capa - ${project.clientName}`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Image className="h-8 w-8 text-muted-foreground/10" strokeWidth={1} /></div>
                    )}
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-base text-foreground group-hover:text-foreground transition-colors">{project.clientName}</h3>
                      <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                        {project.photos?.length || 0} foto{(project.photos?.length || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => handleCopyLink(e, project.slug, project.id)} className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors" title="Copiar link de compartilhamento">
                        {copiedId === project.id ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={(e) => handleShowQr(e, project.clientName, project.slug)} className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors" title="Ver QR Code">
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => handleDelete(e, project.id)} className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <Dialog open={!!qrProject} onOpenChange={(open) => !open && setQrProject(null)}>
          <DialogContent className="sm:max-w-md bg-background border-border">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-light tracking-widest text-center uppercase">QR Code do Projeto</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center space-y-6 py-6">
              <span className="text-[10px] uppercase font-light tracking-[0.2em] text-white/70">{qrProject?.name}</span>
              <div className="bg-white p-4 rounded-xl shadow-2xl">
                {qrProject && (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrProject.url)}`}
                    alt="QR Code"
                    className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px]"
                  />
                )}
              </div>
              <p className="text-[10px] text-center uppercase tracking-[0.2em] text-muted-foreground px-4">
                Escaneie para abrir este projeto em outro dispositivo
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
