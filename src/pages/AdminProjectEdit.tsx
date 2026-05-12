import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProjectsAsync, updateProjectAsync, getCategoriesAsync,
  type Project, type ProjectPhoto, type Category,
} from "@/lib/storage";
import { uploadToImageKit, getOptimizedUrl, deleteFromImageKit } from "@/lib/imagekit";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Plus, Trash2, Copy, Check, Loader2,
  ExternalLink, Tag, Image as ImageIcon, X, Calendar, Edit2
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, MouseSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortablePhotoProps {
  photo: ProjectPhoto;
  index: number;
  isSelected: boolean;
  isCover: boolean;
  toggleSelect: (index: number) => void;
  handleSetCover: (index: number, e: React.MouseEvent) => void;
  handleRemoveSingle: (index: number, e: React.MouseEvent) => void;
  updateDividerDate?: (index: number, newDate: string) => void;
  insertDividerBefore?: (index: number) => void;
}

const DividerItem = ({ photo, index, handleRemoveSingle, updateDividerDate }: SortablePhotoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState(photo.date || "");

  // Sync with parent when photo.date changes externally
  useEffect(() => {
    setTempDate(photo.date || "");
  }, [photo.date]);

  return (
    <div className="w-full py-8 group">
      <div className="flex items-center gap-6">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/5" />
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-6 py-3 rounded-sm group-hover:border-white/30 transition-all duration-500">
          <Calendar className="h-4 w-4 text-white/40" />
          {isEditing ? (
            <input
              type="text"
              autoFocus
              value={tempDate}
              onChange={(e) => setTempDate(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
                if (updateDividerDate) updateDividerDate(index, tempDate);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditing(false);
                  if (updateDividerDate) updateDividerDate(index, tempDate);
                }
              }}
              className="bg-transparent text-sm font-serif italic outline-none border-b border-white/20 w-44 text-white/90"
            />
          ) : (
            <span
              className="text-xs font-serif italic tracking-[0.2em] text-white/80 uppercase cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {photo.date || "Nova Divisória"}
            </span>
          )}
          <div className="flex items-center gap-1 ml-3 pl-3 border-l border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="p-1.5 hover:text-white text-white/30 transition-colors" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              className="p-1.5 hover:text-red-400 text-white/30 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleRemoveSingle(index, e); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/5" />
      </div>
    </div>
  );
};

const SortablePhoto = ({ photo, index, isSelected, isCover, toggleSelect, handleSetCover, handleRemoveSingle, insertDividerBefore }: SortablePhotoProps) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({ id: photo.url });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 1,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={dndStyle} className="w-1/2 sm:w-1/4 md:w-1/5 lg:w-[16.666%] xl:w-[12.5%] p-1">
      <div
        className={`group relative aspect-[3/4] overflow-hidden rounded-sm bg-white/4 cursor-grab active:cursor-grabbing transition-shadow duration-300 ${
          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:ring-1 hover:ring-white/20'
        }`}
        onClick={(e) => {
           if((e.target as HTMLElement).closest('.action-btn')) return;
           toggleSelect(index);
        }}
        {...attributes}
        {...listeners}
      >
        <img
          src={getOptimizedUrl(photo.url, 400)}
          alt=""
          className={`h-full w-full object-cover transition-all duration-500 pointer-events-none ${
              isSelected ? 'scale-105 opacity-50' : 'opacity-80 group-hover:opacity-100'
          }`}
          loading="lazy"
        />

        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
           <div className="bg-white rounded-full p-2 text-black">
              <Check className="h-4 w-4" strokeWidth={3} />
           </div>
        </div>

        <div className={`absolute inset-0 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto ${isSelected ? 'opacity-0' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
          <button
            className="action-btn absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-sm transition-all shadow-xl bg-black/60 text-white/70 hover:bg-white hover:text-black active:scale-90"
            onClick={(e) => { e.stopPropagation(); handleSetCover(index, e); }} title="Definir capa">
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
          <button
            className="action-btn absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-sm text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-xl bg-black/40 active:scale-90"
            onClick={(e) => { e.stopPropagation(); handleRemoveSingle(index, e); }} title="Remover foto">
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {insertDividerBefore && (
            <button
              className="action-btn absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-sm bg-black/70 text-white/70 hover:bg-white hover:text-black transition-all shadow-xl text-[8px] font-bold uppercase tracking-wider whitespace-nowrap"
              onClick={(e) => { e.stopPropagation(); insertDividerBefore(index); }}
              title="Inserir divisória antes desta foto"
            >
              <Calendar className="h-3 w-3" />
              Data aqui
            </button>
          )}
        </div>

        {isCover && (
          <div className="absolute bottom-7 left-1.5 bg-white/90 px-2 py-0.5 rounded-sm">
            <span className="text-[7px] font-bold uppercase tracking-wider text-black">Imagem de Capa</span>
          </div>
        )}

        <div className="absolute bottom-1.5 right-1.5">
          <span className="text-[8px] tabular-nums text-white/20 font-bold tracking-tighter">
            {String(index + 1).padStart(2, "00")}
          </span>
        </div>
      </div>
    </div>
  );
};


/* ── Confirm Dialog ── */
const ConfirmDialog = ({ message, onConfirm, onCancel }: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => (
  <motion.div
    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {/* Backdrop */}
    <motion.div
      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      onClick={onCancel}
    />
    {/* Modal */}
    <motion.div
      className="relative z-10 w-full max-w-sm bg-[#111] border border-white/10 rounded-sm p-8 shadow-2xl"
      initial={{ scale: 0.92, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.92, opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      <div className="flex flex-col items-center text-center gap-6">
        <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Trash2 className="h-6 w-6 text-red-400" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">Confirmar exclusão</h3>
          <p className="text-[11px] text-white/50 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-white/10 rounded-sm text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:border-white/25 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-red-500 rounded-sm text-[10px] font-bold uppercase tracking-widest text-white hover:bg-red-600 transition-all active:scale-95"
          >
            Excluir
          </button>
        </div>
      </div>
    </motion.div>
  </motion.div>
);


const AdminProjectEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    total: number; current: number; isUploading: boolean;
  }>({ total: 0, current: 0, isUploading: false });
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const openConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };
  const closeConfirm = () => setConfirmDialog(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loading: authLoading } = useAuth();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !project) return;
    if (active.id === over.id) return;

    // Only reorder photos (not dividers)
    const allPhotos = project.photos;
    const photosOnly = allPhotos.filter(p => !p.isDivider);
    const oldIdx = photosOnly.findIndex(p => p.url === active.id);
    const newIdx = photosOnly.findIndex(p => p.url === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reorderedPhotos = arrayMove(photosOnly, oldIdx, newIdx);

    // Rebuild full array: keep dividers at their original slots, replace photo slots in order
    let photoPtr = 0;
    const newPhotos = allPhotos.map(item =>
      item.isDivider ? item : reorderedPhotos[photoPtr++]
    );

    const oldCoverPhoto = allPhotos[project.coverIndex || 0];
    const newCoverIndex = newPhotos.findIndex(p => p.url === oldCoverPhoto?.url);

    setProject({ ...project, photos: newPhotos, coverIndex: Math.max(0, newCoverIndex) });
    setSelectedIndices(new Set());

    try {
      await updateProjectAsync(project.id, { photos: newPhotos, coverIndex: Math.max(0, newCoverIndex) });
    } catch {
      toast.error("Erro ao salvar nova ordem");
    }
  };


  useEffect(() => {
    if (id) { loadProject(); loadCategories(); }
  }, [id]);

  const loadCategories = async () => {
    const data = await getCategoriesAsync();
    setCategories(data);
  };

  const loadProject = async () => {
    try {
      const projects = await getProjectsAsync();
      const found = projects.find((p) => p.id === id);
      if (found) { setProject(found); }
      else { navigate("/admin/dashboard"); }
    } catch { navigate("/admin/dashboard"); }
    finally { setLoading(false); }
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !project) return;
    setUploadStatus({ total: files.length, current: 0, isUploading: true });
    try {
      const MAX_SIZE = 25 * 1024 * 1024;
      const oversized = (files as File[]).filter((f) => f.size > MAX_SIZE);
      if (oversized.length > 0) {
        toast.error(`Arquivo(s) muito grandes. Limite: 25MB.`);
        setUploadStatus({ total: 0, current: 0, isUploading: false });
        return;
      }

      const BATCH_SIZE = 3;
      const uploaded: typeof project.photos = [];
      let failed = 0;

      // Upload in batches of 3 to avoid overwhelming the server
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batch.map(async (file) => {
            // Retry up to 2 times on failure
            for (let attempt = 1; attempt <= 2; attempt++) {
              try {
                const u = await uploadToImageKit(file, `gofocus/${project.slug}`);
                setUploadStatus((prev) => ({ ...prev, current: prev.current + 1 }));
                return u;
              } catch (err) {
                if (attempt === 2) throw err;
                await new Promise(res => setTimeout(res, 1000 * attempt)); // wait before retry
              }
            }
          })
        );

        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            uploaded.push(result.value);
          } else {
            failed++;
          }
        });

        // Save progress after each batch so photos aren't lost on failure
        if (uploaded.length > 0) {
          const partial = [...(project.photos || []), ...uploaded];
          await updateProjectAsync(project.id, { photos: partial });
          setProject(prev => prev ? { ...prev, photos: partial } : prev);
        }
      }

      if (failed > 0) {
        toast.warning(`${uploaded.length} foto(s) enviada(s). ${failed} falharam — tente novamente.`);
      } else {
        toast.success(`${uploaded.length} foto(s) adicionada(s)!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro no upload");
    } finally {
      setTimeout(() => {
        setUploadStatus({ total: 0, current: 0, isUploading: false });
        if (fileInputRef.current) fileInputRef.current.value = "";
      }, 2000);
    }
  };


  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleRemoveSelected = async () => {
    if (!project || selectedIndices.size === 0) return;
    openConfirm(
      `Tem certeza que deseja excluir as ${selectedIndices.size} fotos selecionadas? Esta ação não pode ser desfeita.`,
      async () => {
        closeConfirm();
        setIsDeletingBulk(true);
        const photosToRemove = Array.from(selectedIndices).map(idx => project.photos[idx]);
        const updatedPhotos = project.photos.filter((_, idx) => !selectedIndices.has(idx));
        let newCoverIndex = project.coverIndex || 0;
        if (selectedIndices.has(newCoverIndex)) {
          newCoverIndex = 0;
        } else {
          const shifted = Array.from(selectedIndices).filter(idx => idx < (project.coverIndex || 0)).length;
          newCoverIndex = Math.max(0, (project.coverIndex || 0) - shifted);
        }
        try {
          const deletePromises = photosToRemove
            .filter(p => p.publicId)
            .map(p => deleteFromImageKit(p.publicId));
          await Promise.all(deletePromises);
          await updateProjectAsync(project.id, { photos: updatedPhotos, coverIndex: newCoverIndex });
          setProject({ ...project, photos: updatedPhotos, coverIndex: newCoverIndex });
          setSelectedIndices(new Set());
          toast.success(`${photosToRemove.length} fotos removidas`);
        } catch {
          toast.error("Erro ao remover fotos");
        } finally {
          setIsDeletingBulk(false);
        }
      }
    );
  };

  const handleSetCover = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!project) return;
    try {
      await updateProjectAsync(project.id, { coverIndex: index });
      setProject({ ...project, coverIndex: index });
      toast.success("Capa atualizada!");
    } catch { toast.error("Erro ao atualizar capa"); }
  };

  const handleRemoveSingle = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!project) return;
    openConfirm(
      "Tem certeza que deseja remover esta foto? Esta ação não pode ser desfeita.",
      async () => {
        closeConfirm();
        const photoToRemove = project.photos[index];
        const updatedPhotos = project.photos.filter((_, i) => i !== index);
        let newCoverIndex = project.coverIndex || 0;
        if (index === newCoverIndex) newCoverIndex = 0;
        else if (index < newCoverIndex) newCoverIndex--;
        try {
          if (photoToRemove.publicId) await deleteFromImageKit(photoToRemove.publicId);
          await updateProjectAsync(project.id, { photos: updatedPhotos, coverIndex: newCoverIndex });
          setProject({ ...project, photos: updatedPhotos, coverIndex: newCoverIndex });
          const newSelected = new Set<number>();
          selectedIndices.forEach(idx => {
            if (idx === index) return;
            newSelected.add(idx > index ? idx - 1 : idx);
          });
          setSelectedIndices(newSelected);
          toast.success("Foto removida");
        } catch { toast.error("Erro ao remover foto"); }
      }
    );
  };

  const handleAddDivider = async () => {
    if (!project) return;
    const dividerId = `divider-${Date.now()}`;
    const newDivider: ProjectPhoto = {
      url: dividerId,
      publicId: "",
      isDivider: true,
      date: "Nova Data"
    };
    
    const updatedPhotos = [...(project.photos || []), newDivider];
    try {
      await updateProjectAsync(project.id, { photos: updatedPhotos });
      setProject({ ...project, photos: updatedPhotos });
      toast.success("Divisória adicionada");
    } catch {
      toast.error("Erro ao adicionar divisória");
    }
  };

  const updateDividerDate = async (index: number, newDate: string) => {
    if (!project) return;
    const updatedPhotos = [...project.photos];
    updatedPhotos[index] = { ...updatedPhotos[index], date: newDate };
    
    try {
      await updateProjectAsync(project.id, { photos: updatedPhotos });
      setProject({ ...project, photos: updatedPhotos });
      toast.success("Data atualizada");
    } catch {
      toast.error("Erro ao atualizar data");
    }
  };

  const insertDividerBefore = async (index: number) => {
    if (!project) return;
    const dividerId = `divider-${Date.now()}`;
    const newDivider: ProjectPhoto = {
      url: dividerId,
      publicId: "",
      isDivider: true,
      date: "Nova Data"
    };
    const updatedPhotos = [...project.photos];
    updatedPhotos.splice(index, 0, newDivider);
    try {
      await updateProjectAsync(project.id, { photos: updatedPhotos });
      setProject({ ...project, photos: updatedPhotos });
      toast.success("Divisória inserida!");
    } catch {
      toast.error("Erro ao inserir divisória");
    }
  };

  const handleCopyLink = () => {
    if (!project) return;
    navigator.clipboard.writeText(`${window.location.origin}/cliente/${project.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateName = async (newName: string) => {
    if (!project || !newName.trim() || newName === project.clientName) return;
    try {
      await updateProjectAsync(project.id, { clientName: newName.trim() });
      setProject({ ...project, clientName: newName.trim() });
      toast.success("Nome atualizado");
    } catch { toast.error("Erro ao atualizar nome"); }
  };

  const updateCategory = async (categoryId: string) => {
    if (!project || categoryId === project.categoryId) return;
    try {
      const idToStore = categoryId === "none" ? undefined : categoryId;
      await updateProjectAsync(project.id, { categoryId: idToStore });
      setProject({ ...project, categoryId: idToStore });
      toast.success("Categoria atualizada");
    } catch { toast.error("Erro ao atualizar categoria"); }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-5 w-5 animate-spin text-white/30" />
      </div>
    );
  }

  if (!project) return null;
  const photos = project.photos || [];

  const activePhoto = activeId ? photos.find(p => p.url === activeId) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white/10 pb-24">
      <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <input
              type="text"
              defaultValue={project.clientName}
              onBlur={(e) => updateName(e.target.value)}
              className="bg-transparent font-serif text-base sm:text-lg text-white/85 outline-none border-b border-transparent focus:border-white/20 transition-colors min-w-0 truncate max-w-[140px] sm:max-w-xs"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Category Select */}
            <div className="hidden md:block">
              <Select value={project.categoryId || "none"} onValueChange={updateCategory}>
                <SelectTrigger className="h-8 w-[140px] bg-transparent border-white/10 text-[9px] font-semibold uppercase tracking-wider text-white/50 focus:ring-0 focus:ring-offset-0">
                  <Tag className="h-3 w-3 mr-2 text-white/30" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-white/10 text-white">
                  <SelectItem value="none" className="text-[9px] uppercase tracking-wider focus:bg-white/10 focus:text-white">Sem Categoria</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-[9px] uppercase tracking-wider focus:bg-white/10 focus:text-white">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-3 py-1.5 border border-white/8 rounded-sm text-[9px] font-semibold uppercase tracking-wider text-white/40 hover:text-white hover:border-white/20 transition-colors">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span className="hidden sm:inline">{copied ? "Copiado" : "Copiar link"}</span>
            </button>
            <a href={`/cliente/${project.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-sm text-[9px] font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity">
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">Ver prévia</span>
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6 sm:py-8">
        
        <AnimatePresence>
          {selectedIndices.size > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <div className="bg-white/[0.03] border border-white/10 p-4 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-sm">{selectedIndices.size}</div>
                   <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">Fotos Selecionadas</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button onClick={() => setSelectedIndices(new Set())} className="flex-1 sm:flex-none text-[9px] uppercase tracking-widest text-white/30 hover:text-white transition-colors px-4 py-2">Cancelar</button>
                  <button onClick={handleRemoveSelected} disabled={isDeletingBulk} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-sm text-[9px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 active:scale-95">
                    {isDeletingBulk ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative mb-8 border border-dashed border-white/10 rounded-sm bg-white/[0.015] hover:bg-white/[0.03] transition-colors group overflow-hidden">
          <input
            ref={fileInputRef} type="file" multiple accept="image/*"
            onChange={handleAddPhotos}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={uploadStatus.isUploading}
          />
          <div className="flex flex-col items-center justify-center py-10 sm:py-14 text-center">
             <div className="h-10 w-10 mb-4 rounded-sm border border-white/10 flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform duration-300">
                {uploadStatus.isUploading ? <Loader2 className="h-5 w-5 animate-spin text-white/40" /> : <Plus className="h-5 w-5 text-white/30" />}
             </div>
             <p className="text-[11px] uppercase tracking-[0.4em] text-white/50 group-hover:text-white transition-colors">
                {uploadStatus.isUploading ? `Enviando ${uploadStatus.current}/${uploadStatus.total}` : 'Adicionar Novas Fotos'}
             </p>
          </div>
          {uploadStatus.isUploading && (
            <motion.div className="absolute bottom-0 left-0 h-0.5 bg-white" initial={{ width: 0 }} animate={{ width: `${(uploadStatus.current / uploadStatus.total) * 100}%` }} transition={{ type: "spring", bounce: 0, duration: 0.4 }} />
          )}
        </div>



        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/6 rounded-sm">
            <ImageIcon className="h-7 w-7 text-white/10 mb-3" strokeWidth={1} />
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">Nenhuma foto adicionada.</p>
          </div>
        ) : (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={photos.filter(p => !p.isDivider).map(p => p.url)} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap">
                {photos.map((photo, index) => (
                  photo.isDivider ? (
                    <DividerItem
                      key={photo.url}
                      photo={photo}
                      index={index}
                      isSelected={false}
                      isCover={false}
                      toggleSelect={() => {}}
                      handleSetCover={() => {}}
                      handleRemoveSingle={handleRemoveSingle}
                      updateDividerDate={updateDividerDate}
                    />
                  ) : (
                    <SortablePhoto
                      key={photo.url}
                      photo={photo}
                      index={index}
                      isSelected={selectedIndices.has(index)}
                      isCover={project.coverIndex === index}
                      toggleSelect={toggleSelect}
                      handleSetCover={handleSetCover}
                      handleRemoveSingle={handleRemoveSingle}
                      insertDividerBefore={insertDividerBefore}
                    />
                  )
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
              {activePhoto && !activePhoto.isDivider ? (
                <div style={{ transform: 'scale(1.12) rotate(2deg)', boxShadow: '0px 30px 60px rgba(0,0,0,0.9)' }} className="relative aspect-[3/4] w-24 overflow-hidden rounded-sm cursor-grabbing">
                  <img src={getOptimizedUrl(activePhoto.url, 400)} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Botão de divisória — SEMPRE visível abaixo das fotos */}
        <button
          onClick={handleAddDivider}
          className="mt-6 w-full flex items-center justify-center gap-3 py-5 border border-dashed border-white/15 rounded-sm text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 hover:text-white hover:border-white/40 hover:bg-white/[0.04] active:scale-[0.99] transition-all duration-300 group"
        >
          <Calendar className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Adicionar Divisória de Data
        </button>
      </div>

      <AnimatePresence>
        {uploadStatus.isUploading && (
           <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-0 left-0 right-0 z-50 bg-white text-black py-3 px-6 flex items-center justify-center gap-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Enviando Arquivos — {Math.round((uploadStatus.current / uploadStatus.total) * 100)}%</span>
           </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog && (
          <ConfirmDialog
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={closeConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProjectEdit;
