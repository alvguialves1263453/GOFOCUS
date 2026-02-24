import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getProjects, updateProject, fileToBase64, type Project } from "@/lib/storage";
import { ArrowLeft, Plus, Star, Trash2, Download, Copy, Check } from "lucide-react";

const AdminProjectEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("gofocus_auth") !== "true") {
      navigate("/admin");
      return;
    }
    const found = getProjects().find((p) => p.id === id);
    if (found) {
      setProject(found);
    } else {
      navigate("/admin/dashboard");
    }
  }, [id, navigate]);

  const refresh = () => {
    const found = getProjects().find((p) => p.id === id);
    if (found) setProject(found);
  };

  const handleAddPhotos = async (fileList: FileList | null) => {
    if (!fileList || !project) return;
    setAdding(true);
    const newPhotos = await Promise.all(Array.from(fileList).map(fileToBase64));
    const updated = [...project.photos, ...newPhotos];
    updateProject(project.id, { photos: updated });
    refresh();
    setAdding(false);
  };

  const handleRemovePhoto = (index: number) => {
    if (!project) return;
    const updated = project.photos.filter((_, i) => i !== index);
    const newCover = project.coverIndex >= updated.length ? 0 : project.coverIndex > index ? project.coverIndex - 1 : project.coverIndex === index ? 0 : project.coverIndex;
    updateProject(project.id, { photos: updated, coverIndex: newCover });
    refresh();
  };

  const handleSetCover = (index: number) => {
    if (!project) return;
    updateProject(project.id, { coverIndex: index });
    refresh();
  };

  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    const ext = dataUrl.includes("image/png") ? "png" : "jpg";
    link.download = `${project?.clientName || "foto"}-${index + 1}.${ext}`;
    link.click();
  };

  const handleCopyLink = () => {
    if (!project) return;
    // Use the current visible URL (works for both preview and published)
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/cliente/${project.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNameChange = (name: string) => {
    if (!project) return;
    updateProject(project.id, { clientName: name });
    refresh();
  };

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <input
                type="text"
                value={project.clientName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="bg-transparent font-display text-2xl font-light tracking-[0.1em] text-foreground outline-none border-b border-transparent focus:border-border transition-colors w-full"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {project.photos.length} foto{project.photos.length !== 1 ? "s" : ""} • Criado em{" "}
                {new Date(project.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar Link"}
            </button>
            <a
              href={`/cliente/${project.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-foreground px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Ver Prévia
            </a>
          </div>
        </div>

        {/* Add Photos */}
        <div className="mb-8">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleAddPhotos(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={adding}
            className="inline-flex items-center gap-2 border border-dashed border-border px-6 py-3 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            {adding ? "Adicionando..." : "Adicionar Fotos"}
          </button>
        </div>

        {/* Photo Gallery */}
        {project.photos.length === 0 ? (
          <div className="flex items-center justify-center py-24 border border-dashed border-border">
            <p className="text-sm text-muted-foreground">Nenhuma foto neste projeto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {project.photos.map((photo, index) => (
                <motion.div
                  key={`${project.id}-${index}-${photo.slice(-20)}`}
                  className="group relative aspect-[3/4] overflow-hidden bg-secondary"
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={photo}
                    alt={`Foto ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />

                  {/* Cover badge */}
                  {project.coverIndex === index && (
                    <div className="absolute top-2 left-2 bg-foreground px-2 py-1 text-[9px] uppercase tracking-widest text-background">
                      Capa
                    </div>
                  )}

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 flex items-end justify-center gap-2 bg-background/60 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={() => handleSetCover(index)}
                      title="Definir como capa"
                      className={`flex h-9 w-9 items-center justify-center border transition-colors ${
                        project.coverIndex === index
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground/60 text-foreground hover:bg-foreground hover:text-background"
                      }`}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(photo, index)}
                      title="Baixar foto"
                      className="flex h-9 w-9 items-center justify-center border border-foreground/60 text-foreground transition-colors hover:bg-foreground hover:text-background"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      title="Remover foto"
                      className="flex h-9 w-9 items-center justify-center border border-destructive/60 text-destructive transition-colors hover:bg-destructive hover:text-foreground"
                    >
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
