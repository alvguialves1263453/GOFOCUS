import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Category, Project } from "@/lib/storage";
import PhotoStrip from "./PhotoStrip";
import { realPhotos, stripPhotos } from "./homeData";

// Strips pinned up by hand never hang perfectly straight.
const TILTS = [-2.2, 1.4, -0.8, 2, -1.6, 0.9, -2.6, 1.7];

/**
 * Every album as a printed strip on the wall of the booth. Category buttons
 * are the booth's tokens; hovering a strip straightens and lifts it.
 */
export default function StripWall({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const [active, setActive] = useState<string | null>(null);
  const used = useMemo(() => {
    const ids = new Set(projects.map((p) => p.categoryId));
    return categories.filter((c) => ids.has(c.id));
  }, [projects, categories]);
  const shown = projects.filter((p) => realPhotos(p).length > 0 && (!active || p.categoryId === active));
  const categoryName = (id?: string) => categories.find((c) => c.id === id)?.name;

  return (
    <section id="portfolio" className="scroll-mt-6 bg-[#0b0b0b] px-5 py-24 text-[#FBFAF7] sm:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-balance font-marquee text-[clamp(3rem,7vw,6rem)] font-black uppercase leading-[0.86] text-[#A7AAAF]">
              Todas as tiras
            </h2>
            <p className="mt-5 max-w-[46ch] font-archivo text-[17px] leading-relaxed text-[#D8D4CB]">
              Cada tira é um álbum entregue: {projects.length} trabalhos até agora. Escolha um para ver todas as fotos.
            </p>
          </div>

          {used.length > 1 && (
            <div role="group" aria-label="Filtrar álbuns por categoria" className="flex flex-wrap gap-2.5 lg:max-w-[52%] lg:justify-end">
              {[{ id: null as string | null, name: "Todos" }, ...used].map((c) => {
                const on = active === c.id;
                return (
                  <button
                    key={c.id ?? "all"}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setActive(c.id)}
                    className={`rounded-full px-4 py-2 font-archivo text-[14px] font-semibold transition-[background-color,color,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A7AAAF] ${
                      on
                        ? "bg-[#A7AAAF] text-[#141414] shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]"
                        : "bg-[#1c1c1c] text-[#D8D4CB] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[#262626] hover:text-[#FBFAF7]"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 md:mt-20 md:gap-x-8 lg:grid-cols-5">
          {shown.map((p, i) => {
            const count = realPhotos(p).length;
            return (
              <li key={p.id} className="flex justify-center">
                <Link
                  to={`/projeto/${p.id}`}
                  aria-label={`Abrir álbum ${p.clientName}`}
                  style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` } as React.CSSProperties}
                  className="block w-full max-w-[220px] rotate-[var(--tilt)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:rotate-0 focus-visible:rotate-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A7AAAF]"
                >
                  <PhotoStrip
                    photos={stripPhotos(p)}
                    title={p.clientName}
                    caption={[categoryName(p.categoryId), `${count} fotos`].filter(Boolean).join(", ")}
                    imageWidth={320}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {shown.length === 0 && (
          <p className="mt-12 font-archivo text-[16px] text-[#D8D4CB]">Ainda não há álbuns nesta categoria. Escolha outra acima.</p>
        )}
      </div>
    </section>
  );
}
