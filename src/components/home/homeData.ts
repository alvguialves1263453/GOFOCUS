import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCategoriesAsync, getProjectsAsync, type Category, type Project } from "@/lib/storage";

export interface EventoResumo {
  id: string;
  titulo: string;
  data_evento: string | null;
  local: string | null;
  capa_url: string | null;
}

/** One photo shown in the hero or the tunnel, tied to the album it opens. */
export interface HomePhoto {
  key: string;
  url: string;
  albumName: string;
  href: string;
}

/** Resized image URL for ImageKit or Cloudinary; other hosts pass through. */
export function thumb(url: string, width: number): string {
  if (!url) return url;
  if (url.includes("ik.imagekit.io")) {
    const tr = `tr=w-${width},q-80,f-auto`;
    return url.includes("?") ? `${url}&${tr}` : `${url}?${tr}`;
  }
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
  }
  return url;
}

/** Small, already-blurred copy made by the image host, for out-of-focus looks without CSS filters. */
export function softThumb(url: string): string {
  if (!url) return url;
  if (url.includes("ik.imagekit.io")) {
    const tr = "tr=w-200,q-60,bl-10";
    return url.includes("?") ? `${url}&${tr}` : `${url}?${tr}`;
  }
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/w_200,q_auto,e_blur:900/");
  }
  return thumb(url, 64);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function realPhotos(project: Project) {
  return (project.photos || []).filter((p) => p.url && !p.isDivider);
}

/** Cover plus photos spread evenly across the album: what one booth strip prints. */
export function stripPhotos(project: Project, frames = 4): string[] {
  const cover = coverOf(project);
  const rest = realPhotos(project).filter((p) => p.url !== cover?.url);
  const picks = cover ? [cover.url] : [];
  const step = rest.length / Math.max(1, frames - picks.length);
  for (let i = 0; picks.length < frames && i < rest.length; i++) {
    const p = rest[Math.min(rest.length - 1, Math.floor(i * step + step / 2))];
    if (p && !picks.includes(p.url)) picks.push(p.url);
    if (i * step >= rest.length) break;
  }
  return picks;
}

export function coverOf(project: Project) {
  const photos = project.photos || [];
  const cover = photos[project.coverIndex || 0];
  return cover?.url && !cover.isDivider ? cover : realPhotos(project)[0];
}

/**
 * Interleaves albums so neighbouring photos come from different albums:
 * cover of each album first, then a second photo of each, and so on.
 */
function buildPhotoStream(projects: Project[], perAlbum: number): HomePhoto[] {
  const columns = projects.map((p) => {
    const cover = coverOf(p);
    const rest = realPhotos(p).filter((ph) => ph.url !== cover?.url);
    const step = Math.max(1, Math.floor(rest.length / perAlbum));
    const picks = [cover, ...rest.filter((_, i) => i % step === 0)].filter(Boolean).slice(0, perAlbum);
    return picks.map((ph, i) => ({
      key: `${p.id}-${i}`,
      url: ph!.url,
      albumName: p.clientName,
      href: `/projeto/${p.id}`,
    }));
  });
  const stream: HomePhoto[] = [];
  for (let round = 0; round < perAlbum; round++) {
    for (const col of columns) if (col[round]) stream.push(col[round]);
  }
  return stream;
}

export function useHomeData() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [eventos, setEventos] = useState<EventoResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const albums = Promise.all([getProjectsAsync(), getCategoriesAsync()]).then(([p, c]) => {
      if (!alive) return;
      setProjects(p.filter((x) => !x.hidden && coverOf(x)));
      setCategories(c);
    });
    const events = supabase
      .from("eventos")
      .select("id, titulo, data_evento, local, capa_url")
      .eq("status", "ativo")
      .order("data_evento", { ascending: false, nullsFirst: false })
      .limit(8)
      .then(({ data }) => {
        if (alive && data) setEventos(data as EventoResumo[]);
      });
    Promise.allSettled([albums, events]).then(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const stream = useMemo(() => buildPhotoStream(projects, 3), [projects]);
  // More photos per album for the home wall, interleaved so neighbours differ.
  const wall = useMemo(() => buildPhotoStream(projects, 7), [projects]);

  return { projects, categories, eventos, loading, stream, wall };
}
