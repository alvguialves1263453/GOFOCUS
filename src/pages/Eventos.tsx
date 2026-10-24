import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  Calendar, MapPin, Image, ArrowRight, Camera, Search, ArrowLeft,
} from "lucide-react";
import type { Evento } from "@/types/eventos";

export default function Eventos() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("eventos")
      .select("*")
      .eq("status", "ativo")
      .order("data_evento", { ascending: false, nullsLast: true })
      .then(({ data }) => {
        if (data) setEventos(data as Evento[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/30 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Início
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#e2a820]/10 flex items-center justify-center mx-auto mb-5">
            <Camera className="w-6 h-6 text-[#e2a820]" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-white/90 mb-3">
            Eventos
          </h1>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Explore as galerias dos eventos e escolha suas fotos favoritas
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : eventos.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <Image className="w-12 h-12 text-white/10 mx-auto" strokeWidth={1} />
            <p className="text-white/20 uppercase tracking-[0.2em] text-[10px]">
              Nenhum evento dispon&iacute;vel no momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento, idx) => (
              <motion.div
                key={evento.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/eventos/${evento.id}`)}
                className="group cursor-pointer rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden hover:border-white/15 transition-all"
              >
                <div className="relative aspect-[4/3] bg-white/5 overflow-hidden">
                  {evento.capa_url ? (
                    <img
                      src={evento.capa_url}
                      alt={evento.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Camera className="w-10 h-10 text-white/10" strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h2 className="font-serif text-xl text-white drop-shadow-lg">
                      {evento.titulo}
                    </h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-white/60">
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
                    </div>
                  </div>
                </div>
                <div className="p-5 flex items-center justify-end">
                  <span className="flex items-center gap-1 text-[10px] text-white/40 group-hover:text-[#e2a820] uppercase tracking-widest font-semibold transition-colors">
                    Ver galeria <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
