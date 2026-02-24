import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchProjectById, type Project } from "@/lib/supabase-helpers";
import { Loader2 } from "lucide-react";

const ClientPreview = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchProjectById(id)
      .then((data) => {
        if (data) setProject(data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  const photos = project.photos || [];

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div className="mb-16 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">GoFocus</p>
            <h1 className="font-display text-4xl font-light tracking-[0.1em] text-foreground sm:text-5xl">{project.title}</h1>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, index) => (
              <motion.div key={photo.id} className="group relative overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.6 }}>
                <img src={photo.image_url} alt={`${project.title} - Foto ${index + 1}`} className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 flex items-end justify-center bg-background/0 pb-6 opacity-0 transition-all duration-300 group-hover:bg-background/40 group-hover:opacity-100">
                  <a href={photo.image_url} target="_blank" rel="noopener noreferrer" download className="border border-foreground bg-background/80 px-5 py-2 text-[10px] uppercase tracking-[0.3em] text-foreground backdrop-blur-sm transition-colors hover:bg-foreground hover:text-background">
                    Baixar Foto
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div className="mt-20 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">© {new Date().getFullYear()} GoFocus — Todos os direitos reservados</p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ClientPreview;
