import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getProjectBySlug, type Project } from "@/lib/storage";

const ClientPreview = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const found = getProjectBySlug(slug);
    if (found) {
      setProject(found);
    } else {
      setNotFound(true);
    }
  }, [slug]);

  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    const ext = dataUrl.includes("image/png") ? "png" : "jpg";
    link.download = `${project?.clientName || "foto"}-${index + 1}.${ext}`;
    link.click();
  };

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              GoFocus
            </p>
            <h1 className="font-display text-4xl font-light tracking-[0.1em] text-foreground sm:text-5xl">
              {project.clientName}
            </h1>
          </motion.div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {project.photos.map((photo, index) => (
              <motion.div
                key={index}
                className="group relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <img
                  src={photo}
                  alt={`${project.clientName} - Foto ${index + 1}`}
                  className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-end justify-center bg-background/0 pb-6 opacity-0 transition-all duration-300 group-hover:bg-background/40 group-hover:opacity-100">
                  <button
                    onClick={() => handleDownload(photo, index)}
                    className="border border-foreground bg-background/80 px-5 py-2 text-[10px] uppercase tracking-[0.3em] text-foreground backdrop-blur-sm transition-colors hover:bg-foreground hover:text-background"
                  >
                    Baixar Foto
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              © {new Date().getFullYear()} GoFocus — Todos os direitos reservados
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ClientPreview;
