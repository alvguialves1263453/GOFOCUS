import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Instagram, MessageCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/lib/supabase";
import { instagramEmbed, type LinkDestaque } from "@/lib/adminStore";
import { coverOf, thumb, useHomeData } from "@/components/home/homeData";
import { INSTAGRAM_URL } from "@/components/home/HomeSections";
import type { Project } from "@/lib/storage";
import "./links.css";

/*
 * Link-in-bio, split like the booth: a grey cabinet you act on (identity + actions,
 * sticky on desktop) and a black interior that holds the work (reels, albums, events).
 */
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
    <div className="min-h-[100dvh] bg-[#0B0B0B] text-[#E9EAEC] selection:bg-[#A7AAAF] selection:text-[#141414] lg:grid lg:grid-cols-[minmax(440px,42%)_minmax(0,1fr)]">
      {/* ─────────── The cabinet: who we are, what to tap ─────────── */}
      <aside className="flex flex-col bg-[#A7AAAF] text-[#141414] lg:sticky lg:top-0 lg:h-[100dvh] lg:overflow-y-auto">
        {/* Film strip of real photos */}
        <div className="links-film-wrap overflow-hidden bg-[#141414] py-1.5" aria-hidden="true">
          <div className="links-sprockets opacity-40" />
          <div className="relative h-[92px] overflow-hidden sm:h-[108px]">
            {film.length > 0 && (
              <div className="links-film gap-1.5 px-1.5">
                {[...film, ...film].map((f, i) => (
                  <img
                    key={`${f.key}-${i}`}
                    src={thumb(f.url, 240)}
                    alt=""
                    loading={i < 8 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-[92px] w-[124px] shrink-0 rounded-[3px] object-cover sm:h-[108px] sm:w-[146px]"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="links-sprockets opacity-40" />
        </div>

        <div className="flex flex-1 flex-col px-5 pb-8 pt-6 sm:px-8 lg:px-10 lg:pt-9">
          <motion.div {...rise(0)} className="flex items-center justify-between gap-3">
            <img src={logo} alt="" width={1024} height={1024} className="h-10 w-auto sm:h-12" style={{ filter: "brightness(0)" }} />
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-4 py-2.5 text-[14px] font-semibold text-[#E9EAEC] transition-transform hover:bg-black active:scale-95"
            >
              <Instagram className="h-4 w-4" aria-hidden="true" /> @gofocus.br
            </a>
          </motion.div>

          <motion.h1
            {...rise(1)}
            className="mt-7 font-marquee text-[clamp(4.2rem,22vw,7.4rem)] font-black uppercase leading-[0.82] tracking-[-0.015em] lg:text-[clamp(5rem,8.4vw,8rem)]"
          >
            GoFocus
          </motion.h1>
          <motion.p {...rise(2)} className="mt-4 max-w-[34ch] text-[17px] leading-snug text-[#23252A]">
            Fotografia que transcende. Eventos, ensaios, dança, esporte e marcas em Itapeva - SP.
          </motion.p>

          <motion.nav {...rise(3)} aria-label="Links principais" className="mt-7 flex flex-col gap-2.5">
            <ActionRow
              href={BANLEK_URL}
              foto={fotoEvento}
              title="Encontrar minhas fotos"
              note={<><span className="rounded-full bg-[#5DBFEA] px-2 py-0.5 text-[11px] font-bold text-[#06202c]">Loja Banlek</span> Fotos dos eventos que cobrimos</>}
              big
            />
            <ActionRow to="/" foto={fotoAlbuns} title="Ver nossos álbuns" note={projects.length ? `${projects.length} trabalhos publicados` : "Portfólio"} />
            <ActionRow to="/eventos" foto={fotoEventos} title="Galerias de eventos" note={eventos.length ? `${eventos.length} ${eventos.length === 1 ? "galeria aberta" : "galerias abertas"}` : "Encontre o seu evento"} />
            <ActionRow href={DM_URL} foto={fotoOrcamento} title="Pedir orçamento" note="Chama no direct do Instagram" />
          </motion.nav>

          <p className="mt-auto hidden pt-10 text-[13px] text-[#33363B] lg:block">© {new Date().getFullYear()} GoFocus, Itapeva - SP</p>
        </div>
      </aside>

      {/* ─────────── The interior: the work ─────────── */}
      <main className="px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pt-14">
        <div className="mx-auto max-w-[980px] space-y-14">
          {videos.length > 0 && (
            <motion.section {...rise(4)} aria-label="Em destaque no Instagram">
              <SectionHead title="Em destaque" note="Direto do nosso Instagram" />
              <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fill,minmax(330px,1fr))] lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
                {videos.map((v) => (
                  <figure key={v.id} className="w-[min(88vw,370px)] shrink-0 snap-center lg:w-auto">
                    <div className="overflow-hidden rounded-[20px] bg-white">
                      <iframe
                        src={v.embed!.embed}
                        title={v.titulo || "Post do Instagram da GoFocus"}
                        loading="lazy"
                        scrolling="no"
                        allow="autoplay; encrypted-media; picture-in-picture"
                        className="block h-[580px] w-full border-0"
                      />
                    </div>
                    {v.titulo && <figcaption className="mt-2.5 px-1 text-[15px] text-[#C9C4BA]">{v.titulo}</figcaption>}
                  </figure>
                ))}
              </div>
            </motion.section>
          )}

          {albuns.length > 0 && (
            <motion.section {...rise(5)} aria-label="Últimos trabalhos">
              <SectionHead title="Últimos trabalhos" note="Toque num álbum para ver todas as fotos" />
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {albuns.slice(0, 9).map((p, i) => {
                  const c = capa(p);
                  return (
                    <li key={p.id} className={i === 0 ? "col-span-2 sm:col-span-2 lg:col-span-2 xl:col-span-2" : undefined}>
                      <Link
                        to={`/projeto/${p.id}`}
                        className="group relative block overflow-hidden rounded-[18px] bg-[#161616] active:scale-[0.98] transition-transform"
                      >
                        <div className={i === 0 ? "aspect-[16/10]" : "aspect-[4/5]"}>
                          {c && (
                            <img
                              src={thumb(c, i === 0 ? 1100 : 560)}
                              alt=""
                              loading={i < 3 ? "eager" : "lazy"}
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                            />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5 sm:p-4">
                          <span className="min-w-0">
                            <span className={`block truncate font-marquee font-extrabold uppercase leading-[0.9] text-white ${i === 0 ? "text-[clamp(1.8rem,4vw,2.6rem)]" : "text-[1.35rem] sm:text-[1.55rem]"}`}>
                              {p.clientName}
                            </span>
                            <span className="mt-1 block text-[13px] text-white/70">{fotos(p)} fotos</span>
                          </span>
                          <ArrowUpRight className="h-5 w-5 shrink-0 text-white/60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {albuns.length > 9 && (
                <Link to="/" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1C1C1C] px-5 py-3 text-[15px] font-semibold text-[#E9EAEC] hover:bg-[#262626]">
                  Ver todos os {albuns.length} álbuns <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </motion.section>
          )}

          {eventos.length > 0 && (
            <motion.section {...rise(6)} aria-label="Galerias de eventos">
              <SectionHead title="Galerias de eventos" note="Esteve lá? Suas fotos estão aqui" />
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {eventos.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    <Link to={`/eventos/${e.id}`} className="group flex items-center gap-4 rounded-[18px] bg-[#161616] p-2.5 pr-4 transition-colors hover:bg-[#1C1C1C]">
                      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-[#1C1C1C]">
                        {e.capa_url && <img src={thumb(e.capa_url, 200)} alt="" loading="lazy" className="h-full w-full object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-semibold text-[#E9EAEC]">{e.titulo}</span>
                        <span className="block truncate text-[13px] text-[#8F8A80]">
                          {[e.local, e.data_evento && new Date(e.data_evento + "T12:00:00").toLocaleDateString("pt-BR")].filter(Boolean).join(" · ") || "Galeria aberta"}
                        </span>
                      </span>
                      <ArrowUpRight className="h-5 w-5 shrink-0 text-[#8F8A80] group-hover:text-[#E9EAEC]" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          <motion.section {...rise(7)} aria-label="Contato" className="rounded-[24px] bg-[#161616] px-6 py-8 sm:px-10 sm:py-10">
            <p className="font-marquee text-[clamp(2.2rem,6vw,3.4rem)] font-extrabold uppercase leading-[0.88] text-[#A7AAAF]">Vamos criar um legado.</p>
            <p className="mt-3 max-w-[40ch] text-[16px] text-[#C9C4BA]">Conte o seu evento pelo Instagram e a gente responde por lá.</p>
            <a
              href={DM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#A7AAAF] px-6 py-3.5 text-[15px] font-semibold text-[#141414] transition-transform hover:bg-[#BFC2C6] active:scale-95"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Falar com a GoFocus
            </a>
          </motion.section>

          <p className="text-center text-[13px] text-[#8F8A80] lg:hidden">© {new Date().getFullYear()} GoFocus, Itapeva - SP</p>
        </div>
      </main>
    </div>
  );
}

function SectionHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <h2 className="font-marquee text-[clamp(2.2rem,5vw,3rem)] font-extrabold uppercase leading-[0.88] text-[#A7AAAF]">{title}</h2>
      <p className="text-[14px] text-[#8F8A80]">{note}</p>
    </div>
  );
}

/** A big tappable row on the grey cabinet: a real photo, what it does, where it goes. */
function ActionRow({ to, href, foto, title, note, big }: {
  to?: string;
  href?: string;
  foto: string | null;
  title: string;
  note: ReactNode;
  big?: boolean;
}) {
  const body = (
    <>
      <span className={`shrink-0 overflow-hidden rounded-[14px] bg-[#2a2a2a] ${big ? "h-[76px] w-[76px]" : "h-16 w-16"}`}>
        {foto && <img src={thumb(foto, 220)} alt="" loading="eager" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-semibold leading-tight text-[#F2F2F3] ${big ? "text-[19px]" : "text-[17px]"}`}>{title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-[#A3A6AB]">{note}</span>
      </span>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2a2a2a] text-[#E9EAEC] transition-[transform,background-color] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-[#A7AAAF] group-hover:text-[#141414]">
        <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
      </span>
    </>
  );
  const cls = "group flex items-center gap-4 rounded-[22px] bg-[#141414] p-2.5 pr-3 transition-[transform,background-color] duration-200 hover:bg-black active:scale-[0.98]";
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
  ) : (
    <Link to={to!} className={cls}>{body}</Link>
  );
}
