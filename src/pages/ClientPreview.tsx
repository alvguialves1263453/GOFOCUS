import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectBySlugAsync, getProjectsAsync, incrementLikesAsync, type Project } from "@/lib/storage";
import { Loader2, Download, X, Heart } from "lucide-react";
import { toast } from "sonner";

const ClientPreview = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    async function loadProject() {
      setLoading(true);
      let found = null;

      try {
        if (slug) {
          found = await getProjectBySlugAsync(slug);
        } else if (id) {
          // getProjectBySlugAsync handles both id and slug in our refactored storage
          // But here we can specifically fetch if we had an id function
          // For now, let's use a general fetch
          const projects = await getProjectsAsync();
          found = projects.find(p => p.id === id);
        }

        if (found) {
          setProject(found);
          setLikeCount(found.likes || 0);
          setNotFound(false);

          // Check if already liked
          const hasLiked = localStorage.getItem(`liked_${found.id}`);
          if (hasLiked) setLiked(true);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load project:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id, slug]);

  const handleLike = async () => {
    if (liked || !project) return;

    try {
      const newCount = await incrementLikesAsync(project.id);
      setLikeCount(newCount);
      setLiked(true);
      setShowThanks(true);
      localStorage.setItem(`liked_${project.id}`, "true");

      // Hide thanks after some time
      setTimeout(() => setShowThanks(false), 3000);
    } catch (err) {
      console.error("Erro ao curtir:", err);
      toast.error("Não foi possível curtir agora");
    }
  };

  const handleDownload = async (url: string, index: number) => {
    const fileName = `${project?.clientName || "foto"}-${index + 1}.jpg`;

    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/jpeg" });

      // Support for Web Share API (Mobile devices)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: fileName,
          });
          return; // Success, no need for fallback
        } catch (shareError) {
          // If user cancels or share fails, we continue to standard download
          console.log("Share failed or cancelled, falling back to download");
        }
      }

      // Fallback: Standard browser download (often goes to "Files" on iOS)
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Falha ao baixar imagem:", err);
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  const photos = project.photos || [];
  const selectedIndex = selectedPhoto ? photos.findIndex(p => p.url === selectedPhoto) : -1;

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="min-h-screen bg-background px-3 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div className="mb-10 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">GoFocus</p>
            <h1 className="font-display text-3xl font-light tracking-[0.1em] text-foreground sm:text-5xl">{project.clientName}</h1>

            <div className="mt-12 flex flex-col items-center gap-6">
              <button
                onClick={handleLike}
                disabled={liked}
                className={`group relative flex items-center gap-4 overflow-hidden px-12 py-5 text-sm uppercase font-medium tracking-[0.4em] transition-all duration-700 ${liked
                  ? "border border-primary/10 bg-primary/5 text-primary/30 cursor-default scale-95"
                  : "bg-white text-black hover:bg-transparent hover:text-white border border-white hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95"
                  }`}
              >
                <Heart className={`h-5 w-5 transition-all duration-500 ${liked ? "fill-primary text-primary scale-110" : "group-hover:scale-125 group-hover:fill-black/10"}`} />
                <span>{liked ? "Projeto Curtido" : "Curtir este Projeto"}</span>
                {likeCount > 0 && (
                  <span className={`ml-4 flex h-6 items-center justify-center border-l pl-4 font-display text-lg ${liked ? "border-primary/10" : "border-black/20 group-hover:border-white/20"}`}>
                    {likeCount}
                  </span>
                )}

                {/* Subtle shine effect */}
                {!liked && <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ translateX: ["100%", "-100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                />}
              </button>

              <AnimatePresence>
                {showThanks && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-xs uppercase font-light tracking-[0.5em] text-white">✨ Obrigado por curtir! ✨</span>
                    <motion.div
                      className="h-px w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                      initial={{ width: 0 }}
                      animate={{ width: 120 }}
                      transition={{ duration: 1 }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo, index) => (
              <motion.div
                key={`${photo.url}-${index}`}
                className="group relative cursor-pointer overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                onClick={() => setSelectedPhoto(photo.url)}
              >
                <img
                  src={photo.url}
                  alt={`${project.clientName} - Foto ${index + 1}`}
                  className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>

          <motion.div className="mt-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">© {new Date().getFullYear()} GoFocus — Todos os direitos reservados</p>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              className="relative max-h-[90vh] max-w-[90vw]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto}
                alt="Foto ampliada"
                className="max-h-[85vh] max-w-[90vw] object-contain rounded"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => handleDownload(selectedPhoto, selectedIndex)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
                  title="Baixar foto"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/40"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClientPreview;
