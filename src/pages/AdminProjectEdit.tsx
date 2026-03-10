import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectsAsync, updateProjectAsync, getCategoriesAsync, type Project, type ProjectPhoto, type Category } from "@/lib/storage";
import { uploadToImageKit, getOptimizedUrl, deleteFromImageKit } from "@/lib/imagekit";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Trash2, Copy, Check, Loader2, ExternalLink, Tag, X, Image, Sparkles, Camera } from "lucide-react";
import LiquidBackground from "@/components/LiquidBackground";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const AdminProjectEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ total: number; current: number; isUploading: boolean }>({
    total: 0,
    current: 0,
    isUploading: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (id) {
      loadProject();
      loadCategories();
    }
  }, [id]);

  const loadCategories = async () => {
    const data = await getCategoriesAsync();
    setCategories(data);
  };

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
      const MAX_SIZE = 25 * 1024 * 1024;
      const oversizedFiles = (files as File[]).filter(f => f.size > MAX_SIZE);

      if (oversizedFiles.length > 0) {
        toast.error(`Arquivo(s) muito grandes: ${oversizedFiles.map(f => f.name).join(", ")}. O limite é 25MB.`);
        setUploadStatus({ total: 0, current: 0, isUploading: false });
        return;
      }

      const uploadedPhotos: ProjectPhoto[] = [];
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

    // Adjust coverIndex if needed
    let newCoverIndex = project.coverIndex || 0;
    if (index === newCoverIndex) {
      newCoverIndex = 0; // Reset to first if cover was deleted
    } else if (index < newCoverIndex) {
      newCoverIndex--; // Shift if a previous photo was deleted
    }

    try {
      if (photoToRemove.publicId) {
        await deleteFromImageKit(photoToRemove.publicId);
      }

      await updateProjectAsync(project.id, {
        photos: updatedPhotos,
        coverIndex: newCoverIndex
      });
      setProject({ ...project, photos: updatedPhotos, coverIndex: newCoverIndex });
      toast.success("Foto removida");
    } catch (err) {
      toast.error("Erro ao remover foto");
    }
  };

  const handleSetCover = async (index: number) => {
    if (!project) return;
    try {
      await updateProjectAsync(project.id, { coverIndex: index });
      setProject({ ...project, coverIndex: index });
      toast.success("Capa do projeto atualizada!");
    } catch (err) {
      toast.error("Erro ao atualizar capa");
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

  const updateCategory = async (categoryId: string) => {
    if (!project || categoryId === project.categoryId) return;
    try {
      const idToStore = categoryId === "none" ? undefined : categoryId;
      await updateProjectAsync(project.id, { categoryId: idToStore });
      setProject({ ...project, categoryId: idToStore });
      toast.success("Categoria atualizada");
    } catch (err) {
      toast.error("Erro ao atualizar categoria");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LiquidBackground />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  const photos = project.photos || [];

  return (
    <div className="min-h-screen relative text-foreground selection:bg-primary/30">
      <LiquidBackground />

      <div className="mx-auto max-w-6xl px-6 py-12 relative z-10">
        <div className="mb-16 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between glass-liquid p-8 sm:p-12 rounded-[3.5rem] glow-border shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left w-full lg:w-auto">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex h-14 w-14 items-center justify-center shrink-0 rounded-full glass-liquid border-white/5 text-white/40 transition-all hover:text-white hover:bg-white/10 glow-border"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="space-y-6 w-full">
              <input
                type="text"
                defaultValue={project.clientName}
                onBlur={(e) => updateName(e.target.value)}
                className="bg-transparent font-display text-4xl sm:text-5xl font-light tracking-tight text-white/90 outline-none border-b border-transparent focus:border-white/20 transition-all w-full text-center sm:text-left"
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold flex items-center gap-3">
                  <Camera className="h-4 w-4" />
                  <span>{photos.length} Fotos</span>
                  <span className="h-1 w-1 rounded-full bg-white/10" />
                  <span>{new Date(project.createdAt).toLocaleDateString("pt-BR")}</span>
                </p>
                <div className="h-5 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-4 glass-liquid px-6 py-2.5 rounded-full border-white/5 glow-border">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <Select
                    defaultValue={project.categoryId || "none"}
                    onValueChange={updateCategory}
                  >
                    <SelectTrigger className="h-auto w-auto min-w-[150px] bg-transparent border-none p-0 text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="glass-liquid border-white/10 text-white">
                      <SelectItem value="none" className="text-[10px] uppercase tracking-widest font-bold">Sem Categoria</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="text-[10px] uppercase tracking-widest font-bold">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full lg:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex h-14 items-center justify-center gap-3 glass-liquid px-10 rounded-full border-white/5 text-[10px] uppercase tracking-[0.3em] font-bold text-white/50 transition-all hover:text-white glow-border w-full sm:w-auto"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link Copiado!" : "Compartilhar"}
            </button>
            <a
              href={`/cliente/${project.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center gap-3 bg-white text-black px-10 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold shadow-xl transition-all hover:scale-105 active:scale-95 glow-border w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              Ver Prévia
            </a>
          </div>
        </div>

        <div className="mb-16 p-16 glass-liquid rounded-[4rem] border border-dashed border-white/10 bg-white/[0.02] text-center transition-all hover:bg-white/[0.04] relative overflow-hidden group glow-border shadow-2xl">
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleAddPhotos} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={uploadStatus.isUploading} />
          <motion.div
            className="flex flex-col items-center gap-6"
            animate={uploadStatus.isUploading ? { scale: 0.98, opacity: 0.6 } : { scale: 1, opacity: 1 }}
          >
            <div className="h-20 w-20 rounded-full glass-liquid border-white/5 flex items-center justify-center bg-white/5 group-hover:bg-white group-hover:text-black transition-all duration-700 glow-border shadow-2xl">
              {uploadStatus.isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Plus className="h-8 w-8" strokeWidth={1} />}
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-display font-light text-white/90">Role para Baixo!</h3>
              <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-bold">Arraste os arquivos ou clique para processar as capturas</p>
            </div>
          </motion.div>
          {uploadStatus.isUploading && (
            <motion.div
              className="absolute bottom-0 left-0 h-1.5 bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(uploadStatus.current / uploadStatus.total) * 100}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          )}
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 glass-liquid rounded-[4rem] border-white/5 border-dashed">
            <Image className="h-12 w-12 text-white/10 mb-6" strokeWidth={1} />
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/20 font-bold">Nenhuma captura disponível ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <AnimatePresence mode="popLayout">
              {photos.map((photo, index) => (
                <motion.div
                  key={`${photo.url}-${index}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-[2rem] glass-liquid border-white/5 glow-border shadow-2xl"
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: {
                      type: "spring",
                      duration: 0.8,
                      delay: index * 0.05
                    }
                  }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                  whileHover={{ y: -8 }}
                >
                  <img
                    src={getOptimizedUrl(photo.url, 600)}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-70 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSetCover(index)}
                        className={`h-14 w-14 flex items-center justify-center rounded-full glass-liquid border-white/10 transition-all glow-border shadow-2xl ${project.coverIndex === index ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        title="Definir como capa"
                      >
                        <Image className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="h-14 w-14 flex items-center justify-center rounded-full glass-liquid border-white/10 text-destructive hover:scale-110 transition-all glow-border shadow-2xl"
                        title="Excluir"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                      {project.coverIndex === index ? 'Capa vinculada' : 'Gerenciar'}
                    </span>
                  </div>
                  {project.coverIndex === index && (
                    <div className="absolute top-4 right-4 glass-liquid px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest text-primary border-primary shadow-2xl">
                      Capa
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 glass-liquid px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest text-white/40 border-white/5">
                    CPT {index + 1}
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
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 glass-liquid px-10 py-6 rounded-[3rem] glow-border shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex items-center gap-8 min-w-[350px] border-white/10"
          >
            <div className="relative h-14 w-14 flex items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="28" cy="28" r="25" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
                <motion.circle
                  cx="28" cy="28" r="25" fill="none" stroke="primary" strokeWidth="3"
                  strokeDasharray="157"
                  animate={{ strokeDashoffset: 157 * (1 - uploadStatus.current / uploadStatus.total) }}
                  className="text-primary"
                />
              </svg>
              <span className="text-[11px] font-bold text-white">{Math.round((uploadStatus.current / uploadStatus.total) * 100)}%</span>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary">Processando Midia</p>
              <p className="text-xs text-white/60">{uploadStatus.current} de {uploadStatus.total} arquivos finalizados</p>
            </div>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProjectEdit;
