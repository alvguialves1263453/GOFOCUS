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

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={handleLike}
                disabled={liked}
                className={`group relative flex items-center gap-3 overflow-hidden border px-10 py-4 text-xs uppercase tracking-[0.3em] transition-all duration-500 ${liked
                    ? "border-primary/20 bg-primary/5 text-primary/40 cursor-default"
                    : "border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground active:scale-95"
                  }`}
              >
                <Heart className={`h-4 w-4 transition-transform duration-500 ${liked ? "fill-primary text-primary scale-110" : "group-hover:scale-125"}`} />
                {liked ? "Curtiu" : "Curtir"}
                {likeCount > 0 && (
                  <span className={`ml-2 border-l pl-3 ${liked ? "border-primary/20" : "border-background/30 group-hover:border-foreground/30"}`}>
                    {likeCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showThanks && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    className="text-[10px] uppercase font-medium tracking-[0.4em] text-primary"
                  >
                    Obrigado por curtir! ✨
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
