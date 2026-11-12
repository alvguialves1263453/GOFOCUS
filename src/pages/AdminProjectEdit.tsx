import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProjectsAsync, updateProjectAsync, getCategoriesAsync,
  type Project, type ProjectPhoto, type Category,
} from "@/lib/storage";
import { uploadToImageKit, getOptimizedUrl, deleteFromImageKit } from "@/lib/imagekit";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft, Plus, Trash2, Copy, Check, Loader2,
  ExternalLink, Image as ImageIcon, Calendar, Edit2, X,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminPage, Panel, Field, StatusBadge, EmptyState, LoadingBlock } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
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

/* Small square icon button used on top of photos (40px tap target). */
const tileBtn =
  "action-btn grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-accent";

const DividerItem = ({ photo, index, handleRemoveSingle, updateDividerDate }: SortablePhotoProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempDate, setTempDate] = useState(photo.date || "");

  // Sync with parent when photo.date changes externally
  useEffect(() => {
    setTempDate(photo.date || "");
  }, [photo.date]);

  return (
    <div className="group w-full px-1 py-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
        <div className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-border bg-secondary py-1 pl-3 pr-1 transition-colors duration-150 group-hover:border-input">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {isEditing ? (
            <Input
              type="text"
              autoFocus
              aria-label="Data da divisória"
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
              className="h-10 w-40 rounded-lg text-[15px] sm:w-48"
            />
          ) : (
            <button
              type="button"
              className="min-h-10 min-w-0 truncate rounded-lg px-1 text-left text-[15px] font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setIsEditing(true)}
            >
              {photo.date || "Nova divisória"}
            </button>
          )}
          <div className="flex shrink-0 items-center gap-1 border-l border-border pl-1 transition-opacity duration-150 md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
            <Button type="button" variant="ghost" size="icon" className="rounded-lg" aria-label="Editar data" title="Editar data" onClick={() => setIsEditing(true)}>
              <Edit2 />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-lg text-destructive hover:bg-destructive/15 hover:text-destructive"
              aria-label="Remover divisória"
              title="Remover divisória"
              onClick={(e) => { e.stopPropagation(); handleRemoveSingle(index, e); }}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
        <div className="h-px flex-1 bg-border" aria-hidden="true" />
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

  const number = String(index + 1).padStart(2, "00");

  return (
    <div ref={setNodeRef} style={dndStyle} className="w-1/2 p-1 sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-1/6">
      <div
        className={cn(
          "group relative aspect-[3/4] cursor-grab overflow-hidden rounded-lg bg-muted outline-none transition-shadow duration-200 active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring",
          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:ring-1 hover:ring-input"
        )}
        onClick={(e) => {
           if((e.target as HTMLElement).closest('.action-btn')) return;
           toggleSelect(index);
        }}
        aria-label={`Foto ${number}${isCover ? " (capa)" : ""}${isSelected ? ", selecionada" : ""}. Toque para selecionar, arraste para reordenar.`}
        {...attributes}
        {...listeners}
      >
        <img
          src={getOptimizedUrl(photo.url, 400)}
          alt={`Foto ${number}`}
          className={cn(
            "pointer-events-none h-full w-full object-cover transition-opacity duration-200",
            isSelected ? "opacity-50" : "opacity-100"
          )}
          loading="lazy"
        />

        {/* Selected marker */}
        <div className={cn("pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-150", isSelected ? "opacity-100" : "opacity-0")}>
          <div className="rounded-full bg-primary p-2 text-primary-foreground">
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
          </div>
        </div>

        {/* Top row: cover badge + number */}
        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          {isCover ? <StatusBadge tone="neutral" className="shadow-sm">Capa</StatusBadge> : <span />}
          <span className="rounded-md bg-card px-1.5 py-0.5 text-[12px] font-medium tabular-nums text-muted-foreground">
            {number}
          </span>
        </div>

        {/* Actions: always visible on touch, on hover/focus with a mouse */}
        <div
          className={cn(
            "absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 transition-opacity duration-150",
            isSelected ? "pointer-events-none opacity-0" : "opacity-100 md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100"
          )}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={cn(tileBtn, isCover && "bg-primary text-primary-foreground hover:bg-primary")}
              onClick={(e) => { e.stopPropagation(); handleSetCover(index, e); }}
              aria-label={isCover ? "Esta é a capa" : "Definir como capa"}
              aria-pressed={isCover}
              title="Definir capa"
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            {insertDividerBefore && (
              <button
                type="button"
                className={tileBtn}
                onClick={(e) => { e.stopPropagation(); insertDividerBefore(index); }}
                aria-label="Inserir divisória de data antes desta foto"
                title="Inserir data aqui"
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="button"
            className={cn(tileBtn, "text-destructive hover:bg-destructive hover:text-destructive-foreground")}
            onClick={(e) => { e.stopPropagation(); handleRemoveSingle(index, e); }}
            aria-label="Remover foto"
            title="Remover foto"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};


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
    return <LoadingBlock label="Carregando projeto…" />;
  }

  if (!project) return null;
  const photos = project.photos || [];
  const photoCount = photos.filter(p => !p.isDivider).length;
  const clientPath = `/cliente/${project.slug}`;

  const activePhoto = activeId ? photos.find(p => p.url === activeId) : null;
  const uploadPct = uploadStatus.total > 0 ? Math.round((uploadStatus.current / uploadStatus.total) * 100) : 0;

  return (
    <div style={{ touchAction: 'pan-y' }} className={cn(uploadStatus.isUploading && "pb-16")}>
      <AdminPage
        title={<span className="break-words">{project.clientName}</span>}
        description={`${photoCount} ${photoCount === 1 ? "foto" : "fotos"} · arraste para reordenar, toque para selecionar`}
        back={
          <Button variant="ghost" size="sm" className="-ml-2 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft /> Projetos
          </Button>
        }
        actions={
          <>
            <Button variant="outline" className="rounded-lg" onClick={handleCopyLink}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
            <Button asChild className="rounded-lg">
              <a href={clientPath} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Ver prévia
              </a>
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          {/* Details */}
          <Panel title="Detalhes do projeto" description="As alterações são salvas automaticamente.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome do projeto" htmlFor="project-name" hint="Salvo ao sair do campo.">
                <Input
                  id="project-name"
                  type="text"
                  defaultValue={project.clientName}
                  onBlur={(e) => updateName(e.target.value)}
                  className="rounded-lg text-[15px]"
                />
              </Field>
              <Field label="Categoria" htmlFor="project-category">
                <Select value={project.categoryId || "none"} onValueChange={updateCategory}>
                  <SelectTrigger id="project-category" className="h-10 rounded-lg text-[15px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-[15px]">Sem categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-[15px]">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Link do cliente" className="sm:col-span-2">
                <div className="flex min-w-0 items-center gap-2">
                  <code className="flex h-10 min-w-0 flex-1 items-center truncate rounded-lg border border-border bg-muted px-3 text-[14px] text-muted-foreground">
                    <span className="truncate">{clientPath}</span>
                  </code>
                  <Button variant="secondary" size="icon" className="shrink-0 rounded-lg" onClick={handleCopyLink} aria-label={copied ? "Link copiado" : "Copiar link do cliente"}>
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
              </Field>
            </div>
          </Panel>

          {/* Photos */}
          <Panel
            title="Fotos"
            description={photoCount > 0 ? `${photoCount} ${photoCount === 1 ? "foto" : "fotos"} neste projeto` : undefined}
            bodyClassName="flex flex-col gap-5"
          >
            {/* Upload */}
            <div
              className={cn(
                "group relative overflow-hidden rounded-xl border border-dashed border-input bg-muted transition-colors duration-150 focus-within:ring-2 focus-within:ring-ring",
                uploadStatus.isUploading ? "cursor-progress" : "hover:bg-accent"
              )}
            >
              <input
                ref={fileInputRef} type="file" multiple accept="image/*"
                onChange={handleAddPhotos}
                aria-label="Adicionar fotos"
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-progress"
                disabled={uploadStatus.isUploading}
              />
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-secondary text-muted-foreground">
                  {uploadStatus.isUploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
                </div>
                <p className="text-[15px] font-medium text-foreground" aria-live="polite">
                  {uploadStatus.isUploading ? `Enviando ${uploadStatus.current}/${uploadStatus.total}` : 'Adicionar novas fotos'}
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {uploadStatus.isUploading ? `${uploadPct}% concluído` : 'Clique ou arraste imagens até aqui · até 25MB por arquivo'}
                </p>
              </div>
              {uploadStatus.isUploading && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-secondary" aria-hidden="true">
                  <div className="h-full bg-primary transition-[width] duration-200 ease-out" style={{ width: `${uploadPct}%` }} />
                </div>
              )}
            </div>

            {/* Selection bar */}
            {selectedIndices.size > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-[15px] font-medium text-foreground" aria-live="polite">
                  <span className="rounded-md bg-primary px-2 py-0.5 text-[13px] font-semibold tabular-nums text-primary-foreground">{selectedIndices.size}</span>
                  {selectedIndices.size === 1 ? "foto selecionada" : "fotos selecionadas"}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="flex-1 rounded-lg sm:flex-none" onClick={() => setSelectedIndices(new Set())}>
                    <X /> Cancelar
                  </Button>
                  <Button variant="destructive" className="flex-1 rounded-lg sm:flex-none" onClick={handleRemoveSelected} disabled={isDeletingBulk}>
                    {isDeletingBulk ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    {isDeletingBulk ? "Excluindo…" : "Excluir"}
                  </Button>
                </div>
              </div>
            )}

            {photos.length === 0 ? (
              <EmptyState
                icon={<ImageIcon />}
                title="Nenhuma foto adicionada"
                description="Envie as fotos do projeto pela área acima. Depois você pode reordenar, escolher a capa e separar por datas."
              />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={photos.filter(p => !p.isDivider).map(p => p.url)} strategy={rectSortingStrategy}>
                  <div className="-m-1 flex flex-wrap">
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

                <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  {activePhoto && !activePhoto.isDivider ? (
                    <div style={{ transform: 'scale(1.08) rotate(2deg)' }} className="relative aspect-[3/4] w-24 cursor-grabbing overflow-hidden rounded-lg shadow-2xl ring-1 ring-border">
                      <img src={getOptimizedUrl(activePhoto.url, 400)} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {/* Divider button — always visible below the photos */}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-lg border-dashed text-[15px]"
              onClick={handleAddDivider}
            >
              <Calendar /> Adicionar divisória de data
            </Button>
          </Panel>
        </div>
      </AdminPage>

      {uploadStatus.isUploading && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-3 border-t border-border bg-card px-4 py-3 text-[14px] font-medium text-foreground lg:left-[256px]"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Enviando arquivos — {uploadPct}%
        </div>
      )}

      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) closeConfirm(); }}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[17px]">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-[15px]">{confirmDialog?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="mt-0 rounded-lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDialog?.onConfirm()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProjectEdit;
