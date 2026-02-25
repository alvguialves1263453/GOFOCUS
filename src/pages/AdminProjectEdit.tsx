import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchProjectById, uploadPhotos, deletePhoto, getPublicUrl, updateProject, type Project, type Photo } from "@/lib/supabase-helpers";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Trash2, Copy, Check, Loader2, ArrowUpCircle, ExternalLink } from "lucide-react";
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
    if (id) loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await fetchProjectById(id!);
      if (data) setProject(data);
      else navigate("/admin/dashboard");
    } catch {
      toast.error("Erro ao carregar projeto");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !project) return;

    setAdding(true);
    try {
      await uploadPhotos(project.id, files);
      toast.success(`${files.length} foto(s) adicionada(s)!`);
      await loadProject();
    } catch (err: any) {
      toast.error(err.message || "Erro no upload");
    } finally {
      setAdding(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async (photo: any) => {
    if (!confirm("Remover esta foto?")) return;
    try {
      await deletePhoto(photo.id, photo.image_url);
      toast.success("Foto removida");
      await loadProject();
    } catch {
      toast.error("Erro ao remover foto");
    }
  };

  const handleCopyLink = () => {
    if (!project) return;
    const url = `${window.location.origin}/projeto/${project.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateName = async (newName: string) => {
    if (!project || newName === project.name) return;
    try {
      await updateProject(project.id, { name: newName });
      setProject({ ...project, name: newName });
      toast.success("Nome atualizado");
    } catch {
      toast.error("Erro ao atualizar nome");
    }
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
        <div className="mb-12 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-5">
            <button onClick={() => navigate("/admin/dashboard")} className="mt-1 flex h-10 w-10 items-center justify-center border border-border/50 text-muted-foreground transition-all hover:border-foreground hover:text-foreground hover:bg-secondary/50">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="space-y-2">
              <input
                type="text"
                defaultValue={project.name}
                onBlur={(e) => updateName(e.target.value)}
                className="bg-transparent font-display text-4xl font-light tracking-tight text-foreground outline-none border-b border-transparent focus:border-border transition-colors w-full sm:w-[400px]"
              />
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <span>{photos.length} fotos</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleCopyLink} className="inline-flex items-center gap-2 border border-border/50 px-5 py-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-foreground hover:text-foreground">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar Link Público"}
            </button>
            <a href={`/projeto/${project.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-3 text-[9px] uppercase tracking-[0.2em] text-background transition-all hover:bg-transparent hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver Prévia
            </a>
          </div>
        </div>

        <div className="mb-12 p-10 border border-dashed border-border/60 bg-secondary/5 text-center transition-all hover:border-border hover:bg-secondary/10 relative">
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleAddPhotos} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={adding} />
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border border-border flex items-center justify-center bg-background group-hover:bg-foreground group-hover:text-background transition-colors">
              {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" strokeWidth={1.5} />}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground font-medium">{adding ? "Enviando fotos..." : "Clique ou arraste para enviar fotos"}</p>
              <p className="text-xs text-muted-foreground">Apenas arquivos de imagem são aceitos</p>
            </div>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="flex items-center justify-center py-32 border border-border/30 rounded-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50">Nenhuma foto adicionada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {photos.map((photo: Photo, index: number) => (
                <motion.div key={photo.id} className="group relative aspect-[3/4] overflow-hidden bg-secondary/20" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <img src={getPublicUrl(photo.image_url)} alt={`Foto ${index + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleRemovePhoto(photo)} className="h-10 w-10 flex items-center justify-center bg-background border border-border text-destructive hover:bg-destructive hover:text-background transition-all hover:scale-110 shadow-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm border border-border/50 text-[8px] uppercase tracking-widest text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                    #{index + 1}
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
