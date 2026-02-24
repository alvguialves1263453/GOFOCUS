import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProjectById, updateProject, uploadPhotos, deletePhoto, type Project, type Photo } from "@/lib/supabase-helpers";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Star, Trash2, Download, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminProjectEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/admin"); return; }
    if (user && id) loadProject();
  }, [user, authLoading, id, navigate]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await fetchProjectById(id!);
      if (data) setProject(data);
      else navigate("/admin/dashboard");
    } catch { toast.error("Erro ao carregar projeto"); }
    finally { setLoading(false); }
  };

  const handleAddPhotos = async (fileList: FileList | null) => {
    if (!fileList || !project) return;
    setAdding(true);
    try {
      await uploadPhotos(project.id, Array.from(fileList));
      toast.success("Fotos adicionadas!");
      await loadProject();
    } catch (err: any) { toast.error(err.message || "Erro no upload"); }
    finally { setAdding(false); }
  };

  const handleRemovePhoto = async (photo: Photo) => {
    try {
      await deletePhoto(photo);
      toast.success("Foto removida");
      await loadProject();
    } catch { toast.error("Erro ao remover foto"); }
  };

  const handleSetCover = async (imageUrl: string) => {
    if (!project) return;
    try {
      await updateProject(project.id, { cover_image: imageUrl });
      toast.success("Capa atualizada");
      await loadProject();
    } catch { toast.error("Erro ao definir capa"); }
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = `${project?.title || "foto"}-${index + 1}.jpg`;
    link.click();
  };

  const handleCopyLink = () => {
    if (!project) return;
    const url = `${window.location.origin}/projeto/${project.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNameChange = async (name: string) => {
    if (!project) return;
    setProject({ ...project, title: name });
  };

  const handleNameBlur = async () => {
    if (!project) return;
    try {
      await updateProject(project.id, { title: project.title });
    } catch { toast.error("Erro ao atualizar nome"); }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  const photos = project.photos || [];

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/admin/dashboard")} className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <input type="text" value={project.title} onChange={(e) => handleNameChange(e.target.value)} onBlur={handleNameBlur} className="bg-transparent font-display text-2xl font-light tracking-[0.1em] text-foreground outline-none border-b border-transparent focus:border-border transition-colors w-full" />
              <p className="mt-1 text-xs text-muted-foreground">{photos.length} foto{photos.length !== 1 ? "s" : ""} • Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleCopyLink} className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar Link"}
            </button>
            <a href={`/projeto/${project.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-foreground px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background">
              Ver Prévia
            </a>
          </div>
        </div>

        {/* Add Photos */}
        <div className="mb-8">
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(e) => handleAddPhotos(e.target.files)} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={adding} className="inline-flex items-center gap-2 border border-dashed border-border px-6 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {adding ? "Adicionando..." : "Adicionar Fotos"}
          </button>
        </div>

        {/* Photo Gallery */}
        {photos.length === 0 ? (
          <div className="flex items-center justify-center py-24 border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Nenhuma foto neste projeto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {photos.map((photo, index) => (
                <motion.div key={photo.id} className="group relative aspect-[3/4] overflow-hidden bg-secondary" layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                  <img src={photo.image_url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  {project.cover_image === photo.image_url && (
                    <div className="absolute top-2 left-2 bg-foreground px-2 py-1 text-[9px] uppercase tracking-widest text-background">Capa</div>
                  )}
                  <div className="absolute inset-0 flex items-end justify-center gap-2 bg-background/60 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button onClick={() => handleSetCover(photo.image_url)} title="Definir como capa" className={`flex h-9 w-9 items-center justify-center border transition-colors ${project.cover_image === photo.image_url ? "border-foreground bg-foreground text-background" : "border-foreground/60 text-foreground hover:bg-foreground hover:text-background"}`}>
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDownload(photo.image_url, index)} title="Baixar foto" className="flex h-9 w-9 items-center justify-center border border-foreground/60 text-foreground transition-colors hover:bg-foreground hover:text-background">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleRemovePhoto(photo)} title="Remover foto" className="flex h-9 w-9 items-center justify-center border border-destructive/60 text-destructive transition-colors hover:bg-destructive hover:text-foreground">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProjectEdit;
