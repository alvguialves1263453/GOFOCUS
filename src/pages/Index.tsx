import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  getProjectsAsync,
  getCategoriesAsync,
  type Project,
  type Category,
} from "@/lib/storage";
import { Heart, Instagram, ChevronDown, Sparkles, Camera, Eye, Award } from "lucide-react";
import logo from "@/assets/logo.png";
import { getOptimizedUrl } from "@/lib/imagekit";

const INSTAGRAM_URL = "https://instagram.com/gofocus.br";

const reasons = [
  {
    icon: Eye,
    title: "Olhar Único",
    description:
      "Cada projeto é tratado como uma obra de arte. Capturamos a essência com sensibilidade.",
  },
  {
    icon: Heart,
    title: "Paixão pelo Detalhe",
    description:
      "Do clique à pós-produção, cada detalhe é cuidadosamente trabalhado.",
  },
  {
    icon: Award,
    title: "Experiência Premium",
    description:
      "Experiência completa e atendimento personalizado de início ao fim.",
  },
  {
    icon: Camera,
    title: "Equipamento Pro",
    description:
      "Utilizamos o que há de mais moderno para garantir excelência absoluta.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const, delay: i * 0.1 },
  }),
};

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [projectsData, categoriesData] = await Promise.all([
        getProjectsAsync(),
        getCategoriesAsync(),
      ]);
      setProjects(projectsData);
      setCategories(categoriesData);
    }
    loadData();
  }, []);

  const filteredProjects = selectedCategoryId
    ? projects.filter((p) => p.categoryId === selectedCategoryId)
    : projects;

  return (
    <div className="relative min-h-screen text-white bg-[#0a0a0a]">

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-5 text-center">
        {/* horizontal line accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <motion.div
          className="flex flex-col items-center gap-10"
          initial="hidden"
          animate="visible"
        >
          {/* Logo */}
          <motion.div variants={fadeUp} custom={0}>
            <img
              src={logo}
              alt="GoFocus"
              className="w-36 sm:w-48 md:w-56 invert brightness-0 invert"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </motion.div>

          {/* Tagline */}
          <motion.div variants={fadeUp} custom={1} className="flex flex-col items-center gap-6 max-w-xs sm:max-w-sm">
            <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.45em] text-white/40">
              Cada foto conta uma história
            </p>

            <div className="divider w-16" />

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-[10px] font-semibold uppercase tracking-[0.3em] rounded-sm transition-opacity duration-300 hover:opacity-80 text-center"
              >
                Entrar em Contato
              </a>
              {projects.length > 0 && (
                <a
                  href="#portfolio"
                  className="w-full sm:w-auto px-8 py-3.5 border border-white/15 text-white/50 text-[10px] font-semibold uppercase tracking-[0.3em] rounded-sm transition-colors duration-300 hover:border-white/40 hover:text-white/80 text-center"
                >
                  Galeria
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* scroll cue */}
        <motion.div
          className="absolute bottom-8 flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <ChevronDown className="h-4 w-4 text-white/20 animate-bounce" />
          <span className="text-[8px] uppercase tracking-[0.5em] text-white/18">Rolar</span>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      </section>

      {/* ── PORTFOLIO ── */}
      <section id="portfolio" className="px-4 sm:px-6 py-20 md:py-32 relative z-10 max-w-7xl mx-auto">
        {/* heading */}
        <motion.div
          className="mb-14 md:mb-20 flex flex-col items-start gap-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.span
            variants={fadeUp}
            custom={0}
            className="text-[9px] font-semibold uppercase tracking-[0.45em] text-white/35"
          >
            Portfólio
          </motion.span>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-3xl sm:text-5xl md:text-6xl font-serif font-normal text-white leading-tight"
          >
            Trabalhos<br className="sm:hidden" /> Selecionados
          </motion.h2>
        </motion.div>

        {/* category filter */}
        {categories.length > 0 && (
          <div className="mb-12 flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-5 py-2 rounded-sm text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                selectedCategoryId === null
                  ? "bg-white text-black"
                  : "text-white/40 border border-white/10 hover:border-white/30 hover:text-white/70"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-5 py-2 rounded-sm text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                  selectedCategoryId === cat.id
                    ? "bg-white text-black"
                    : "text-white/40 border border-white/10 hover:border-white/30 hover:text-white/70"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* grid */}
        <AnimatePresence mode="wait">
          {filteredProjects.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-40 border border-white/6 rounded-sm"
            >
              <Sparkles className="h-7 w-7 text-white/20 mb-4 animate-pulse" />
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/25">
                Aguarde pelas fotos…
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedCategoryId ?? "all"}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3"
            >
              {filteredProjects.map((project, i) => (
                <PortfolioCard key={project.id} project={project} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── DIFFERENTIALS ── */}
      <section className="px-4 sm:px-6 py-20 md:py-28 relative z-10 border-t border-white/6">
        <div className="mx-auto max-w-6xl">
          {/* header */}
          <div className="mb-14 max-w-lg">
            <span className="text-[9px] font-semibold uppercase tracking-[0.45em] text-white/35">
              Por que nos escolher
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-serif font-normal text-white leading-snug">
              Além das lentes,<br /> uma visão.
            </h2>
          </div>

          {/* cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/6">
            {reasons.map((reason, i) => (
              <motion.div
                key={reason.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-[#0a0a0a] p-8 md:p-10 flex flex-col gap-4 group"
              >
                <reason.icon
                  className="h-5 w-5 text-white/40 group-hover:text-white transition-colors duration-300"
                  strokeWidth={1.5}
                />
                <h3 className="text-base font-medium tracking-tight text-white/85">
                  {reason.title}
                </h3>
                <p className="text-sm text-white/38 leading-relaxed">{reason.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="px-4 sm:px-6 py-20 md:py-32 relative z-10 border-t border-white/6">
        <div className="mx-auto max-w-4xl text-center flex flex-col items-center gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="space-y-4"
          >
            <span className="text-[9px] font-semibold uppercase tracking-[0.45em] text-white/35">
              Entre em contato
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-white leading-tight">
              Vamos criar<br className="sm:hidden" /> um legado.
            </h2>
            <p className="text-sm text-white/38 max-w-sm mx-auto leading-relaxed">
              Fotografia de alto padrão para mentes globais.
            </p>
          </motion.div>

          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black text-[10px] font-semibold uppercase tracking-[0.35em] rounded-sm transition-opacity duration-300 hover:opacity-80"
          >
            Instagram
            <Instagram className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-4 sm:px-6 py-10 border-t border-white/6 relative z-10">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <img
            src={logo}
            alt="GoFocus"
            className="h-6 opacity-20"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 text-center">
            © {new Date().getFullYear()} GoFocus — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

/* ── PORTFOLIO CARD ── */
function PortfolioCard({ project, index }: { project: Project; index: number }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const cover = project.photos?.[project.coverIndex || 0];
  if (!cover?.url) return null;

  return (
    <motion.a
      href={`/projeto/${project.id}`}
      className="group relative block aspect-[4/5] overflow-hidden bg-[#111]"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
          delay: (index % 3) * 0.08,
        },
      }}
      viewport={{ once: true }}
    >
      {/* Shimmer Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 overflow-hidden bg-[#111] z-10">
          <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
        </div>
      )}

      <motion.img
        src={getOptimizedUrl(cover.url, 1200)}
        alt={project.clientName}
        onLoad={() => setIsLoaded(true)}
        initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
        animate={{ 
          opacity: isLoaded ? 1 : 0, 
          scale: isLoaded ? 1 : 1.05,
          filter: isLoaded ? "blur(0px)" : "blur(10px)"
        }}
        transition={{ duration: 0.8 }}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
        decoding="async"
      />

      {/* bottom info */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 p-5 z-20">
        <h3 className="text-sm font-medium text-white leading-tight truncate">
          {project.clientName}
        </h3>
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mt-1.5 font-medium">
          {project.photos?.length || 0} fotos
        </p>
      </div>

      {/* thin border on hover */}
      <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 transition-colors duration-500 pointer-events-none z-30" />
    </motion.a>
  );
}

export default Index;
