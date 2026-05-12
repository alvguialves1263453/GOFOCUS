import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProjectBySlugAsync,
  getProjectsAsync,
  incrementLikesAsync,
  checkIfLikedAsync,
  type Project,
} from "@/lib/storage";
import { Download, X, Heart, QrCode, ChevronLeft, ChevronRight, Loader2, MessageCircle, Instagram, Share2, Calendar } from "lucide-react";
import { getOptimizedUrl } from "@/lib/imagekit";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/* ─── Image with skeleton loader ─── */
const ImageWithLoader = ({
  src,
  alt,
  className,
  onClick,
  width = 800,
  loadingMessage,
}: {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  width?: number;
  loadingMessage?: string;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden bg-[#111] ${className} ${
        !isLoaded && loadingMessage ? "min-h-[40vh] w-full" : ""
      }`}
      onClick={onClick}
    >
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#111]"
          >
            {/* Shimmer Skeleton */}
            <div className="absolute inset-0 overflow-hidden">
               <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
            </div>
            
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="flex flex-col items-center gap-4"
            >
               <Loader2 className="h-6 w-6 animate-spin text-white/20" />
               {loadingMessage && (
                 <p className="text-[9px] uppercase tracking-[0.5em] text-white/25 px-6 text-center font-medium">
                   {loadingMessage}
                 </p>
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        key={src}
        src={getOptimizedUrl(src, width)}
        alt={alt}
        initial={{ opacity: 0, filter: "blur(10px) brightness(0.5)" }}
        animate={{ 
           opacity: isLoaded ? 1 : 0, 
           filter: isLoaded ? "blur(0px) brightness(1)" : "blur(10px) brightness(0.5)",
           scale: isLoaded ? 1 : 1.05
        }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`h-full w-full object-cover ${className}`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        decoding="async"
      />

    </div>
  );
};

/* ─── Main Component ─── */
const ClientPreview = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeHearts, setActiveHearts] = useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);

  useEffect(() => {
    async function loadProject() {
      setLoading(true);
      let found = null;
      try {
        if (slug) {
          found = await getProjectBySlugAsync(slug);
        } else if (id) {
          const projects = await getProjectsAsync();
          found = projects.find((p) => p.id === id);
        }
        if (found) {
          setProject(found);
          setLikeCount(found.likes || 0);
          setNotFound(false);
          let visitorId = localStorage.getItem("gofocus_visitor_id");
          if (!visitorId) {
            visitorId = uuidv4();
            localStorage.setItem("gofocus_visitor_id", visitorId);
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
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id, slug]);

  // Handle deep links (e.g., ?photo=5)
  useEffect(() => {
    if (project?.photos && !loading) {
      const params = new URLSearchParams(window.location.search);
      const photoIndex = params.get('photo');
      if (photoIndex !== null) {
        const idx = parseInt(photoIndex);
        if (!isNaN(idx) && idx >= 0 && idx < project.photos.length) {
          setSelectedIndex(idx);
          // Clean up URL without reload
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [project, loading]);

  const spawnHearts = () => {
    const newHearts = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 180,
      y: (Math.random() - 0.5) * 90 - 40,
      size: Math.random() * 18 + 9,
    }));
    setActiveHearts(newHearts);
    setTimeout(() => setActiveHearts([]), 1600);
  };

  const handleLike = async () => {
    if (liked || !project) return;
    try {
      const visitorId =
        localStorage.getItem("gofocus_visitor_id") || uuidv4();
      if (!localStorage.getItem("gofocus_visitor_id"))
        localStorage.setItem("gofocus_visitor_id", visitorId);
      const newCount = await incrementLikesAsync(project.id, visitorId);
      setLikeCount(newCount);
      setLiked(true);
      setShowThanks(true);
      localStorage.setItem(`liked_${project.id}`, "true");
      spawnHearts();
      setTimeout(() => setShowThanks(false), 3000);
    } catch {
      toast.error("Não foi possível processar seu like agora.");
    }
  };

  const handleDownload = async (url: string) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${project?.clientName || "photo"}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Download concluído");
    } catch (error) {
      toast.error("Erro ao baixar imagem");
    } finally {
      setIsDownloading(false);
    }
  };

  const navigateGallery = (direction: number) => {
    if (selectedIndex === null || !project?.photos) return;
    const actualPhotos = project.photos.filter(p => !p.isDivider);
    const currentPhoto = project.photos[selectedIndex];
    const currentActualIndex = actualPhotos.findIndex(p => p.url === currentPhoto.url);
    
    const nextActualIndex = (currentActualIndex + direction + actualPhotos.length) % actualPhotos.length;
    const nextPhoto = actualPhotos[nextActualIndex];
    const nextIndexInFullList = project.photos.findIndex(p => p.url === nextPhoto.url);
    
    setSelectedIndex(nextIndexInFullList);
  };

  const handleShare = async (url: string, target?: 'whatsapp' | 'instagram') => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?photo=${selectedIndex}`;
      const message = `Veja esta foto incrível de ${project?.clientName}:`;

      // Try native sharing first (best experience for images)
      if (navigator.share && navigator.canShare) {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], `GoFocus-${project?.clientName}.jpg`, { type: "image/jpeg" });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Foto - ${project?.clientName}`,
            text: `${message} ${shareUrl}`,
          });
          return;
        }
      }

      // Fallbacks if native share fails or isn't available
      if (target === 'whatsapp') {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(message + "\n\n" + shareUrl)}`;
        window.open(waUrl, "_blank");
      } else if (target === 'instagram') {
        // Instagram doesn't have a direct share URL for stories from web
        // Best we can do is copy the link and tell them to post
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copiado! Poste no seu Instagram Stories.");
        setTimeout(() => {
          window.open("https://instagram.com", "_blank");
        }, 1500);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copiado para a área de transferência!");
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
      toast.error("Não foi possível compartilhar no momento.");
    }
  };

  /* ── Loading / not found states ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <p className="text-sm text-white/35 uppercase tracking-widest">
          Projeto não encontrado.
        </p>
      </div>
    );
  }

  const photos = project.photos || [];

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />

      <div className="min-h-screen bg-[#0a0a0a] text-white transition-opacity duration-500 opacity-100" style={{ touchAction: 'pan-y' }}>

        {/* ── HEADER ── */}
        <motion.header
          className="px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 border-b border-white/6 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.45em] text-white/30 font-medium mb-4">
            Portfólio GoFocus
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-normal text-white leading-tight">
            {project.clientName}
          </h1>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={liked}
              className={`relative flex items-center justify-center gap-3 px-8 py-3.5 w-full sm:w-auto text-[10px] font-semibold uppercase tracking-[0.3em] rounded-sm transition-all duration-500 overflow-hidden ${
                liked
                  ? "border border-white/10 text-white/30 cursor-default"
                  : "bg-white text-black hover:opacity-80 active:scale-95"
              }`}
            >
              <Heart
                className={`h-4 w-4 transition-all duration-500 ${
                  liked ? "fill-white/30 text-white/30" : ""
                }`}
                strokeWidth={liked ? 0 : 1.8}
              />
              <span>{liked ? "Projeto Curtido" : "Curtir Projeto"}</span>
              {likeCount > 0 && (
                <span
                  className={`ml-2 border-l pl-3 text-sm ${
                    liked ? "border-white/10" : "border-black/15"
                  }`}
                >
                  {likeCount}
                </span>
              )}

              {/* floating hearts */}
              <div className="absolute inset-0 pointer-events-none overflow-visible">
                {activeHearts.map((h) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: 0,
                      scale: [0, 1.4, 1],
                      x: h.x,
                      y: h.y - 120,
                      rotate: h.x / 2,
                    }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <Heart
                      className="fill-white text-white"
                      style={{ width: h.size, height: h.size }}
                    />
                  </motion.div>
                ))}
              </div>
            </button>

            {/* QR button */}
            <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center justify-center gap-2.5 px-6 py-3.5 w-full sm:w-auto border border-white/10 text-white/40 text-[10px] uppercase tracking-[0.3em] rounded-sm hover:border-white/25 hover:text-white/60 transition-all duration-300">
                  <QrCode className="h-4 w-4" />
                  Compartilhar via QR
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-[#111] border-white/10">
                <DialogHeader className="text-center sm:text-center">
                  <DialogTitle className="font-serif text-lg font-normal text-center tracking-wide text-white">
                    QR Code do Projeto
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-7 py-6">
                  <div className="bg-white p-5 rounded-sm shadow-2xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.href)}`}
                      alt="QR Code"
                      className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]"
                    />
                  </div>
                  <p className="text-[9px] text-center uppercase tracking-[0.3em] text-white/30 px-4 leading-relaxed">
                    Escaneie para abrir este projeto em outro dispositivo
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <AnimatePresence>
            {showThanks && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-5 text-[10px] uppercase tracking-[0.4em] text-white/50"
              >
                ✦ Obrigado pelo apoio ✦
              </motion.p>
            )}
          </AnimatePresence>
        </motion.header>

        {/* ── PHOTO GRID ── */}
        <main className="px-2 sm:px-4 py-8 sm:py-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 lg:grid-cols-3 xl:grid-cols-4">
            {photos.map((photo, index) => (
              photo.isDivider ? (
                <div key={photo.url} className="col-span-full py-16 sm:py-24 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-6 w-full max-w-2xl px-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-white/5"></div>
                    <div className="flex items-center gap-4 px-8 py-3.5 border border-white/5 bg-white/[0.02] rounded-sm backdrop-blur-sm">
                       <Calendar className="h-3.5 w-3.5 text-white/20" />
                       <span className="text-[10px] sm:text-xs font-serif italic tracking-[0.3em] text-white/50 uppercase">
                         {photo.date}
                       </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-white/10 to-white/5"></div>
                  </div>
                </div>
              ) : (
                <motion.div
                  key={`${photo.url}-${index}`}
                  className="group relative cursor-pointer overflow-hidden bg-white/3"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (index % 4) * 0.06, duration: 0.5 }}
                >
                  <ImageWithLoader
                    src={photo.url}
                    alt={`${project.clientName} - Foto ${index + 1}`}
                    width={1200}
                    className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-105 opacity-85 group-hover:opacity-100"
                    onClick={() => setSelectedIndex(index)}
                  />
                </motion.div>
              )
            ))}
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="py-10 text-center border-t border-white/6">
          <p className="text-[8px] uppercase tracking-[0.5em] text-white/18">
            © {new Date().getFullYear()} GoFocus — Evolução Constante
          </p>
        </footer>
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence initial={false}>
        {selectedIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedIndex(null)}
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-[110] flex items-center justify-between px-4 py-6 sm:px-8">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium">
                  {project.clientName}
                </span>
                <span className="text-[11px] text-white/20 font-mono mt-1">
                  {project.photos.filter((p, i) => !p.isDivider && i <= selectedIndex).length} / {project.photos.filter(p => !p.isDivider).length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(photos[selectedIndex].url);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-90 transition-all"
                  title="Compartilhar"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(photos[selectedIndex].url);
                  }}
                  disabled={isDownloading}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-90 transition-all"
                  title="Baixar para galeria"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedIndex(null)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-90 transition-all"
                  title="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Arrows (Desktop) */}
            <button
              className="absolute left-4 z-[110] hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                navigateGallery(-1);
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              className="absolute right-4 z-[110] hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                navigateGallery(1);
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Image Container with Swipe Support */}
            <motion.div
              key={selectedIndex}
              className="relative z-[105] h-full w-full flex items-center justify-center p-4 sm:p-12 cursor-grab active:cursor-grabbing"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 200 
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50;
                if (info.offset.x > swipeThreshold) {
                  navigateGallery(-1);
                } else if (info.offset.x < -swipeThreshold) {
                  navigateGallery(1);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ImageWithLoader
                src={photos[selectedIndex].url}
                width={2560}
                alt={`Foto ${selectedIndex + 1}`}
                loadingMessage="Carregando em alta fidelidade..."
                className="max-h-full w-auto max-w-full object-contain shadow-[0_0_80px_rgba(0,0,0,0.5)] select-none pointer-events-none"
              />
            </motion.div>

            {/* Mobile Swipe Indicator */}
            <div className="absolute bottom-10 left-0 right-0 z-[110] flex flex-col items-center gap-4 sm:hidden">
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(photos[selectedIndex].url, 'whatsapp');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white rounded-full font-bold text-[10px] uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Status
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(photos[selectedIndex].url, 'instagram');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white rounded-full font-bold text-[10px] uppercase tracking-wider shadow-lg active:scale-95 transition-all"
                >
                  <Instagram className="w-4 h-4" />
                  Stories
                </button>
              </div>
              <div className="px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/5">
                <p className="text-[8px] uppercase tracking-[0.3em] text-white/40">
                  Arraste para navegar
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClientPreview;
