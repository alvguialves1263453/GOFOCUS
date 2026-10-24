import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { Instagram } from "lucide-react";
import type { Category, Project } from "@/lib/storage";
import logo from "@/assets/logo.png";
import PhotoStrip from "./PhotoStrip";
import BoothCamera, { type BoothCameraHandle } from "./BoothCamera";
import { prefersReducedMotion, realPhotos, stripPhotos } from "./homeData";
import { INSTAGRAM_URL } from "./HomeSections";

interface PhotoBoothProps {
  projects: Project[];
  categories: Category[];
}

const COUNT_FROM = 3;

/**
 * First screen: the front of a party photo booth. Pressing the button counts
 * down, fires the flash and prints a strip of four real photos from the next
 * album. Everything that moves is a transform or an opacity.
 */
export default function PhotoBooth({ projects, categories }: PhotoBoothProps) {
  // Fullest albums first, so the first strip is a strong one.
  const queue = useMemo(
    () => [...projects].filter((p) => realPhotos(p).length >= 4).sort((a, b) => realPhotos(b).length - realPhotos(a).length),
    [projects]
  );
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const machine = useRef<HTMLDivElement>(null);
  const camera = useRef<BoothCameraHandle>(null);
  const firstPrint = useRef(true);

  const album = queue[index % Math.max(1, queue.length)];
  const categoryNames = useMemo(() => {
    const used = new Set(projects.map((p) => p.categoryId));
    return categories.filter((c) => used.has(c.id)).map((c) => c.name.toLowerCase());
  }, [projects, categories]);

  // Every new album prints out of the slot: a stepped feed, like a real printer.
  useEffect(() => {
    if (!album || !strip.current) return;
    if (prefersReducedMotion()) {
      gsap.fromTo(strip.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      return;
    }
    const tween = gsap.fromTo(
      strip.current,
      { yPercent: -101 },
      { yPercent: 0, duration: firstPrint.current ? 1.8 : 2.2, ease: "steps(16)", delay: firstPrint.current ? 0.5 : 0 }
    );
    firstPrint.current = false;
    return () => {
      tween.kill();
    };
  }, [album]);

  const shoot = useCallback(() => {
    if (busy || queue.length < 2) return;
    setBusy(true);
    // On phones the machine sits below the button: bring it into view to watch the print.
    const m = machine.current?.getBoundingClientRect();
    if (m && window.innerWidth < 768 && (m.top < 0 || m.top > window.innerHeight * 0.45)) {
      machine.current!.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
    const next = () => {
      setIndex((i) => (i + 1) % queue.length);
      setBusy(false);
    };
    if (prefersReducedMotion()) return next();

    const tl = gsap.timeline({ onComplete: next });
    // The old strip is pulled out of the slot (downwards) while the countdown runs.
    tl.to(strip.current, { yPercent: 115, duration: 0.6, ease: "power2.in" }, 0);
    for (let n = COUNT_FROM; n >= 1; n--) tl.add(() => setCount(n), (COUNT_FROM - n) * 0.6);
    tl.add(() => {
      setCount(null);
      camera.current?.flash();
    }, COUNT_FROM * 0.6);
    tl.fromTo(flash.current, { opacity: 0 }, { opacity: 0.85, duration: 0.05, ease: "none" }, COUNT_FROM * 0.6)
      .to(flash.current, { opacity: 0, duration: 0.55, ease: "power2.out" });
  }, [busy, queue.length]);

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#A7AAAF] text-[#141414] selection:bg-[#141414] selection:text-[#A7AAAF]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 pt-5 sm:px-10 sm:pt-7">
        <Link to="/" aria-label="GoFocus, página inicial" className="flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414]">
          <img src={logo} alt="" width={1024} height={1024} className="h-9 w-auto" style={{ filter: "brightness(0)" }} />
          <span className="font-marquee text-[1.6rem] font-black uppercase leading-none">GoFocus</span>
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-1 font-archivo text-[15px] font-medium sm:gap-2">
          {[
            { label: "Álbuns", href: "#portfolio" },
            { label: "Eventos", to: "/eventos" },
          ].map((l) =>
            l.to ? (
              <Link key={l.label} to={l.to} className="rounded-full px-3 py-2 underline-offset-[6px] transition-colors hover:bg-[#141414]/10 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#141414]">
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} className="rounded-full px-3 py-2 underline-offset-[6px] transition-colors hover:bg-[#141414]/10 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#141414]">
                {l.label}
              </a>
            )
          )}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-[#141414] px-4 py-2 text-[#E9EAEC] transition-colors hover:bg-black sm:inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#141414]"
          >
            Instagram
          </a>
        </nav>
      </header>

      <div className="mx-auto grid max-w-7xl items-start gap-12 px-5 pb-16 pt-10 sm:px-10 md:grid-cols-[1.1fr_0.9fr] md:gap-10 md:pb-0 md:pt-16">
        <div className="md:pt-6">
          <h1 className="text-balance font-marquee text-[clamp(3.6rem,9vw,6rem)] font-black uppercase leading-[0.86] tracking-[-0.01em]">
            Fotografia que transcende
          </h1>
          <p className="mt-6 max-w-[44ch] text-pretty font-archivo text-[17px] leading-relaxed text-[#23252A] sm:text-[18px]">
            Fotos de {categoryNames.length ? formatList(categoryNames) : "eventos"}. Aperte o botão e a cabine imprime uma tira de um álbum de verdade.
          </p>

          <div className="mt-9 flex flex-col items-start gap-6">
            <button
              type="button"
              onClick={shoot}
              disabled={busy || queue.length < 2}
              className="group flex items-center gap-4 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414] disabled:cursor-wait"
            >
              {/* The booth's push button: chrome rim, black cap that sinks when pressed. */}
              <span className="grid h-[84px] w-[84px] place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#c9ccd1_45%,#7d8188_100%)] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.55)]">
                <span className="h-[62px] w-[62px] rounded-full bg-[radial-gradient(circle_at_40%_35%,#3a3a3a,#0d0d0d_70%)] shadow-[inset_0_-4px_8px_rgba(255,255,255,0.08),0_4px_6px_rgba(0,0,0,0.55)] transition-transform duration-150 group-hover:scale-[1.03] group-active:translate-y-[2px] group-active:shadow-[inset_0_-2px_6px_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.55)] group-disabled:scale-95" />
              </span>
              <span className="text-left font-archivo">
                <span className="block font-marquee text-[1.7rem] font-extrabold uppercase leading-none">
                  {busy ? "Sorria…" : "Imprimir uma tira"}
                </span>
                <span className="mt-1 block text-[14px] text-[#33363B]">Quatro fotos de um álbum nosso</span>
              </span>
            </button>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full bg-[#141414] px-6 py-3.5 font-archivo text-[16px] font-semibold text-[#E9EAEC] transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414]"
            >
              <Instagram className="h-5 w-5" aria-hidden="true" /> Falar no nosso Instagram
            </a>
          </div>
        </div>

        {/* The machine: window with lens and countdown, then the print slot with the strip hanging out of it. */}
        <div ref={machine} className="relative mx-auto w-full max-w-[420px] scroll-mt-4">
          <div className="relative z-10">
            <BoothCamera ref={camera} count={count} busy={busy} />
          </div>

          {/* The strip feeds out from under the slot; the clip keeps it "inside" until printed. */}
          <div className="relative z-20 mx-auto -mt-[28px] h-[min(78vh,680px)] w-[60%] overflow-hidden sm:-mt-[32px]">
            {album && (
              <div ref={strip} className="will-change-transform">
                <Link
                  to={`/projeto/${album.id}`}
                  aria-label={`Abrir álbum ${album.clientName}`}
                  className="block rotate-[-1.2deg] rounded-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414]"
                >
                  <PhotoStrip
                    photos={stripPhotos(album)}
                    title={album.clientName}
                    caption={`${realPhotos(album).length} fotos no álbum, toque para abrir`}
                    imageWidth={480}
                    eager
                  />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={flash} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] bg-white opacity-0" />
    </section>
  );
}

function formatList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}
