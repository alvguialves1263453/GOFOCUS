import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectsAsync, updateProjectAsync, type Project, type ProjectPhoto } from "@/lib/storage";
import { uploadToImageKit, getOptimizedUrl, deleteFromImageKit } from "@/lib/imagekit";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Trash2, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const AdminProjectEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ total: number; current: number; isUploading: boolean }>({
    total: 0,
    current: 0,
    isUploading: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const projects = await getProjectsAsync();
      const found = projects.find(p => p.id === id);
      if (found) {
        setProject(found);
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error("Failed to load project:", err);
      navigate("/admin/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !project) return;

    setUploadStatus({ total: files.length, current: 0, isUploading: true });

    try {
      const MAX_SIZE = 25 * 1024 * 1024; // 25MB limit for ImageKit free tier
      const oversizedFiles = files.filter(f => f.size > MAX_SIZE);

      if (oversizedFiles.length > 0) {
        toast.error(`Arquivo(s) muito grandes: ${oversizedFiles.map(f => f.name).join(", ")}. O limite é 25MB.`);
        setUploadStatus({ total: 0, current: 0, isUploading: false });
        return;
      }

      const uploadedPhotos: ProjectPhoto[] = [];

      // Upload sequentially to show progress or use Promise.all and update in batches
      // For better UX, we can do them in sequence to see the counter go up
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await uploadToImageKit(file, `gofocus/${project.slug}`);
        uploadedPhotos.push(uploaded);
        setUploadStatus(prev => ({ ...prev, current: i + 1 }));
      }

      const updatedPhotos = [...(project.photos || []), ...uploadedPhotos];
      await updateProjectAsync(project.id, { photos: updatedPhotos });
      setProject({ ...project, photos: updatedPhotos });
      toast.success(`${files.length} foto(s) adicionada(s)!`);
    } catch (err: any) {
      toast.error(err.message || "Erro no upload para ImageKit");
    } finally {
      setTimeout(() => {
        setUploadStatus({ total: 0, current: 0, isUploading: false });
      }, 2000);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (!project || !confirm("Remover esta foto?")) return;

    const photoToRemove = project.photos[index];
    const updatedPhotos = project.photos.filter((_, i) => i !== index);

    try {
      // First delete from ImageKit
      if (photoToRemove.publicId) {
        await deleteFromImageKit(photoToRemove.publicId);
      }

      await updateProjectAsync(project.id, { photos: updatedPhotos });
      setProject({ ...project, photos: updatedPhotos });
      toast.success("Foto removida");
    } catch (err) {
      toast.error("Erro ao remover foto");
    }
  };

  const handleCopyLink = () => {
    if (!project) return;
    const url = `${window.location.origin}/cliente/${project.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateName = async (newName: string) => {
    if (!project || !newName.trim() || newName === project.clientName) return;
    try {
      await updateProjectAsync(project.id, { clientName: newName.trim() });
      setProject({ ...project, clientName: newName.trim() });
      toast.success("Nome atualizado");
    } catch (err) {
      toast.error("Erro ao atualizar nome");
    }
  };

  if (loading) {
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
                defaultValue={project.clientName}
                onBlur={(e) => updateName(e.target.value)}
                className="bg-transparent font-display text-4xl font-light tracking-tight text-foreground outline-none border-b border-transparent focus:border-border transition-colors w-full sm:w-[400px]"
              />
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                <span>{photos.length} fotos</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Criado em {new Date(project.createdAt).toLocaleDateString("pt-BR")}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleCopyLink} className="inline-flex items-center gap-2 border border-border/50 px-5 py-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-foreground hover:text-foreground">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar Link Público"}
            </button>
            <a href={`/cliente/${project.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 border border-foreground bg-foreground px-5 py-3 text-[9px] uppercase tracking-[0.2em] text-background transition-all hover:bg-transparent hover:text-foreground">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver Prévia
            </a>
          </div>
        </div>

        <div className="mb-12 p-10 border border-dashed border-border/60 bg-secondary/5 text-center transition-all hover:border-border hover:bg-secondary/10 relative overflow-hidden group">
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleAddPhotos} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={uploadStatus.isUploading} />
          <motion.div
            className="flex flex-col items-center gap-4 py-4"
            animate={uploadStatus.isUploading ? { scale: 0.95, opacity: 0.5 } : { scale: 1, opacity: 1 }}
          >
            <div className="h-14 w-14 rounded-full border border-border flex items-center justify-center bg-background group-hover:bg-foreground group-hover:text-background transition-all duration-500 shadow-sm">
              {uploadStatus.isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" strokeWidth={1} />}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground font-medium tracking-wide">{uploadStatus.isUploading ? `Enviando ${uploadStatus.current}/${uploadStatus.total}...` : "Clique ou arraste para enviar novas fotos"}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Otimização automática ativada</p>
            </div>
          </motion.div>
          {uploadStatus.isUploading && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${(uploadStatus.current / uploadStatus.total) * 100}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          )}
        </div>

        {photos.length === 0 ? (
          <div className="flex items-center justify-center py-32 border border-border/30 rounded-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/50">Nenhuma foto adicionada</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <AnimatePresence mode="popLayout">
              {photos.map((photo, index) => (
                <motion.div
                  key={`${photo.url}-${index}`}
                  className="group relative aspect-[3/4] overflow-hidden bg-secondary/10"
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      duration: 0.6,
                      delay: index * 0.05
                    }
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  whileHover={{ y: -5 }}
                >
                  <img
                    src={getOptimizedUrl(photo.url, 400)}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => handleRemovePhoto(index)} className="h-10 w-10 flex items-center justify-center bg-background border border-border text-destructive hover:bg-destructive hover:text-background transition-all hover:scale-110 shadow-lg">
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

      <AnimatePresence>
        {uploadStatus.isUploading && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-8 py-4 rounded-full shadow-2xl flex items-center gap-6 min-w-[300px]"
          >
            <div className="relative h-10 w-10 flex items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" />
                <motion.circle
                  cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeDasharray="113.1"
                  animate={{ strokeDashoffset: 113.1 * (1 - uploadStatus.current / uploadStatus.total) }}
                />
              </svg>
              <span className="text-[10px] font-bold">{Math.round((uploadStatus.current / uploadStatus.total) * 100)}%</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">Enviando Galeria</p>
              <p className="text-xs">{uploadStatus.current} de {uploadStatus.total} arquivos</p>
            </div>
            <Loader2 className="h-4 w-4 animate-spin opacity-50" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProjectEdit;
