import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { getProjectsAsync, getCategoriesAsync, type Project, type Category } from "@/lib/storage";
import { Heart, Instagram, ChevronDown, Sparkles, LayoutGrid, Camera, Eye, Award } from "lucide-react";
import logo from "@/assets/logo.png";

const INSTAGRAM_URL = "https://instagram.com/gofocus.br";

const LiquidBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050505] mesh-gradient">
      <motion.div
        className="blur-blob bg-primary"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ top: "10%", left: "10%" }}
      />
      <motion.div
        className="blur-blob bg-accent"
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1.2, 1, 1.2],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        style={{ bottom: "10%", right: "10%" }}
      />
    </div>
  );
};

const reasons = [
  { icon: Eye, title: "Olhar Único", description: "Cada projeto é tratado como uma obra de arte. Capturamos a essência com sensibilidade." },
  { icon: Heart, title: "Paixão pelo Detalhe", description: "Do clique à pós-produção, cada detalhe é cuidadosamente trabalhado." },
  { icon: Award, title: "Experiência Premium", description: "Experiência completa e atendimento personalizado de início ao fim." },
  { icon: Camera, title: "Equipamento Pro", description: "Utilizamos o que há de mais moderno para garantir excelência absoluta." },
];

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    async function loadData() {
      const [projectsData, categoriesData] = await Promise.all([
        getProjectsAsync(),
        getCategoriesAsync()
      ]);
      setProjects(projectsData);
      setCategories(categoriesData);
    }
    loadData();
  }, []);

  const filteredProjects = selectedCategoryId
    ? projects.filter(p => p.categoryId === selectedCategoryId)
    : projects;

  return (
    <div ref={containerRef} className="relative min-h-screen text-foreground selection:bg-primary/30 selection:text-white">
      <LiquidBackground />

      {/* ───── HERO ───── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 overflow-hidden">
        <motion.div
          style={{ opacity, scale }}
          className="flex flex-col items-center gap-12 text-center z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
            <img src={logo} alt="GoFocus" className="relative w-48 sm:w-64 md:w-72 drop-shadow-2xl" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <h1 className="text-[9px] font-medium uppercase tracking-[0.6em] text-white/50">
              Visual Narrative Architecture
            </h1>
            <div className="flex flex-col items-center gap-4 sm:flex-row mt-4">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="glass px-10 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition-all duration-500 hover:bg-white hover:text-black rounded-full shadow-2xl"
              >
                Get Started
              </motion.a>
              {projects.length > 0 && (
                <a
                  href="#portfolio"
                  className="px-10 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 transition-all duration-300 hover:text-white"
                >
                  Gallery
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-10 flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <ChevronDown className="h-4 w-4 text-white/20 animate-bounce" />
          <span className="text-[7px] uppercase tracking-[0.5em] text-white/20">Expand Experience</span>
        </motion.div>
      </section>

      {/* ───── PORTFOLIO ───── */}
      <section id="portfolio" className="relative px-4 py-24 md:py-40 z-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-24 text-center space-y-4">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="inline-block glass px-5 py-2 rounded-full text-[8px] font-bold uppercase tracking-[0.4em] text-primary"
            >
              The Portfolio
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-display font-light tracking-tight text-white/90"
            >
              Selected Works
            </motion.h2>
          </div>

          {/* CATEGORY DOCK */}
          {categories.length > 0 && (
            <div className="sticky top-12 z-50 flex justify-center mb-24">
              <div className="glass-dark p-2 rounded-full flex gap-1 items-center max-w-[90vw] overflow-x-auto ios-scroll-hide shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-7 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all duration-500 ${selectedCategoryId === null
                      ? "bg-white text-black shadow-xl"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`px-7 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${selectedCategoryId === category.id
                        ? "bg-white text-black shadow-xl"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {filteredProjects.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-48 glass rounded-[3rem]"
              >
                <Sparkles className="h-10 w-10 text-primary/40 mb-6 animate-pulse" />
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">Crafting new stories...</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedCategoryId || "all"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredProjects.map((project, i) => (
                  <PortfolioCard key={project.id} project={project} index={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ───── DIFFERENTIALS ───── */}
      <section className="px-6 py-24 md:py-40 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <span className="text-[9px] uppercase tracking-[0.4em] text-primary font-bold">Evolution</span>
              <h2 className="text-4xl md:text-6xl font-display font-light leading-tight">Beyond the lens, a vision.</h2>
              <p className="text-white/40 text-sm leading-relaxed max-w-md">Criamos uma estética que transcende tendências, focada na perenidade e no impacto emocional de cada registro.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {reasons.map((reason, i) => (
                <motion.div
                  key={reason.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-8 rounded-[2rem] space-y-4 group hover:bg-white/5 transition-colors"
                >
                  <reason.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                  <h3 className="text-sm font-medium tracking-tight">{reason.title}</h3>
                  <p className="text-[11px] text-white/30 leading-relaxed">{reason.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── CONTACT ───── */}
      <section className="px-6 py-32 relative z-10">
        <div className="mx-auto max-w-5xl">
          <div className="relative glass p-16 md:p-32 rounded-[4rem] text-center overflow-hidden border border-white/10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="relative z-10 space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-5xl md:text-7xl font-display font-light tracking-tighter">Let's create legacy.</h2>
                <p className="text-white/40 text-[11px] uppercase tracking-[0.3em] max-w-xs mx-auto">High-end photography for global minds.</p>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white text-black px-16 py-6 text-[11px] font-bold uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_50px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-4 mx-auto w-fit"
                >
                  Contact
                  <Instagram className="h-4 w-4" />
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="px-6 py-16 text-center relative z-10">
        <div className="flex flex-col items-center gap-6">
          <img src={logo} alt="GoFocus" className="w-24 opacity-20 grayscale" />
          <p className="text-[8px] uppercase tracking-[0.5em] text-white/20">
            © {new Date().getFullYear()} GoFocus Narrative Interiors — Built for the future
          </p>
        </div>
      </footer>
    </div>
  );
};

function PortfolioCard({ project, index }: { project: Project; index: number }) {
  const cover = project.photos?.[project.coverIndex || 0];
  if (!cover?.url) return null;

  return (
    <motion.a
      href={`/projeto/${project.id}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[2.5rem] glass-dark shadow-2xl border border-white/5"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { duration: 1, ease: [0.16, 1, 0.3, 1], delay: (index % 3) * 0.1 }
      }}
      whileHover={{ y: -12 }}
    >
      <img
        src={cover.url}
        alt={project.clientName}
        className="h-full w-full object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-70 group-hover:opacity-100 transition-opacity"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

      <div className="absolute inset-x-6 bottom-6 glass p-7 rounded-[2rem] backdrop-blur-3xl overflow-hidden border border-white/10 shadow-2xl translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-white/90 tracking-tight leading-none">{project.clientName}</h3>
            <span className="glass px-2 py-0.5 rounded-full text-[7px] font-bold text-white/60">PRM</span>
          </div>
          <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.3em] text-white/30">
            <div className="flex items-center gap-2">
              <Sparkles className="h-2.5 w-2.5" />
              <span>{project.photos?.length || 0} Captures</span>
            </div>
            {project.likes && project.likes > 0 && (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-white/80 border border-white/10">
                <Heart className="h-3 w-3 fill-primary text-primary" />
                {project.likes}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.a>
  );
}

export default Index;
