import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Instagram, MessageCircle } from "lucide-react";
import logoStar from "@/assets/logo-star.png";
import { supabase } from "@/lib/supabase";
import { instagramEmbed, type LinkDestaque } from "@/lib/adminStore";
import { coverOf, thumb, useHomeData } from "@/components/home/homeData";
import { INSTAGRAM_URL } from "@/components/home/HomeSections";
import type { Project } from "@/lib/storage";
import "@/components/inicio/inicio.css";

/* Link-in-bio in the home's style: black and white, one column, real work below the links. */
const BANLEK_URL = "https://banlek.com/GOFOCUS";
const DM_URL = "https://ig.me/m/gofocus.br";
const EASE = [0.16, 1, 0.3, 1] as const;

const rise = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE, delay: 0.06 + i * 0.06 },
});

const capa = (p?: Project | null) => {
  if (!p) return null;
  const c = coverOf(p);
  return typeof c === "string" ? c : c?.url ?? null;
};
const fotos = (p: Project) => p.photos?.filter((f) => !f.isDivider).length || 0;

export default function Links() {
  const { projects, eventos, stream } = useHomeData();
  const [destaques, setDestaques] = useState<LinkDestaque[]>([]);

  useEffect(() => {
    supabase
      .from("links_destaques")
      .select("*")
      .eq("ativo", true)
      .order("ordem")
      .then(({ data }) => setDestaques((data as LinkDestaque[]) || []), () => setDestaques([]));
  }, []);

  const videos = useMemo(
    () => destaques.map((d) => ({ ...d, embed: instagramEmbed(d.url) })).filter((d) => d.embed),
    [destaques]
  );
  const albuns = useMemo(
    () => [...projects].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [projects]
  );
  const film = useMemo(() => stream.slice(0, 16), [stream]);

  const fotoEvento = eventos.find((e) => e.capa_url)?.capa_url || capa(albuns[1]) || capa(albuns[0]);
  const fotoAlbuns = capa(albuns[0]);
  const fotoEventos = eventos.find((e) => e.capa_url)?.capa_url || capa(albuns[2]);
  const fotoOrcamento = capa(albuns[3]) || capa(albuns[0]);

  return (
    <div className="inicio min-h-[100dvh] bg-[#0a0a0a] font-body text-[#f5f4f0] antialiased selection:bg-white selection:text-black">
      <div className="mx-auto w-full max-w-[620px] px-5 pb-16 pt-12 sm:pt-16">
        {/* ─────────── Who we are ─────────── */}
        <header className="text-center">
          <motion.img
            {...rise(0)}
            src={logoStar}
            alt=""
            width={256}
            height={262}
            className="mx-auto h-14 w-auto"
          />
          <h1 className="mt-6 font-display text-[clamp(3.4rem,16vw,5.5rem)] font-medium leading-[0.9] tracking-[-0.03em]">
            <span className="inicio-word">
              {[..."GoFocus"].map((ch, i) => (
                <span key={i} className="inicio-char" style={{ ["--i" as string]: i }}>
                  {ch}
                </span>
              ))}
            </span>
          </h1>
          <motion.p {...rise(2)} className="mt-3 font-display text-[1.35rem] italic text-white/80">
            Sua marca em movimento.
          </motion.p>
          <motion.p {...rise(3)} className="mx-auto mt-3 max-w-[36ch] text-[15px] leading-relaxed text-white/55">
            Vídeos e marketing para empresas, filmagem de eventos e casamentos, e fotografia.
          </motion.p>
          <motion.a
            {...rise(4)}
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-[14px] font-medium transition-colors hover:bg-white hover:text-black ${ring}`}
          >
            <Instagram className="h-4 w-4" aria-hidden="true" /> @gofocus.br
          </motion.a>
        </header>

        {/* ─────────── What to tap ─────────── */}
        <motion.nav {...rise(5)} aria-label="Links principais" className="mt-10 border-t border-white/15">
          <ActionRow href={DM_URL} foto={fotoOrcamento} title="Pedir orçamento" note="Chama no direct do Instagram" />
          <ActionRow href={BANLEK_URL} foto={fotoEvento} title="Encontrar minhas fotos" note="Fotos dos eventos que cobrimos, na loja Banlek" />
          <ActionRow to="/#portfolio" foto={fotoAlbuns} title="Ver nossos trabalhos" note={projects.length ? `${projects.length} álbuns publicados` : "Portfólio"} />
          <ActionRow to="/eventos" foto={fotoEventos} title="Galerias de eventos" note={eventos.length ? `${eventos.length} ${eventos.length === 1 ? "galeria aberta" : "galerias abertas"}` : "Encontre o seu evento"} />
        </motion.nav>

        {/* ─────────── Moving strip of real photos ─────────── */}
        {film.length > 0 && (
          <div className="-mx-5 mt-12 overflow-hidden" aria-hidden="true">
            <div className="inicio-marquee gap-2" style={{ ["--speed" as string]: "90s" }}>
              {[...film, ...film].map((f, i) => (
                <img
                  key={`${f.key}-${i}`}
                  src={thumb(f.url, 400)}
                  alt=""
                  loading={i < 6 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-[150px] w-auto max-w-none shrink-0 rounded-sm bg-[#141414]"
                />
              ))}
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <section aria-label="Em destaque no Instagram" className="mt-14">
            <SectionHead title="Em destaque" note="Direto do nosso Instagram" />
            <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {videos.map((v) => (
                <figure key={v.id} className="w-[min(86vw,360px)] shrink-0 snap-center">
                  <div className="overflow-hidden rounded-sm bg-white">
                    <iframe
                      src={v.embed!.embed}
                      title={v.titulo || "Post do Instagram da GoFocus"}
                      loading="lazy"
                      scrolling="no"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      className="block h-[560px] w-full border-0"
                    />
                  </div>
                  {v.titulo && <figcaption className="mt-2.5 text-[15px] text-white/60">{v.titulo}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {albuns.length > 0 && (
          <section aria-label="Últimos trabalhos" className="mt-14">
            <SectionHead title="Últimos trabalhos" note="Toque para ver o álbum" />
            <ul className="columns-2 gap-3">
              {albuns.slice(0, 8).map((p, i) => {
                const c = capa(p);
                return (
                  <li key={p.id} className="mb-5 break-inside-avoid">
                    <Link to={`/projeto/${p.id}`} className={`group block ${ring}`}>
                      <span className="block overflow-hidden rounded-sm bg-[#141414]">
                        {c && (
                          <img
                            src={thumb(c, 600)}
                            alt=""
                            loading={i < 4 ? "eager" : "lazy"}
                            decoding="async"
                            className="block h-auto w-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                          />
                        )}
                      </span>
                      <span className="mt-2 block font-display text-[1.1rem] leading-tight">{p.clientName}</span>
                      <span className="block text-[13px] text-white/50">{fotos(p)} fotos</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {albuns.length > 8 && (
              <Link to="/#portfolio" className={`mt-2 inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-[15px] font-medium transition-colors hover:bg-white hover:text-black ${ring}`}>
                Ver todos os {albuns.length} álbuns <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </section>
        )}

        {eventos.length > 0 && (
          <section aria-label="Galerias de eventos" className="mt-14">
            <SectionHead title="Galerias de eventos" note="Esteve lá? Suas fotos estão aqui" />
            <ul className="border-t border-white/15">
              {eventos.slice(0, 6).map((e) => (
                <li key={e.id}>
                  <Link to={`/eventos/${e.id}`} className={`inicio-service group flex items-center gap-4 border-b border-white/15 py-3 pr-2 ${ring}`}>
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-[#141414]">
                      {e.capa_url && <img src={thumb(e.capa_url, 200)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-medium">{e.titulo}</span>
                      <span className="inicio-service-text block truncate text-[13px] text-white/50">
                        {[e.local, e.data_evento && new Date(e.data_evento + "T12:00:00").toLocaleDateString("pt-BR")].filter(Boolean).join(" · ") || "Galeria aberta"}
                      </span>
                    </span>
                    <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-label="Contato" className="mt-16 border-t border-white/15 pt-12 text-center">
          <p className="font-display text-[clamp(2.2rem,9vw,3.2rem)] leading-[1] tracking-[-0.02em]">
            Vamos colocar sua marca <span className="italic">em movimento?</span>
          </p>
          <a
            href={DM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-black transition-transform hover:-translate-y-0.5 ${ring}`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Falar com a GoFocus
          </a>
        </section>

        <p className="mt-14 text-center text-[13px] text-white/40">© {new Date().getFullYear()} GoFocus</p>
      </div>
    </div>
  );
}

const ring = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

function SectionHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <h2 className="font-display text-[clamp(1.9rem,7vw,2.6rem)] font-medium leading-none tracking-[-0.02em]">{title}</h2>
      <p className="text-[14px] text-white/50">{note}</p>
    </div>
  );
}

/** A big tappable row: a real photo, what it does, where it goes. White fills it on hover. */
function ActionRow({ to, href, foto, title, note }: {
  to?: string;
  href?: string;
  foto: string | null;
  title: string;
  note: ReactNode;
}) {
  const body = (
    <>
      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-[#141414]">
        {foto && <img src={thumb(foto, 220)} alt="" loading="eager" className="h-full w-full object-cover" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[1.35rem] leading-tight">{title}</span>
        <span className="inicio-service-text mt-0.5 block text-[13px] text-white/55">{note}</span>
      </span>
      <ArrowUpRight className="h-6 w-6 shrink-0 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" strokeWidth={1.5} aria-hidden="true" />
    </>
  );
  const cls = `inicio-service group flex items-center gap-4 border-b border-white/15 py-3.5 pl-1 pr-2 ${ring}`;
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
  ) : (
    <Link to={to!} className={cls}>{body}</Link>
  );
}
