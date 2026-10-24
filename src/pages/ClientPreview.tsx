import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import gsap from "gsap";
import {
  getProjectBySlugAsync,
  getProjectsAsync,
  getCategoriesAsync,
  incrementLikesAsync,
  checkIfLikedAsync,
  type Category,
  type Project,
} from "@/lib/storage";
import {
  ArrowLeft, Copy, Download, Heart, Instagram, Loader2, MessageCircle, QrCode, Share2, X, ChevronLeft, ChevronRight, ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/logo.png";
import { prefersReducedMotion, thumb } from "@/components/home/homeData";
import { INSTAGRAM_URL } from "@/components/home/HomeSections";

const PIX_KEY = "57722212000108";
const PIX_KEY_LABEL = "57.722.212/0001-08";
const PIX_QR =
  "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126360014br.gov.bcb.pix0114577222120001085204000053039865802BR5915GoFocus%20Fotogr6009Sao%20Paulo62070503***63047B4A";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });
const formatDate = (raw?: string) => {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : dateFormat.format(d);
};

/** A photo on the roll, keeping its index in project.photos (shared links use it). */
interface Frame {
  url: string;
  index: number;
  number: number;
}
type RollItem = { kind: "frame"; frame: Frame } | { kind: "tear"; label: string; key: string };

/* ─────────────────────────── Page ─────────────────────────── */

export default function ClientPreview() {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);
  const [pixOpen, setPixOpen] = useState(false);
  const roll = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        let found = slug ? await getProjectBySlugAsync(slug) : null;
        if (!found && id) found = (await getProjectsAsync()).find((p) => p.id === id) || null;
        if (!alive) return;
        if (!found) return setNotFound(true);
        setProject(found);
        setLikeCount(found.likes || 0);
        getCategoriesAsync().then((cs: Category[]) => alive && setCategory(cs.find((c) => c.id === found!.categoryId)?.name ?? null));
        const vid = localStorage.getItem("gofocus_visitor_id") || uuidv4();
        localStorage.setItem("gofocus_visitor_id", vid);
        if (localStorage.getItem(`liked_${found.id}`)) setLiked(true);
        else if (await checkIfLikedAsync(found.id, vid)) {
          setLiked(true);
          localStorage.setItem(`liked_${found.id}`, "true");
        }
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, slug]);

  const photos = useMemo(() => project?.photos ?? [], [project]);

  // The roll: frames in order, with a printed tear line wherever the album marks a date.
  const { items, frames, dates } = useMemo(() => {
    const items: RollItem[] = [];
    const frames: Frame[] = [];
    const dates: string[] = [];
    photos.forEach((p, index) => {
      if (p.isDivider) {
        const label = formatDate(p.date) ?? "";
        if (label) {
          dates.push(label);
          items.push({ kind: "tear", label, key: `tear-${index}` });
        }
      } else if (p.url) {
        const frame = { url: p.url, index, number: frames.length + 1 };
        frames.push(frame);
        items.push({ kind: "frame", frame });
      }
    });
    return { items, frames, dates };
  }, [photos]);

  // Deep link: ?photo=<index> opens that photo.
  useEffect(() => {
    if (!project) return;
    const idx = parseInt(new URLSearchParams(window.location.search).get("photo") || "");
    if (!isNaN(idx) && photos[idx] && !photos[idx].isDivider) {
      setSelected(idx);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [project, photos]);

  // Signature motion: the roll feeds out of the slot in printer steps, once.
  useEffect(() => {
    if (!roll.current || !frames.length || prefersReducedMotion()) return;
    const t = gsap.fromTo(roll.current, { y: -80, opacity: 0.001 }, { y: 0, opacity: 1, duration: 1.4, ease: "steps(10)", delay: 0.15 });
    return () => {
      t.kill();
    };
  }, [frames.length]);

  const like = async () => {
    if (liked || !project) return;
    const vid = localStorage.getItem("gofocus_visitor_id") || uuidv4();
    setLiked(true);
    setLikeCount((c) => c + 1);
    try {
      const n = await incrementLikesAsync(project.id, vid);
      setLikeCount(n);
      localStorage.setItem(`liked_${project.id}`, "true");
    } catch {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
      toast.error("Não deu para curtir agora. Tente de novo.");
    }
  };

  const shareAlbum = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: project?.clientName, text: `Álbum ${project?.clientName} da GoFocus`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link do álbum copiado");
      }
    } catch {
      /* the visitor closed the share sheet */
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-[#0B0B0B]" role="status">
        <p className="font-archivo text-[15px] text-[#C9C4BA]">Imprimindo o álbum…</p>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-[#A7AAAF] px-6 text-center text-[#141414]">
        <div>
          <h1 className="font-marquee text-[clamp(3rem,10vw,6rem)] font-black uppercase leading-[0.86]">Álbum não encontrado</h1>
          <p className="mx-auto mt-5 max-w-[40ch] font-archivo text-[17px] text-[#23252A]">O link pode estar errado ou o álbum foi retirado. Veja todas as tiras na página inicial.</p>
          <Link to="/#portfolio" className="mt-8 inline-flex rounded-full bg-[#141414] px-6 py-3.5 font-archivo text-[15px] font-semibold text-[#E9EAEC] hover:bg-black">
            Ver todas as tiras
          </Link>
        </div>
      </div>
    );
  }

  const meta = [category, `${frames.length} ${frames.length === 1 ? "foto" : "fotos"}`, dates.length ? (dates.length > 1 ? `${dates[0]} a ${dates[dates.length - 1]}` : dates[0]) : null]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-[100svh] bg-[#0B0B0B] font-archivo selection:bg-[#141414] selection:text-[#E9EAEC]">
      {/* ── Booth front: sign, details, actions ── */}
      <header className="bg-[#A7AAAF] text-[#141414]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-5 sm:px-10 sm:pt-7">
          <Link to="/" aria-label="GoFocus, página inicial" className="flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414]">
            <img src={logo} alt="" width={1024} height={1024} className="h-8 w-auto" style={{ filter: "brightness(0)" }} />
            <span className="font-marquee text-[1.5rem] font-black uppercase leading-none">GoFocus</span>
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1 text-[15px] font-medium">
            <Link to="/#portfolio" className="flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors hover:bg-[#141414]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#141414]">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todas as tiras
            </Link>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hidden rounded-full bg-[#141414] px-4 py-2 text-[#E9EAEC] transition-colors hover:bg-black sm:inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414]">
              Instagram
            </a>
          </nav>
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 sm:px-10 md:pt-16">
          <h1 className="text-balance font-marquee text-[clamp(3.2rem,9vw,6rem)] font-black uppercase leading-[0.86] tracking-[-0.01em]">{project.clientName}</h1>
          <p className="mt-4 text-[17px] text-[#23252A]">{meta}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={like}
              disabled={liked}
              aria-pressed={liked}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#141414] py-3 pl-4 pr-5 text-[15px] font-semibold text-[#E9EAEC] transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414] disabled:cursor-default"
            >
              <Heart className={`h-[18px] w-[18px] ${liked ? "fill-[#FF4D3D] text-[#FF4D3D]" : ""}`} aria-hidden="true" />
              {liked ? "Curtido" : "Curtir álbum"}
              {likeCount > 0 && <span className="border-l border-white/20 pl-2.5 tabular-nums text-[#C9CCD1]">{likeCount}</span>}
            </button>
            <ToolButton icon={Share2} label="Compartilhar" onClick={shareAlbum} />
            <ToolButton icon={QrCode} label="QR code" onClick={() => setQrOpen(true)} />
            <ToolButton icon={Copy} label="Apoiar com PIX" onClick={() => setPixOpen(true)} />
          </div>
        </div>

        {/* Print slot the roll feeds out of. */}
        <div className="mx-auto max-w-6xl px-5 sm:px-10">
          <div className="relative mx-auto h-5 w-full max-w-[940px] translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#e2e4e6,#8f9398)] p-[4px] shadow-[0_3px_6px_rgba(0,0,0,0.55)]">
            <div className="h-full w-full rounded-full bg-[linear-gradient(180deg,#000,#1b1b1d)] shadow-[inset_0_2px_3px_rgba(0,0,0,0.95)]" />
          </div>
        </div>
      </header>

      {/* ── The roll ── */}
      <main className="overflow-hidden px-3 pb-24 sm:px-10">
        <div ref={roll} className="mx-auto max-w-[900px] bg-[#FBFAF7] px-3 pb-10 pt-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] sm:px-6 sm:pt-8">
          <h2 className="sr-only">Fotos do álbum</h2>
          <ol className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3">
            {items.map((item) =>
              item.kind === "tear" ? (
                <li key={item.key} className="col-span-full my-3 flex items-center gap-4 sm:my-5" aria-label={`Fotos de ${item.label}`}>
                  <span aria-hidden="true" className="h-0 flex-1 border-t-2 border-dashed border-[#B9B5AD]" />
                  <span className="font-marquee text-[1.25rem] font-extrabold uppercase leading-none text-[#141414] sm:text-[1.5rem]">{item.label}</span>
                  <span aria-hidden="true" className="h-0 flex-1 border-t-2 border-dashed border-[#B9B5AD]" />
                </li>
              ) : (
                <li key={item.frame.index}>
                  <button
                    type="button"
                    onClick={() => setSelected(item.frame.index)}
                    aria-label={`Abrir foto ${item.frame.number} de ${frames.length}`}
                    className="group block w-full overflow-hidden bg-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414]"
                  >
                    <img
                      src={thumb(item.frame.url, 520)}
                      alt=""
                      width={520}
                      height={650}
                      loading={item.frame.number <= 6 ? "eager" : "lazy"}
                      decoding="async"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                    />
                  </button>
                </li>
              )
            )}
          </ol>

          {/* Printed foot of the roll. */}
          <div className="mt-10 border-t-2 border-dashed border-[#B9B5AD] pt-8 text-center text-[#141414]">
            <p className="font-marquee text-[1.9rem] font-extrabold uppercase leading-none">{project.clientName}</p>
            <p className="mt-2 text-[14px] text-[#55524C]">
              {frames.length} fotos, GoFocus, cabine de fotos
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={like}
                disabled={liked}
                className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-5 py-3 text-[15px] font-semibold text-[#E9EAEC] transition-colors hover:bg-black disabled:cursor-default"
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-[#FF4D3D] text-[#FF4D3D]" : ""}`} aria-hidden="true" />
                {liked ? "Você curtiu este álbum" : "Curtir álbum"}
              </button>
              <Link to="/#portfolio" className="rounded-full px-5 py-3 text-[15px] font-semibold ring-2 ring-[#141414] transition-colors hover:bg-[#141414] hover:text-[#E9EAEC]">
                Ver outras tiras
              </Link>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold ring-2 ring-[#141414] transition-colors hover:bg-[#141414] hover:text-[#E9EAEC]">
                <Instagram className="h-4 w-4" aria-hidden="true" /> Falar no Instagram
              </a>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-[13px] text-[#8F8A80]">© {new Date().getFullYear()} GoFocus. Todos os direitos reservados.</p>
      </main>

      {/* ── QR code ── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm border-0 bg-[#A7AAAF] text-[#141414]">
          <DialogHeader>
            <DialogTitle className="font-marquee text-[1.8rem] font-black uppercase leading-none">QR code do álbum</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-[3px] bg-[#FBFAF7] p-4 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)]">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(window.location.href)}`} alt={`QR code para abrir o álbum ${project.clientName}`} width={200} height={200} className="h-[200px] w-[200px]" />
            </div>
            <p className="text-center text-[15px] text-[#23252A]">Aponte a câmera do celular para abrir este álbum.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PIX support ── */}
      <Dialog open={pixOpen} onOpenChange={setPixOpen}>
        <DialogContent className="max-w-sm border-0 bg-[#A7AAAF] text-[#141414]">
          <DialogHeader>
            <DialogTitle className="font-marquee text-[1.8rem] font-black uppercase leading-none">Apoie nosso trabalho</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="rounded-[3px] bg-[#FBFAF7] p-4 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)]">
              <img src={PIX_QR} alt="QR code PIX da GoFocus" width={200} height={200} className="h-[200px] w-[200px]" />
            </div>
            <div className="text-center">
              <p className="text-[14px] text-[#23252A]">Chave PIX (CNPJ)</p>
              <p className="mt-1 text-[17px] font-semibold tabular-nums">{PIX_KEY_LABEL}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(PIX_KEY);
                toast.success("Chave PIX copiada");
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#141414] py-3.5 text-[15px] font-semibold text-[#E9EAEC] hover:bg-black"
            >
              <Copy className="h-4 w-4" aria-hidden="true" /> Copiar chave PIX
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {selected !== null && (
          <Viewer
            key="viewer"
            album={project.clientName}
            frames={frames}
            photos={photos}
            selected={selected}
            onSelect={setSelected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolButton({ icon: Icon, label, onClick }: { icon: typeof Share2; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[15px] font-semibold text-[#141414] ring-2 ring-[#141414]/80 transition-colors hover:bg-[#141414] hover:text-[#E9EAEC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414]"
    >
      <Icon className="h-4 w-4" aria-hidden="true" /> {label}
    </button>
  );
}

/* ─────────────────────────── Full-screen viewer ─────────────────────────── */

function Viewer({
  album,
  frames,
  photos,
  selected,
  onSelect,
  onClose,
}: {
  album: string;
  frames: Frame[];
  photos: Project["photos"];
  selected: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const position = frames.findIndex((f) => f.index === selected);
  const current = frames[position];

  const go = useCallback(
    (dir: number) => {
      if (!frames.length) return;
      onSelect(frames[(position + dir + frames.length) % frames.length].index);
    },
    [frames, position, onSelect]
  );

  // Keyboard, scroll lock, and preloading the neighbours.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    [1, -1].forEach((d) => {
      const f = frames[(position + d + frames.length) % frames.length];
      if (f) new Image().src = thumb(f.url, 2000);
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev;
    };
  }, [go, onClose, frames, position]);

  if (!current) return null;
  const photo = photos[selected];

  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await (await fetch(photo.url)).blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `${album}-${current.number}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(u);
      toast.success("Foto baixada");
    } catch {
      toast.error("Não deu para baixar. Tente de novo.");
    } finally {
      setDownloading(false);
    }
  };

  const share = async (target?: "whatsapp" | "instagram") => {
    const link = `${window.location.origin}${window.location.pathname}?photo=${selected}`;
    const text = `Olha essa foto de ${album}, da GoFocus:`;
    try {
      if (!target && navigator.share) {
        await navigator.share({ title: album, text, url: link });
      } else if (target === "whatsapp") {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n${link}`)}`, "_blank");
      } else {
        await navigator.clipboard.writeText(link);
        toast.success(target === "instagram" ? "Link copiado. Cole no seu Stories." : "Link da foto copiado");
        if (target === "instagram") setTimeout(() => window.open("https://instagram.com", "_blank"), 1200);
      }
    } catch {
      /* closed the share sheet */
    }
  };

  const iconButton =
    "grid h-11 w-11 place-items-center rounded-full bg-[#1c1c1c] text-[#E9EAEC] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-[#2a2a2a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7AAAF]";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${current.number} de ${frames.length}, ${album}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate font-marquee text-[1.35rem] font-extrabold uppercase leading-none text-[#E9EAEC]">{album}</p>
          <p className="mt-1 text-[13px] tabular-nums text-[#A7AAAF]">
            {String(current.number).padStart(2, "0")} / {String(frames.length).padStart(2, "0")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => share()} aria-label="Compartilhar foto" className={iconButton}>
            <Share2 className="h-[18px] w-[18px]" />
          </button>
          <button type="button" onClick={download} disabled={downloading} aria-label="Baixar foto" className={iconButton}>
            {downloading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Download className="h-[18px] w-[18px]" />}
          </button>
          <button type="button" onClick={onClose} aria-label="Fechar foto" className={iconButton}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <PinchZoom key={current.url} src={current.url} onSwipe={go} onZoomChange={setZoomed} />
        <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className={`${iconButton} absolute left-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 sm:grid sm:left-6`}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Próxima foto" className={`${iconButton} absolute right-3 top-1/2 hidden h-12 w-12 -translate-y-1/2 sm:grid sm:right-6`}>
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {!zoomed && (
        <div className="flex flex-col items-center gap-3 px-4 pb-5 pt-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => share("whatsapp")} className="inline-flex items-center gap-2 rounded-full bg-[#1c1c1c] px-4 py-2.5 text-[14px] font-semibold text-[#E9EAEC] hover:bg-[#2a2a2a]">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Enviar no WhatsApp
            </button>
            <button type="button" onClick={() => share("instagram")} className="inline-flex items-center gap-2 rounded-full bg-[#1c1c1c] px-4 py-2.5 text-[14px] font-semibold text-[#E9EAEC] hover:bg-[#2a2a2a]">
              <Instagram className="h-4 w-4" aria-hidden="true" /> Postar nos Stories
            </button>
          </div>
          <p className="text-[13px] text-[#8F8A80] sm:hidden">Deslize para o lado para ver a próxima</p>
        </div>
      )}
    </motion.div>
  );
}

/* Pinch / double-tap zoom and swipe, for touch; wheel-free so the page never fights it. */
function PinchZoom({ src, onSwipe, onZoomChange }: { src: string; onSwipe: (d: number) => void; onZoomChange: (z: boolean) => void }) {
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const lastTap = useRef(0);
  const startDist = useRef(0);
  const startScale = useRef(1);

  useEffect(() => onZoomChange(zoomed), [zoomed, onZoomChange]);

  const reset = () => {
    scale.set(1);
    x.set(0);
    y.set(0);
    setZoomed(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      startDist.current = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
      startScale.current = scale.get();
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        if (scale.get() > 1) reset();
        else {
          scale.set(2.5);
          setZoomed(true);
        }
      }
      lastTap.current = now;
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const d = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
    const s = Math.max(1, Math.min(startScale.current * (d / startDist.current), 5));
    scale.set(s);
    setZoomed(s > 1.05);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center" onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
      {/* The roll's copy is cached: show it at once, the large one fades over it. */}
      <motion.div
        style={{ scale, x, y }}
        drag={zoomed ? true : "x"}
        dragConstraints={zoomed ? undefined : { left: 0, right: 0 }}
        dragElastic={zoomed ? 0.1 : 0.5}
        onDragEnd={(_, info) => {
          if (!zoomed && Math.abs(info.offset.x) > 50) onSwipe(info.offset.x > 0 ? -1 : 1);
        }}
        className="relative flex h-full w-full items-center justify-center px-2 sm:px-20"
      >
        <img src={thumb(src, 520)} alt="" className={`pointer-events-none max-h-full max-w-full select-none object-contain ${loaded ? "hidden" : ""}`} draggable={false} />
        <img
          src={thumb(src, 2000)}
          alt=""
          onLoad={() => setLoaded(true)}
          className={`pointer-events-none max-h-full max-w-full select-none object-contain ${loaded ? "" : "absolute opacity-0"}`}
          draggable={false}
        />
      </motion.div>
      {zoomed && (
        <button type="button" onClick={reset} className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1c1c1c] px-4 py-2.5 text-[14px] font-semibold text-[#E9EAEC]">
          <ZoomOut className="h-4 w-4" aria-hidden="true" /> Tirar o zoom
        </button>
      )}
    </div>
  );
}
