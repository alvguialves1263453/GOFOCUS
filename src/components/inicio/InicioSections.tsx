import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Instagram } from "lucide-react";
import logoStar from "@/assets/logo-star.png";
import { INSTAGRAM_URL } from "@/components/home/HomeSections";
import { coverOf, realPhotos, thumb, type EventoResumo } from "@/components/home/homeData";
import type { Category, Project } from "@/lib/storage";
import { VIDEOS } from "./videos";
import "./inicio.css";

const container = "mx-auto w-full max-w-[1400px] px-5 sm:px-10";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

/** Fades a block up the first time it scrolls into view. Visible by default if JS or IO is missing. */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // already on screen: never hide it
    setHidden(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-hidden={hidden} className={`inicio-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar                                                             */
/* ------------------------------------------------------------------ */

export function TopBar() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${solid ? "bg-[#0a0a0a]/95 border-b border-white/10" : "bg-transparent"}`}
    >
      <div className={`${container} flex h-16 items-center justify-between md:h-20`}>
        <a href="#topo" className={`flex items-center gap-3 ${focusRing}`} aria-label="GoFocus, início">
          <img src={logoStar} alt="" width={256} height={262} className="h-7 w-auto" />
          <span className="font-display text-[1.35rem] font-semibold tracking-tight">GoFocus</span>
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-9 font-body text-[14px] text-white/70 md:flex">
          <a href="#servicos" className="transition-colors hover:text-white">Serviços</a>
          <a href="#videos" className="transition-colors hover:text-white">Vídeos</a>
          <a href="#portfolio" className="transition-colors hover:text-white">Trabalhos</a>
          <Link to="/eventos" className="transition-colors hover:text-white">Eventos</Link>
        </nav>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 font-body text-[14px] font-medium transition-colors hover:bg-white hover:text-black ${focusRing}`}
        >
          <Instagram className="h-4 w-4" aria-hidden="true" />
          <span>Contato</span>
        </a>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero: the big headline builds letter by letter, photos run below   */
/* ------------------------------------------------------------------ */

const HEADLINE: { text: string; italic?: boolean }[] = [
  { text: "Sua" },
  { text: "marca" },
  { text: "em" },
  { text: "movimento.", italic: true },
];

function Headline() {
  let i = 0;
  return (
    <h1 className="font-display text-[clamp(3.4rem,10vw,8.5rem)] font-medium leading-[0.92] tracking-[-0.035em] text-balance">
      <span className="sr-only">Sua marca em movimento.</span>
      <span aria-hidden="true">
        {HEADLINE.map((w, wi) => (
          <span key={wi}>
            <span className={`inicio-word ${w.italic ? "italic font-normal" : ""}`}>
              {[...w.text].map((ch) => (
                <span key={i} className="inicio-char" style={{ ["--i" as string]: i++ }}>
                  {ch}
                </span>
              ))}
            </span>
            {wi < HEADLINE.length - 1 && " "}
          </span>
        ))}
      </span>
    </h1>
  );
}

/** Albums passing by one after another: name on top, then its photos whole (no crop). */
function AlbumMarquee({ projects, speed }: { projects: Project[]; speed: number }) {
  const groups = useMemo(
    () =>
      projects.slice(0, 8).map((p) => {
        const cover = coverOf(p);
        const rest = realPhotos(p).filter((ph) => ph.url !== cover?.url);
        const step = Math.max(1, Math.floor(rest.length / 3));
        const picks = [cover, ...rest.filter((_, i) => i % step === 0)].filter(Boolean).slice(0, 4);
        return { id: p.id, name: p.clientName, photos: picks.map((ph) => ph!.url) };
      }),
    [projects],
  );
  const photoH = "h-[clamp(200px,26vw,380px)]";
  if (!groups.length) return <div className={`${photoH} mt-10`} />;

  return (
    <div className="inicio-marquee-wrap overflow-hidden">
      <div className="inicio-marquee" style={{ ["--speed" as string]: `${speed}s` }}>
        {[0, 1].map((copy) =>
          groups.map((g) => (
            <Link
              key={`${copy}-${g.id}`}
              to={`/projeto/${g.id}`}
              tabIndex={copy ? -1 : undefined}
              aria-hidden={copy ? true : undefined}
              aria-label={copy ? undefined : `Abrir o álbum ${g.name}`}
              className={`group mr-10 block shrink-0 md:mr-16 ${focusRing}`}
            >
              <span className="mb-3 flex items-center gap-2 font-body text-[14px] text-white/80 transition-colors group-hover:text-white">
                <span className="font-display text-[1.25rem] italic">{g.name}</span>
                <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
              </span>
              <span className="flex gap-2 md:gap-3">
                {g.photos.map((url, i) => (
                  <img
                    key={url}
                    src={thumb(url, 900)}
                    alt=""
                    loading={copy === 0 && i < 4 ? "eager" : "lazy"}
                    decoding="async"
                    className={`${photoH} w-auto max-w-none shrink-0 rounded-sm bg-[#141414] object-contain`}
                  />
                ))}
              </span>
            </Link>
          )),
        )}
      </div>
    </div>
  );
}

export function Hero({ projects }: { projects: Project[] }) {

  return (
    <section id="topo" className="relative flex flex-col overflow-hidden pt-24 md:pt-28">
      <div className={`${container} relative`}>
        <p className="inicio-fade mb-6 flex items-center gap-3 font-body text-[13px] uppercase tracking-[0.22em] text-white/60" style={{ ["--d" as string]: "0.1s" }}>
          <img src={logoStar} alt="" width={256} height={262} className="inicio-spin h-4 w-auto" />
          Produtora audiovisual
        </p>
        <Headline />
        <div className="mt-8 flex flex-col gap-8 md:mt-8 md:flex-row md:items-end md:justify-between">
          <p className="inicio-fade max-w-[46ch] font-body text-[17px] leading-relaxed text-white/70 md:text-[19px]" style={{ ["--d" as string]: "1.2s" }}>
            Vídeos e marketing para empresas, filmagem de eventos e casamentos, e fotografia.
          </p>
          <div className="inicio-fade flex flex-wrap gap-3" style={{ ["--d" as string]: "1.4s" }}>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-4 font-body text-[15px] font-semibold text-black transition-transform duration-300 hover:-translate-y-0.5 ${focusRing}`}
            >
              <Instagram className="h-5 w-5" aria-hidden="true" /> Falar no Instagram
            </a>
            <a
              href="#portfolio"
              className={`inline-flex items-center gap-2.5 rounded-full border border-white/30 px-7 py-4 font-body text-[15px] font-medium transition-colors hover:border-white ${focusRing}`}
            >
              Ver trabalhos <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className="inicio-fade mt-10 pb-6 md:mt-12" style={{ ["--d" as string]: "1.7s" }}>
        <AlbumMarquee projects={projects} speed={150} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Services                                                            */
/* ------------------------------------------------------------------ */

const SERVICES = [
  {
    title: "Vídeos e marketing para empresas",
    text: "Conteúdo para redes sociais, vídeos institucionais e campanhas. Da ideia à edição final, para a sua marca aparecer e vender.",
    tag: "Empresas",
  },
  {
    title: "Eventos e casamentos",
    text: "Casamentos, aniversários, festas e eventos de empresa. Filmamos e fotografamos o seu dia do começo ao fim.",
    tag: "Eventos",
  },
  {
    title: "Fotografia",
    text: "Ensaios, produtos, restaurantes e esportes. Fotos tratadas com cuidado e entregues numa galeria online.",
    tag: "Fotos",
  },
];

export function Services() {
  return (
    <section id="servicos" className="py-24 md:py-36">
      <div className={container}>
        <Reveal>
          <p className="font-body text-[13px] uppercase tracking-[0.22em] text-white/50">O que a gente faz</p>
        </Reveal>
      </div>
      <div className="mt-10 border-t border-white/15 md:mt-14">
        {SERVICES.map((s, i) => (
          <a
            key={s.title}
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inicio-service block border-b border-white/15 transition-colors duration-500 ${focusRing}`}
          >
            <Reveal delay={i * 80} className={`${container} grid gap-4 py-10 md:grid-cols-[minmax(0,7fr)_minmax(0,4fr)_auto] md:items-center md:gap-10 md:py-14`}>
              <h2 className="font-display text-[clamp(2.2rem,5.4vw,5rem)] font-medium leading-[0.98] tracking-[-0.02em] text-balance">
                {s.title}
              </h2>
              <p className="inicio-service-text max-w-[42ch] font-body text-[16px] leading-relaxed text-white/60 transition-colors duration-500">
                {s.text}
              </p>
              <ArrowRight className="inicio-arrow hidden h-10 w-10 md:block" strokeWidth={1.25} aria-hidden="true" />
            </Reveal>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Moving word band                                                    */
/* ------------------------------------------------------------------ */

const BAND_WORDS = ["Vídeo", "Marketing", "Eventos", "Casamentos", "Fotografia"];

export function WordBand() {
  const words = [...BAND_WORDS, ...BAND_WORDS];
  return (
    <div className="overflow-hidden border-y border-white/15 py-8 md:py-12" aria-hidden="true">
      <div className="inicio-marquee items-center" style={{ ["--speed" as string]: "40s" }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {words.map((w, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span
                  className={`px-6 font-display text-[clamp(3.5rem,10vw,9rem)] leading-none tracking-[-0.03em] md:px-10 ${i % 2 ? "inicio-outline italic" : "font-medium"}`}
                >
                  {w}
                </span>
                <img src={logoStar} alt="" width={256} height={262} className="h-8 w-auto opacity-80 md:h-12" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Videos                                                              */
/* ------------------------------------------------------------------ */

export function Videos() {
  return (
    <section id="videos" className="py-24 md:py-36">
      <div className={container}>
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-[clamp(3rem,8vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.03em]">
            Vídeos
          </h2>
          <p className="max-w-[44ch] font-body text-[17px] leading-relaxed text-white/60">
            Vídeos para marcas, eventos e casamentos, pensados para prender a atenção nos primeiros segundos.
          </p>
        </Reveal>

        {VIDEOS.length > 0 ? (
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VIDEOS.map((v, i) => (
              <Reveal key={v.youtubeId} delay={i * 80}>
                <figure>
                  <div className="aspect-video overflow-hidden bg-[#141414]">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?rel=0&modestbranding=1`}
                      title={v.title}
                      loading="lazy"
                      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      className="h-full w-full"
                    />
                  </div>
                  <figcaption className="mt-3 font-body text-[15px] text-white/70">{v.title}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-14">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col items-start gap-6 border border-white/15 p-8 transition-colors duration-500 hover:bg-white hover:text-black md:flex-row md:items-center md:justify-between md:p-12 ${focusRing}`}
            >
              <span className="font-display text-[clamp(1.8rem,3.6vw,3rem)] leading-tight">
                Assista aos nossos vídeos no Instagram
              </span>
              <span className="inline-flex items-center gap-2 font-body text-[15px] font-semibold">
                <Instagram className="h-5 w-5" aria-hidden="true" /> @gofocus.br
                <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Albums                                                              */
/* ------------------------------------------------------------------ */

export function Albums({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const [active, setActive] = useState<string | null>(null);
  const usedCategories = useMemo(
    () => categories.filter((c) => projects.some((p) => p.categoryId === c.id)),
    [categories, projects],
  );
  const shown = active ? projects.filter((p) => p.categoryId === active) : projects;
  const catName = (id?: string) => categories.find((c) => c.id === id)?.name;

  if (!projects.length) return null;

  return (
    <section id="portfolio" className="scroll-mt-20 bg-[#f5f4f0] py-24 text-[#0a0a0a] md:py-36">
      <div className={container}>
        <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-[clamp(3rem,8vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.03em]">
            Trabalhos
          </h2>
          {usedCategories.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
              {[{ id: null as string | null, name: "Todos" }, ...usedCategories].map((c) => (
                <button
                  key={c.id ?? "todos"}
                  type="button"
                  onClick={() => setActive(c.id)}
                  aria-pressed={active === c.id}
                  className={`rounded-full border px-4 py-2 font-body text-[14px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${active === c.id ? "border-black bg-black text-white" : "border-black/20 hover:border-black"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 sm:gap-y-12 lg:grid-cols-3">
          {shown.map((p, i) => {
            const cover = coverOf(p);
            const count = realPhotos(p).length;
            return (
              <Reveal key={p.id} delay={(i % 3) * 90}>
                <Link
                  to={`/projeto/${p.id}`}
                  className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-[#dcdbd6]">
                    {cover && (
                      <img
                        src={thumb(cover.url, 800)}
                        alt=""
                        width={800}
                        height={1000}
                        loading="lazy"
                        decoding="async"
                        className="inicio-bw h-full w-full object-cover group-hover:scale-[1.05]"
                      />
                    )}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-[1.15rem] leading-tight sm:text-[1.6rem]">{p.clientName}</h3>
                    <ArrowRight className="h-5 w-5 shrink-0 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
                  </div>
                  <p className="mt-1 font-body text-[13px] text-black/55 sm:text-[14px]">
                    {[catName(p.categoryId), `${count} fotos`].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Event galleries                                                     */
/* ------------------------------------------------------------------ */

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });

export function Events({ eventos }: { eventos: EventoResumo[] }) {
  if (!eventos.length) return null;
  return (
    <section className="py-24 md:py-36">
      <div className={`${container} flex flex-col gap-6 md:flex-row md:items-end md:justify-between`}>
        <Reveal>
          <h2 className="font-display text-[clamp(2.6rem,6vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.03em]">
            Galerias de eventos
          </h2>
          <p className="mt-5 max-w-[46ch] font-body text-[17px] leading-relaxed text-white/60">
            Esteve num evento que a gente cobriu? Encontre a galeria e veja todas as fotos.
          </p>
        </Reveal>
        <Link
          to="/eventos"
          className={`inline-flex w-fit items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-body text-[15px] font-medium transition-colors hover:bg-white hover:text-black ${focusRing}`}
        >
          Ver todos os eventos <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:px-10 [&::-webkit-scrollbar]:hidden">
        {eventos.map((ev) => (
          <Link key={ev.id} to={`/eventos/${ev.id}`} className={`group w-[min(80vw,440px)] shrink-0 snap-start ${focusRing}`}>
            <div className="aspect-[4/3] overflow-hidden bg-[#141414]">
              {ev.capa_url && (
                <img
                  src={thumb(ev.capa_url, 900)}
                  alt=""
                  width={900}
                  height={675}
                  loading="lazy"
                  decoding="async"
                  className="inicio-bw h-full w-full object-cover group-hover:scale-[1.05]"
                />
              )}
            </div>
            <p className="mt-4 truncate font-display text-[1.5rem]">{ev.titulo}</p>
            <p className="mt-1 font-body text-[14px] text-white/55">
              {[ev.data_evento ? dateFormat.format(new Date(ev.data_evento)) : null, ev.local].filter(Boolean).join(" · ") || "Galeria aberta"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Contact + footer                                                    */
/* ------------------------------------------------------------------ */

export function Contact() {
  return (
    <section className="relative overflow-hidden border-t border-white/15 py-28 md:py-44">
      <img
        src={logoStar}
        alt=""
        width={256}
        height={262}
        className="inicio-spin pointer-events-none absolute -right-24 top-1/2 h-[520px] w-auto -translate-y-1/2 opacity-[0.06] md:-right-10"
        aria-hidden="true"
      />
      <div className={`${container} relative`}>
        <Reveal>
          <h2 className="max-w-[14ch] font-display text-[clamp(3rem,8.5vw,8rem)] font-medium leading-[0.92] tracking-[-0.03em] text-balance">
            Vamos colocar sua marca <span className="italic font-normal">em movimento?</span>
          </h2>
        </Reveal>
        <Reveal delay={120} className="mt-12 flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex w-fit items-center gap-3 rounded-full bg-white px-8 py-5 font-body text-[17px] font-semibold text-black transition-transform duration-300 hover:-translate-y-1 ${focusRing}`}
          >
            <Instagram className="h-5 w-5" aria-hidden="true" /> Chamar no Instagram
          </a>
          <p className="max-w-[40ch] font-body text-[16px] leading-relaxed text-white/60">
            Conte o que você precisa no direct do @gofocus.br e a gente responde por lá.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/15 py-12">
      <div className={`${container} flex flex-col gap-8 md:flex-row md:items-center md:justify-between`}>
        <div className="flex items-center gap-3">
          <img src={logoStar} alt="" width={256} height={262} className="h-7 w-auto" />
          <span className="font-display text-[1.35rem] font-semibold">GoFocus</span>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-8 gap-y-3 font-body text-[14px] text-white/60">
          <a href="#servicos" className="transition-colors hover:text-white">Serviços</a>
          <a href="#portfolio" className="transition-colors hover:text-white">Trabalhos</a>
          <Link to="/eventos" className="transition-colors hover:text-white">Eventos</Link>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Instagram</a>
          <Link to="/admin" className="transition-colors hover:text-white">Admin</Link>
        </nav>
      </div>
      <p className={`${container} mt-10 font-body text-[13px] text-white/40`}>
        © {new Date().getFullYear()} GoFocus. Todos os direitos reservados.
      </p>
    </footer>
  );
}
