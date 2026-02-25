import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { getProjects, type Project } from "@/lib/storage";
import { Camera, Eye, Heart, Award, Instagram } from "lucide-react";
import logo from "@/assets/logo.png";

const INSTAGRAM_URL = "https://instagram.com/gofocus.br";

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }} transition={{ duration: 0.8, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

const reasons = [
  { icon: Eye, title: "Olhar Único", description: "Cada projeto é tratado como uma obra de arte. Capturamos a essência do momento com sensibilidade e técnica." },
  { icon: Heart, title: "Paixão pelo Detalhe", description: "Dos cliques à pós-produção, cada detalhe é cuidadosamente trabalhado para entregar imagens impecáveis." },
  { icon: Award, title: "Experiência Premium", description: "Atendimento personalizado do início ao fim. Você recebe não só fotos, mas uma experiência completa." },
  { icon: Camera, title: "Equipamento Profissional", description: "Utilizamos equipamentos de última geração para garantir a mais alta qualidade em cada registro." },
];

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ───── HERO ───── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6">
        <motion.div className="flex flex-col items-center gap-6 text-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
          <img src={logo} alt="GoFocus" className="w-48 sm:w-64 md:w-80" />
          <motion.div className="mt-6 flex flex-col items-center gap-4 sm:flex-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex h-12 w-12 items-center justify-center border border-foreground text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background" title="Entrar em Contato">
              <Instagram size={20} strokeWidth={1.5} />
            </a>
            {projects.length > 0 && <a href="#portfolio" className="px-8 py-3 text-xs uppercase tracking-[0.3em] text-muted-foreground transition-colors duration-300 hover:text-foreground">Ver Trabalhos</a>}
          </motion.div>
        </motion.div>
        <motion.div className="absolute bottom-6 flex flex-col items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}>
          <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">ARRASTE PARA VER MAIS</span>
          <motion.div className="h-8 w-px bg-muted-foreground/40" animate={{ scaleY: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
        </motion.div>
      </section>

      {/* ───── PORTFOLIO ───── */}
      {projects.length > 0 && (
        <section id="portfolio" className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <AnimatedSection className="mb-16 text-center">
              <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Portfólio</span>
              <h2 className="mt-4 font-display text-4xl font-light tracking-[0.1em] text-foreground sm:text-5xl md:text-6xl">Nossos Trabalhos</h2>
              <p className="mt-4 text-sm text-muted-foreground max-w-lg mx-auto">Cada projeto conta uma história. Explore alguns dos nossos trabalhos mais recentes.</p>
            </AnimatedSection>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, i) => (
                <PortfolioCard key={project.id} project={project} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───── POR QUE NOS ESCOLHER ───── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="mb-16 text-center">
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Diferenciais</span>
            <h2 className="mt-4 font-display text-4xl font-light tracking-[0.1em] text-foreground sm:text-5xl md:text-6xl">Por que nos escolher</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
            {reasons.map((reason, i) => (
              <AnimatedSection key={reason.title} delay={i * 0.15}>
                <div className="group flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center border border-border transition-colors duration-300 group-hover:border-foreground">
                      <reason.icon className="h-5 w-5 text-muted-foreground transition-colors duration-300 group-hover:text-foreground" strokeWidth={1} />
                    </div>
                    <h3 className="font-display text-xl font-light tracking-wide text-foreground">{reason.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground pl-16">{reason.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CONTATO / INSTAGRAM ───── */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <AnimatedSection>
            <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Contato</span>
            <h2 className="mt-4 font-display text-4xl font-light tracking-[0.1em] text-foreground sm:text-5xl md:text-6xl">Vamos criar juntos</h2>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground max-w-md mx-auto">Entre em contato pelo nosso Instagram para orçamentos, dúvidas ou apenas para dizer olá.</p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 border border-foreground px-10 py-4 text-xs uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                Siga-nos no Instagram
              </a>
              <span className="text-xs text-muted-foreground">@gofocus.br</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-display text-sm tracking-[0.1em] text-foreground">GoFocus</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">© {new Date().getFullYear()} GoFocus — Todos os direitos reservados</span>
        </div>
      </footer>
    </div>
  );
};

function PortfolioCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const coverUrl = project.photos?.[project.coverIndex || 0];

  if (!coverUrl) return null;

  return (
    <motion.a ref={ref} href={`/projeto/${project.id}`} className="group relative overflow-hidden cursor-pointer block" initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }} transition={{ duration: 0.7, delay: index * 0.1 }}>
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={coverUrl} alt={project.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-background/80 via-background/0 to-transparent pb-8 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="font-display text-xl tracking-wide text-foreground">{project.clientName}</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{project.photos?.length || 0} foto{(project.photos?.length || 0) > 1 ? "s" : ""}</span>
        </div>
      </div>
    </motion.a>
  );
}

export default Index;
