import { useEffect } from "react";
import { useHomeData } from "@/components/home/homeData";
import { useSmoothScroll } from "@/components/home/useSmoothScroll";
import {
  Albums,
  Contact,
  Events,
  Footer,
  Hero,
  Services,
  TopBar,
  Videos,
  WordBand,
} from "@/components/inicio/InicioSections";

// The browser would otherwise put a reloaded page back where it was, which
// makes the home jump down while the headline is still animating.
if (typeof history !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const Index = () => {
  const { projects, categories, eventos, loading } = useHomeData();
  const lenis = useSmoothScroll();

  // Always open at the top. While the page loads, the browser and the smooth
  // scroll can move the page on their own (back to where a reload left it,
  // or as the photos arrive), so for the first seconds any scroll that the
  // visitor did not make is undone.
  useEffect(() => {
    if (window.location.hash) return;
    let userMoved = false;
    const started = performance.now();
    const markUser = () => {
      userMoved = true;
    };
    const toTop = () => {
      window.scrollTo(0, 0);
      lenis.current?.scrollTo(0, { immediate: true, force: true });
    };
    const onScroll = () => {
      if (userMoved || performance.now() - started > 4000) return;
      if (window.scrollY !== 0) toTop();
    };
    const inputs = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    inputs.forEach((type) => window.addEventListener(type, markUser, { passive: true }));
    window.addEventListener("scroll", onScroll, { passive: true });
    toTop();
    return () => {
      inputs.forEach((type) => window.removeEventListener(type, markUser));
      window.removeEventListener("scroll", onScroll);
    };
  }, [lenis]);

  // Honour links like "/#portfolio" from other pages once the albums are in,
  // then drop the hash so a reload starts at the top again.
  useEffect(() => {
    if (loading || window.location.hash !== "#portfolio") return;
    const id = requestAnimationFrame(() => {
      const target = document.getElementById("portfolio");
      if (!target) return;
      if (lenis.current) lenis.current.scrollTo(target, { immediate: true });
      else target.scrollIntoView();
      history.replaceState(null, "", window.location.pathname + window.location.search);
    });
    return () => cancelAnimationFrame(id);
  }, [loading, lenis]);

  return (
    <div className="inicio min-h-screen bg-[#0a0a0a] font-body text-[#f5f4f0] antialiased">
      <a
        href="#conteudo"
        className="sr-only z-[110] rounded-full bg-white px-5 py-3 text-sm font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <TopBar />
      <main id="conteudo">
        <Hero projects={projects} />
        <Albums projects={projects} categories={categories} />
        <Services />
        <WordBand />
        <Videos />
        <Events eventos={eventos} />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
