import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, Image, X, Loader2,
  Calendar, MapPin, Camera,
} from "lucide-react";
import WatermarkOverlay from "@/components/admin/WatermarkOverlay";
import type { Evento, Foto } from "@/types/eventos";

export default function EventoGaleria() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFoto, setPreviewFoto] = useState<Foto | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("eventos").select("*").eq("id", id).single(),
      supabase.from("fotos").select("*").eq("evento_id", id).order("ordem"),
    ]).then(([evRes, ftRes]) => {
      if (evRes.data) setEvento(evRes.data as Evento);
      if (ftRes.data) setFotos(ftRes.data as Foto[]);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="w-6 h-6 text-[#e2a820] animate-spin mx-auto" />
          <p className="text-[10px] text-white/30 uppercase tracking-[0.4em]">Carregando galeria...</p>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Image className="w-12 h-12 text-white/10 mx-auto" strokeWidth={1} />
          <p className="text-white/30 text-sm">Evento n&atilde;o encontrado</p>
          <button onClick={() => navigate("/eventos")} className="text-[10px] text-[#e2a820] uppercase tracking-widest">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate("/eventos")}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Eventos
          </button>
          <div className="h-5 w-px bg-white/10" />
          <div className="flex-1">
          <h1 className="font-serif text-2xl text-white/90">{evento.titulo}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-white/30">
                  {evento.data_evento && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(evento.data_evento).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {evento.local && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {evento.local}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    {fotos.length} foto{fotos.length !== 1 ? "s" : ""}
                  </span>
                  {evento.watermark_enabled && (
                    <span className="text-[9px] text-white/20 uppercase tracking-widest border border-white/10 px-1.5 py-0.5 rounded">
                      Com marca d'&aacute;gua
                    </span>
                  )}
                </div>
          </div>
        </motion.div>

        {fotos.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <Image className="w-12 h-12 text-white/10 mx-auto" strokeWidth={1} />
            <p className="text-white/20 uppercase tracking-[0.2em] text-[10px]">Nenhuma foto dispon&iacute;vel</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {fotos.map((foto, idx) => (
                <motion.div
                  key={foto.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all hover:ring-1 hover:ring-white/20"
                  onClick={() => setPreviewFoto(foto)}
                >
                  <img
                    src={foto.url_thumbnail || foto.url_original}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {evento && <WatermarkOverlay evento={evento} />}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewFoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewFoto(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full"
            >
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={previewFoto.url_original}
                  alt=""
                  className="w-full"
                />
                {evento && <WatermarkOverlay evento={evento} />}
              </div>
              <button
                onClick={() => setPreviewFoto(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
