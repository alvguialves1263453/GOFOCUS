import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import CountUp from "@/components/CountUp";
import logo from "@/assets/logo.png";
import { thumb, type EventoResumo } from "./homeData";

export const INSTAGRAM_URL = "https://instagram.com/gofocus.br";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });

const heading =
  "text-balance font-marquee text-[clamp(3rem,7vw,6rem)] font-black uppercase leading-[0.86] tracking-[-0.01em]";

/** Open event galleries, on the booth's gold: one large print each, native sideways scroll. */
export function EventsRow({ eventos }: { eventos: EventoResumo[] }) {
  if (!eventos.length) return null;
  return (
    <section className="bg-[#A7AAAF] py-24 text-[#141414] md:py-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-10 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className={heading}>Galerias de eventos</h2>
          <p className="mt-5 max-w-[46ch] font-archivo text-[17px] leading-relaxed text-[#23252A]">
            Esteve num evento que fotografamos? Encontre a galeria e veja todas as fotos.
          </p>
        </div>
        <Link
          to="/eventos"
          className="w-fit rounded-full bg-[#141414] px-5 py-3 font-archivo text-[15px] font-semibold text-[#E9EAEC] transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414]"
        >
          Ver todos os eventos
        </Link>
      </div>

      <div className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-6 [scrollbar-width:none] sm:px-10 [&::-webkit-scrollbar]:hidden">
        {eventos.map((ev, i) => (
          <Link
            key={ev.id}
            to={`/eventos/${ev.id}`}
            className={`group w-[min(78vw,400px)] shrink-0 snap-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414] ${i % 2 ? "rotate-[1.2deg]" : "-rotate-[1deg]"}`}
          >
            <figure className="rounded-[3px] bg-[#FBFAF7] p-3 pb-5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2">
              <div className="aspect-[4/3] overflow-hidden bg-[#1a1a1a]">
                {ev.capa_url && (
                  <img
                    src={thumb(ev.capa_url, 800)}
                    alt=""
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <figcaption className="mt-4 px-1">
                <span className="block truncate font-marquee text-[1.7rem] font-extrabold uppercase leading-none">{ev.titulo}</span>
                <span className="mt-2 block font-archivo text-[14px] text-[#55524C]">
                  {[ev.data_evento ? dateFormat.format(new Date(ev.data_evento)) : null, ev.local].filter(Boolean).join(", ") || "Galeria aberta"}
                </span>
              </figcaption>
            </figure>
          </Link>
        ))}
      </div>
    </section>
  );
}

const REASONS = [
  { title: "Olhar único", text: "Cada projeto é tratado como uma obra de arte. Capturamos a essência com sensibilidade." },
  { title: "Paixão pelo detalhe", text: "Do clique à pós-produção, cada detalhe é cuidadosamente trabalhado." },
  { title: "Experiência premium", text: "Experiência completa e atendimento personalizado de início ao fim." },
  { title: "Equipamento profissional", text: "Utilizamos o que há de mais moderno para garantir excelência absoluta." },
];

/** What the studio stands for, set like the instruction plate inside a booth. */
export function Differentials({ albums }: { albums: number }) {
  const stats = [
    { value: 12, suffix: "+", label: "eventos realizados" },
    { value: albums, suffix: "", label: "álbuns no portfólio" },
    { value: 500, suffix: "+", label: "fotos entregues" },
    { value: 98, suffix: "%", label: "de satisfação" },
  ];
  return (
    <section className="bg-[#0b0b0b] px-5 py-24 text-[#FBFAF7] sm:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <h2 className={`${heading} text-[#A7AAAF]`}>Além das lentes, uma visão.</h2>
          <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {REASONS.map((r) => (
              <div key={r.title}>
                <dt className="font-marquee text-[1.9rem] font-extrabold uppercase leading-none text-[#FBFAF7]">{r.title}</dt>
                <dd className="mt-3 max-w-[38ch] font-archivo text-[16px] leading-relaxed text-[#C9C4BA]">{r.text}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-y-10 rounded-[20px] bg-[#161616] px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:grid-cols-4 md:px-10">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-marquee text-[clamp(3rem,6vw,4.6rem)] font-black leading-none tabular-nums text-[#A7AAAF]">
                <CountUp from={0} to={s.value} duration={2} separator="." />
                {s.suffix}
              </p>
              <p className="mt-2 font-archivo text-[15px] text-[#C9C4BA]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section className="bg-[#A7AAAF] px-5 py-24 text-[#141414] sm:px-10 md:py-32">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <h2 className={`${heading} max-w-[12ch] text-[clamp(3.6rem,10vw,6rem)]`}>Vamos criar um legado.</h2>
        <div className="max-w-[40ch]">
          <p className="font-archivo text-[18px] leading-relaxed text-[#23252A]">
            Fotografia de alto padrão para mentes globais. Conte o seu evento pelo Instagram e a gente responde por lá.
          </p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-[#141414] px-7 py-4 font-archivo text-[16px] font-semibold text-[#E9EAEC] transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#141414]"
          >
            <Instagram className="h-5 w-5" aria-hidden="true" /> Falar no Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#0b0b0b] px-5 py-12 text-[#C9C4BA] sm:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="" width={1024} height={1024} className="h-8 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
          <span className="font-marquee text-[1.5rem] font-black uppercase leading-none text-[#FBFAF7]">GoFocus</span>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-8 gap-y-3 font-archivo text-[15px]">
          <a href="#portfolio" className="transition-colors hover:text-[#FBFAF7]">Álbuns</a>
          <Link to="/eventos" className="transition-colors hover:text-[#FBFAF7]">Eventos</Link>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#FBFAF7]">Instagram</a>
          <Link to="/admin" className="transition-colors hover:text-[#FBFAF7]">Admin</Link>
        </nav>
      </div>
      <p className="mx-auto mt-10 max-w-7xl font-archivo text-[13px] text-[#8F8A80]">© {new Date().getFullYear()} GoFocus. Todos os direitos reservados.</p>
    </footer>
  );
}
