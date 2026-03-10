import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProjectBySlugAsync, getProjectsAsync, incrementLikesAsync, checkIfLikedAsync, type Project } from "@/lib/storage";
import { Loader2, Download, X, Heart, QrCode } from "lucide-react";
import { getOptimizedUrl } from "@/lib/imagekit";
import { toast } from "sonner";

import { v4 as uuidv4 } from 'uuid';
import LiquidBackground from "@/components/LiquidBackground";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ImageWithLoader = ({ src, alt, className, onClick, width = 800 }: { src: string; alt: string; className?: string; onClick?: () => void; width?: number }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`} onClick={onClick}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-white/10" />
        </div>
      )}
      <motion.img
        src={getOptimizedUrl(src, width)}
        alt={alt}
        className={`h-full w-full object-cover ${className} ${!isLoaded ? "opacity-0" : "opacity-100"}`}
        onLoad={() => setIsLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};


const ClientPreview = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isQrOpen, setIsQrOpen] = useState(false);

  useEffect(() => {
    async function loadProject() {
      setLoading(true);
      let found = null;
      try {
        if (slug) {
          found = await getProjectBySlugAsync(slug);
        } else if (id) {
          const projects = await getProjectsAsync();
          found = projects.find(p => p.id === id);
        }
        if (found) {
          setProject(found);
          setLikeCount(found.likes || 0);
          setNotFound(false);
          let visitorId = localStorage.getItem('gofocus_visitor_id');
          if (!visitorId) {
            visitorId = uuidv4();
            localStorage.setItem('gofocus_visitor_id', visitorId);
          }
          const hasLikedLocal = localStorage.getItem(`liked_${found.id}`);
          if (hasLikedLocal) {
            setLiked(true);
          } else {
            const hasLikedServer = await checkIfLikedAsync(found.id, visitorId);
            if (hasLikedServer) {
              setLiked(true);
              localStorage.setItem(`liked_${found.id}`, "true");
            }
          }
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
      const visitorId = localStorage.getItem('gofocus_visitor_id') || uuidv4();
      if (!localStorage.getItem('gofocus_visitor_id')) {
        localStorage.setItem('gofocus_visitor_id', visitorId);
      }
      const newCount = await incrementLikesAsync(project.id, visitorId);
      setLikeCount(newCount);
      setLiked(true);
      setShowThanks(true);
      localStorage.setItem(`liked_${project.id}`, "true");
      spawnHearts();
      setTimeout(() => setShowThanks(false), 3000);
    } catch (err: any) {
      console.error("Erro completo ao curtir:", err);
      toast.error("Não foi possível processar seu like agora.");
    }
  };

  const [activeHearts, setActiveHearts] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const spawnHearts = () => {
    const newHearts = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 100 - 50,
      size: Math.random() * 20 + 10
    }));
    setActiveHearts(newHearts);
    setTimeout(() => setActiveHearts([]), 1500);
  };

  const handleDownload = async (url: string, index: number) => {
    const fileName = `${project?.clientName || "foto"}-${index + 1}.jpg`;

    // Web Share API fallback for mobile (better for iOS Photos app)
    if (navigator.share) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: "image/jpeg" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: project?.clientName || "Foto GoFocus",
            text: "Salvar foto na galeria"
          });
          return;
        }
      } catch (err) {
        console.log("Falha ao usar Web Share:", err);
      }
    }

    // Default download logic (fallback)
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LiquidBackground />
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LiquidBackground />
        <p className="text-sm text-white/40 uppercase tracking-widest">Projeto não encontrado.</p>
      </div>
    );
  }

  const photos = project.photos || [];
  const selectedIndex = selectedPhoto ? photos.findIndex(p => p.url === selectedPhoto) : -1;

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="min-h-screen relative px-3 py-10 sm:px-6 sm:py-24">
        <LiquidBackground />
        <div className="mx-auto max-w-6xl relative z-10">
          <motion.div className="mb-20 text-center flex flex-col items-center gap-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="space-y-4 max-w-sm sm:max-w-none">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-primary font-bold">Portfólio GoFocus</p>
              <h1 className="font-display text-4xl sm:text-7xl font-light tracking-tight text-white/90 leading-tight px-4">{project.clientName}</h1>
            </div>

            <div className="flex flex-col items-center gap-10 w-full max-w-sm sm:max-w-none">
              <button
                onClick={handleLike}
                disabled={liked}
                className={`group relative flex items-center justify-center gap-6 overflow-hidden px-8 py-5 sm:px-14 sm:py-6 text-[10px] uppercase font-bold tracking-[0.4em] transition-all duration-700 rounded-full w-full sm:w-auto ${liked
                  ? "glass-liquid border-primary/20 text-primary/40 cursor-default scale-95"
                  : "bg-white text-black glow-border shadow-2xl active:scale-95"
                  }`}
              >
                <Heart className={`h-5 w-5 transition-all duration-500 ${liked ? "fill-primary text-primary scale-110" : "group-hover:scale-125"}`} strokeWidth={liked ? 0 : 2} />
                <span>{liked ? "Projeto Curtido" : "Curtir Projeto"}</span>
                {likeCount > 0 && (
                  <span className={`ml-4 flex h-6 items-center justify-center border-l pl-4 font-display text-xl ${liked ? "border-primary/20" : "border-black/10"}`}>
                    {likeCount}
                  </span>
                )}

                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {activeHearts.map((h) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        scale: [0, 1.5, 1],
                        x: h.x,
                        y: h.y - 150,
                        rotate: h.x / 2
                      }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      <Heart
                        className="fill-primary text-primary"
                        style={{ width: h.size, height: h.size }}
                      />
                    </motion.div>
                  ))}
                </div>
              </button>

              <AnimatePresence>
                {showThanks && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <span className="text-[10px] uppercase font-bold tracking-[0.5em] text-primary">✨ Obrigado pelo apoio ✨</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
                <DialogTrigger asChild>
                  <button
                    className="flex items-center gap-3 text-[9px] uppercase tracking-[0.4em] text-white/30 hover:text-white transition-all duration-500 glass-liquid px-6 py-3 rounded-full border-white/5"
                  >
                    <QrCode className="h-4 w-4" />
                    Compartilhar via QR
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md glass-liquid border-white/10 glow-border">
                  <DialogHeader>
                    <DialogTitle className="font-display text-xl font-light tracking-[0.2em] text-center uppercase text-white/90">QR Code do Projeto</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center space-y-8 py-8">
                    <div className="bg-white p-6 rounded-[2rem] shadow-[0_30px_60px_rgba(255,255,255,0.1)]">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}`}
                        alt="QR Code"
                        className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px]"
                      />
                    </div>
                    <p className="text-[9px] text-center uppercase tracking-[0.3em] text-white/40 px-6 leading-relaxed">
                      Escaneie para visualizar esta experiência em outro dispositivo
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {photos.map((photo, index) => (
              <motion.div
                key={`${photo.url}-${index}`}
                className="group relative cursor-pointer overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] glass-liquid border-white/5 shadow-2xl"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 4) * 0.1, duration: 0.8 }}
                whileHover={{ y: -8 }}
              >
                <ImageWithLoader
                  src={photo.url}
                  alt={`${project.clientName} - Foto ${index + 1}`}
                  width={1200}
                  className="w-full aspect-[4/5] object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  onClick={() => setSelectedPhoto(photo.url)}
                />


              </motion.div>
            ))}
          </div>

          <motion.div className="mt-24 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
            <p className="text-[8px] uppercase tracking-[0.5em] text-white/15">
              © {new Date().getFullYear()} GoFocus Narrative Interiors — Evolução Constante
            </p>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              className="relative max-h-[90vh] max-w-[95vw]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ImageWithLoader
                src={selectedPhoto}
                width={2560}
                alt="Foto ampliada"
                className="max-h-[85vh] max-w-[95vw] object-contain rounded-[2rem] shadow-2xl"
              />


              <div className="absolute top-6 right-6 flex gap-4">
                <button
                  onClick={() => handleDownload(selectedPhoto, selectedIndex)}
                  className="flex h-12 w-12 items-center justify-center rounded-full glass-liquid glow-border text-white transition-all hover:scale-110"
                  title="Baixar foto"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="flex h-12 w-12 items-center justify-center rounded-full glass-liquid glow-border text-white transition-all hover:scale-110"
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
