import { useEffect } from "react";
import PhotoBooth from "@/components/home/PhotoBooth";
import StripWall from "@/components/home/StripWall";
import { Contact, Differentials, EventsRow, Footer } from "@/components/home/HomeSections";
import { useHomeData } from "@/components/home/homeData";
import { useSmoothScroll } from "@/components/home/useSmoothScroll";

const Index = () => {
  const { projects, categories, eventos, loading } = useHomeData();
  const lenis = useSmoothScroll();

  // Honour links like "/#portfolio" from other pages once the strips are in.
  useEffect(() => {
    if (loading || window.location.hash !== "#portfolio") return;
    const id = requestAnimationFrame(() => {
      const target = document.getElementById("portfolio");
      if (!target) return;
      if (lenis.current) lenis.current.scrollTo(target, { immediate: true });
      else target.scrollIntoView();
    });
    return () => cancelAnimationFrame(id);
  }, [loading, lenis]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] font-archivo">
      <a
        href="#conteudo"
        className="sr-only z-[110] rounded-full bg-[#141414] px-5 py-3 text-sm font-semibold text-[#A7AAAF] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <main id="conteudo">
        <PhotoBooth projects={projects} categories={categories} />
        <StripWall projects={projects} categories={categories} />
        <EventsRow eventos={eventos} />
        <Differentials albums={projects.length} />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
