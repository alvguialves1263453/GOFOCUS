import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProjectsAsync,
  saveProjectAsync,
  deleteProjectAsync,
  updateProjectAsync,
  getCategoriesAsync,
  saveCategoryAsync,
  deleteCategoryAsync,
  type Project,
  type Category,
} from "@/lib/storage";
import { deleteFromImageKit, getOptimizedUrl } from "@/lib/imagekit";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus, FolderOpen, Trash2, Image as ImageIcon,
  Loader2, Link as LinkIcon, Check, QrCode,
  Tag, X, Search, Eye, EyeOff, Pencil, MoreVertical,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPage, Panel, Field, StatusBadge, EmptyState, Segmented, LoadingBlock, CountUp, TabPanel } from "@/components/admin/ui";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PendingDelete = { kind: "project" | "category"; id: string; name: string } | null;

// NAO MEXER PQ DEU CERTO! (NAO SABER COMO TA FEITO, MAS FUNCIONA)
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"projects" | "categories">("projects");
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrProject, setQrProject] = useState<{ name: string; url: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "visible" | "hidden">("all");
  const [mobileActionProject, setMobileActionProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadProjects();
      loadCategories();
    }
  }, [authLoading, user]);

  const loadProjects = async () => {
    try {
      const data = await getProjectsAsync();
      setProjects(data);
    } finally {
      setProjectsLoaded(true);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategoriesAsync();
      setCategories(data);
    } finally {
      setCategoriesLoaded(true);
    }
  };

  const handleSave = async () => {
    if (!projectName.trim()) return;
    setSaving(true);
    try {
      const newProject: Project = {
        id: "",
        clientName: projectName.trim(),
        slug: "",
        photos: [],
        createdAt: new Date().toISOString(),
        featured: false,
        coverIndex: 0,
        categoryId: selectedCategoryId || undefined,
      };
      const result = await saveProjectAsync(newProject);
      if (result.remote) {
        toast.success("Projeto criado e sincronizado!");
      } else {
        toast.error("Salvo localmente: " + (result.error || "Erro de permissão RLS."));
      }
      setProjectName("");
      setSelectedCategoryId("");
      setShowForm(false);
      loadProjects();
    } catch {
      toast.error("Erro ao salvar projeto");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;
    setCategorySaving(true);
    try {
      const newCategory: Category = { id: "", name: categoryName.trim(), slug: "" };
      const result = await saveCategoryAsync(newCategory);
      if (result.remote) {
        toast.success("Categoria criada!");
      } else {
        toast.error("Salvo localmente: " + (result.error || "Erro de permissão."));
      }
      setCategoryName("");
      setShowCategoryForm(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar categoria");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;
    setCategorySaving(true);
    try {
      const { updateCategoryAsync, generateSlug } = await import("@/lib/storage");
      await updateCategoryAsync(editingCategory.id, {
        name: editCategoryName.trim(),
        slug: generateSlug(editCategoryName.trim())
      });
      toast.success("Categoria atualizada!");
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar categoria");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleUpdateProjectName = async () => {
    if (!editingProject || !editProjectName.trim()) return;
    setSaving(true);
    try {
      const { generateSlug } = await import("@/lib/storage");
      const newSlug = generateSlug(editProjectName.trim());
      await updateProjectAsync(editingProject.id, {
        clientName: editProjectName.trim(),
        slug: newSlug
      });
      toast.success("Álbum renomeado!");
      setEditingProject(null);
      loadProjects();
    } catch {
      toast.error("Erro ao renomear álbum");
    } finally {
      setSaving(false);
    }
  };

  // Deletions are confirmed in an AlertDialog (was window.confirm) before these run.
  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategoryAsync(id);
      toast.success("Categoria excluída");
      loadCategories();
    } catch {
      toast.error("Erro ao excluir categoria");
    }
  };

  const handleDelete = async (id: string) => {
    const projectToDelete = projects.find((p) => p.id === id);
    try {
      await deleteProjectAsync(id);
      toast.success("Projeto excluído");
      loadProjects();
      if (projectToDelete?.photos?.length) {
        void Promise.all(
          projectToDelete.photos.filter((p) => !!p.publicId).map((p) => deleteFromImageKit(p.publicId))
        );
      }
    } catch (err) {
      toast.error(`Erro ao excluir projeto: ${err instanceof Error ? err.message : "tente novamente."}`);
    }
  };

  const requestDeleteProject = (project: Project) =>
    setPendingDelete({ kind: "project", id: project.id, name: project.clientName });

  const confirmPendingDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "project") handleDelete(pendingDelete.id);
    else handleDeleteCategory(pendingDelete.id);
    setPendingDelete(null);
  };

  const handleCopyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/cliente/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShowQr = (name: string, slug: string) => {
    const url = `${window.location.origin}/cliente/${slug}`;
    setQrProject({ name, url });
  };

  const handleToggleVisibility = async (project: Project) => {
    const newHiddenStatus = !project.hidden;

    // Optimistic update
    setProjects(prev => prev.map(p =>
      p.id === project.id ? { ...p, hidden: newHiddenStatus } : p
    ));

    try {
      await updateProjectAsync(project.id, { hidden: newHiddenStatus });
      toast.success(newHiddenStatus ? "Projeto ocultado" : "Projeto visível");
      // loadProjects() is called to ensure consistency, but optimistic update handles the UI
      loadProjects();
    } catch {
      // Rollback on error
      setProjects(prev => prev.map(p =>
        p.id === project.id ? { ...p, hidden: !newHiddenStatus } : p
      ));
      toast.error("Erro ao alterar visibilidade");
    }
  };

  const startEditProject = (p: Project) => {
    setEditingProject(p);
    setEditProjectName(p.clientName);
  };

  const clearFilters = () => { setSearchQuery(""); setFilterCategory("all"); setFilterStatus("all"); };

  const filteredProjects = projects.filter((p) => {
    const name = p.clientName || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === "all" || p.categoryId === filterCategory;

    const isHidden = p.hidden === true;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "visible" && !isHidden) ||
      (filterStatus === "hidden" && isHidden);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (authLoading) {
    return <LoadingBlock label="Autenticando…" />;
  }

  const pageActions = activeTab === "projects" ? (
    <Button variant={showForm ? "outline" : "default"} onClick={() => setShowForm(!showForm)} aria-expanded={showForm}>
      {showForm ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {showForm ? "Fechar" : "Novo projeto"}
    </Button>
  ) : (
    <Button variant={showCategoryForm ? "outline" : "default"} onClick={() => setShowCategoryForm(!showCategoryForm)} aria-expanded={showCategoryForm}>
      {showCategoryForm ? <X aria-hidden="true" /> : <Plus aria-hidden="true" />}
      {showCategoryForm ? "Fechar" : "Nova categoria"}
    </Button>
  );

  return (
    <AdminPage
      title="Projetos"
      description="Álbuns de clientes, categorias e links de visualização."
      actions={pageActions}
    >
      {(!projectsLoaded || projects.length > 0) && (
        <StudioHero
          projects={projects}
          categories={categories}
          onOpen={(id) => navigate(`/admin/projeto/${id}`)}
        />
      )}

      <Segmented<"projects" | "categories">
        label="Seção"
        value={activeTab}
        onChange={setActiveTab}
        options={[
          { value: "projects", label: "Projetos", count: projectsLoaded ? projects.length : undefined },
          { value: "categories", label: "Categorias", count: categoriesLoaded ? categories.length : undefined },
        ]}
        className="mb-6"
      />

      {/* ── PROJECTS TAB ── */}
      <AnimatePresence mode="wait" initial={false}>
      {activeTab === "projects" && (
        <TabPanel key="projects" group="Seção" value="projects" className="flex flex-col gap-6">
          {showForm && (
            <Panel title="Novo projeto" description="Crie o álbum e depois adicione as fotos.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nome do projeto" htmlFor="new-project-name">
                  <Input
                    id="new-project-name"
                    placeholder="Ex: Casamento em Milão"
                    value={projectName}
                    autoFocus
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  />
                </Field>
                <Field label="Categoria" htmlFor="new-project-category">
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger id="new-project-category">
                      <SelectValue placeholder="Selecionar…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving || !projectName.trim()}>
                  {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                  {saving ? "Salvando…" : "Criar projeto"}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </Panel>
          )}

          {/* Toolbar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  aria-label="Buscar projetos por nome"
                  placeholder="Buscar por nome…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger aria-label="Filtrar por categoria" className="sm:w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                  <SelectTrigger aria-label="Filtrar por visibilidade" className="sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="visible">Visíveis</SelectItem>
                    <SelectItem value="hidden">Ocultos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setActiveTab("categories")} className="self-start md:self-auto">
              <Tag aria-hidden="true" />
              Gerenciar categorias
            </Button>
          </div>

          {/* Projects grid */}
          {!projectsLoaded ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="status" aria-label="Carregando projetos">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                  <Skeleton className="aspect-[3/4] w-full rounded-none" />
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={<FolderOpen />}
              title="Nenhum projeto ainda"
              description="Crie o primeiro projeto para enviar fotos e compartilhar o link com o cliente."
              action={
                <Button onClick={() => setShowForm(true)}>
                  <Plus aria-hidden="true" /> Novo projeto
                </Button>
              }
            />
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="Nenhum resultado para os filtros atuais"
              description="Tente outro nome ou limpe os filtros para ver todos os projetos."
              action={<Button variant="outline" onClick={clearFilters}>Limpar filtros</Button>}
            />
          ) : (
            <div data-fly className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <AnimatePresence mode="popLayout" initial={false}>
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout="position"
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2, ease: EASE_OUT } }}
                  transition={{ layout: { duration: 0.35, ease: EASE_OUT } }}
                >
                <ProjectCard
                  project={project}
                  categories={categories}
                  onOpen={() => navigate(`/admin/projeto/${project.id}`)}
                  onCopyLink={() => handleCopyLink(project.slug, project.id)}
                  onShowQr={() => handleShowQr(project.clientName, project.slug)}
                  onEditName={() => startEditProject(project)}
                  onDelete={() => requestDeleteProject(project)}
                  onToggleVisibility={() => handleToggleVisibility(project)}
                  onOpenMobileActions={() => setMobileActionProject(project)}
                  copied={copiedId === project.id}
                />
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          )}
        </TabPanel>
      )}

      {/* ── CATEGORIES TAB ── */}
      {activeTab === "categories" && (
        <TabPanel key="categories" group="Seção" value="categories" className="flex flex-col gap-6">
          {showCategoryForm && (
            <Panel title="Nova categoria">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Field label="Nome da categoria" htmlFor="new-category-name" className="flex-1">
                  <Input
                    id="new-category-name"
                    placeholder="Ex: Arquitetura, Interiores…"
                    value={categoryName}
                    autoFocus
                    onChange={(e) => setCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
                  />
                </Field>
                <Button onClick={handleSaveCategory} disabled={categorySaving || !categoryName.trim()}>
                  {categorySaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Tag aria-hidden="true" />}
                  {categorySaving ? "Salvando…" : "Criar categoria"}
                </Button>
              </div>
            </Panel>
          )}

          {!categoriesLoaded ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card" role="status" aria-label="Carregando categorias">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0">
                  <Skeleton className="h-4 w-6" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={<Tag />}
              title="Nenhuma categoria criada"
              description="Crie categorias para organizar os projetos e filtrá-los no site."
              action={
                <Button onClick={() => setShowCategoryForm(true)}>
                  <Plus aria-hidden="true" /> Nova categoria
                </Button>
              }
            />
          ) : (
            <section aria-label="Categorias" className="lg overflow-hidden rounded-[20px] border border-border bg-card">
              <p className="border-b border-border px-5 py-3 text-[13px] font-medium text-muted-foreground">
                {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
              </p>
              <ul data-fly className="divide-y divide-border">
                {categories.map((cat, i) => (
                  <li key={cat.id} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors duration-150 hover:bg-accent/50">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="w-6 shrink-0 text-[13px] tabular-nums text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium text-foreground">{cat.name}</p>
                        <p className="truncate text-[13px] text-muted-foreground">/{cat.slug}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Renomear categoria ${cat.name}`}
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCategoryName(cat.name);
                        }}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir categoria ${cat.name}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setPendingDelete({ kind: "category", id: cat.id, name: cat.name })}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </TabPanel>
      )}
      </AnimatePresence>

      {/* ── MOBILE ACTIONS DIALOG ── */}
      <Dialog open={!!mobileActionProject} onOpenChange={(open) => !open && setMobileActionProject(null)}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border p-5 text-left">
            <DialogDescription className="text-[13px]">Ações do projeto</DialogDescription>
            <DialogTitle className="text-[17px] font-semibold">{mobileActionProject?.clientName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col divide-y divide-border">
            <MobileAction
              icon={copiedId === mobileActionProject?.id ? <Check /> : <LinkIcon />}
              label="Copiar link"
              hint="Link de visualização do cliente"
              onClick={() => {
                const p = mobileActionProject!;
                setMobileActionProject(null);
                handleCopyLink(p.slug, p.id);
              }}
            />
            <MobileAction
              icon={mobileActionProject?.hidden ? <Eye /> : <EyeOff />}
              label={mobileActionProject?.hidden ? "Mostrar álbum" : "Ocultar álbum"}
              hint="Visibilidade na página principal"
              onClick={() => {
                const p = mobileActionProject!;
                setMobileActionProject(null);
                handleToggleVisibility(p);
              }}
            />
            <MobileAction
              icon={<Pencil />}
              label="Renomear"
              hint="Alterar nome do cliente ou evento"
              onClick={() => {
                const p = mobileActionProject!;
                setMobileActionProject(null);
                startEditProject(p);
              }}
            />
            <MobileAction
              icon={<QrCode />}
              label="QR code"
              hint="Gerar código para acesso rápido"
              onClick={() => {
                const p = mobileActionProject!;
                setMobileActionProject(null);
                handleShowQr(p.clientName, p.slug);
              }}
            />
            <MobileAction
              icon={<Trash2 />}
              label="Excluir projeto"
              hint="Esta ação não pode ser desfeita"
              destructive
              onClick={() => {
                const p = mobileActionProject!;
                setMobileActionProject(null);
                requestDeleteProject(p);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── QR Dialog ── */}
      <Dialog open={!!qrProject} onOpenChange={(open) => !open && setQrProject(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold">QR code: {qrProject?.name}</DialogTitle>
            <DialogDescription>Aponte a câmera para abrir o portfólio.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-2">
            {/* QR codes need a white quiet zone to scan reliably, in either theme. */}
            <div className="rounded-lg bg-white p-4">
              {qrProject && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrProject.url)}`}
                  alt={`QR code do link de ${qrProject.name}`}
                  width={180}
                  height={180}
                  className="h-[180px] w-[180px]"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Category Dialog ── */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold">Editar categoria</DialogTitle>
          </DialogHeader>
          <Field label="Nome da categoria" htmlFor="edit-category-name">
            <Input
              id="edit-category-name"
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdateCategory()}
            />
          </Field>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditingCategory(null)}>Cancelar</Button>
            <Button onClick={handleUpdateCategory} disabled={categorySaving || !editCategoryName.trim()}>
              {categorySaving && <Loader2 className="animate-spin" aria-hidden="true" />}
              {categorySaving ? "Salvando…" : "Atualizar categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Project Name Dialog ── */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold">Renomear álbum</DialogTitle>
          </DialogHeader>
          <Field label="Nome do álbum" htmlFor="edit-project-name">
            <Input
              id="edit-project-name"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdateProjectName()}
            />
          </Field>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditingProject(null)}>Cancelar</Button>
            <Button onClick={handleUpdateProjectName} disabled={saving || !editProjectName.trim()}>
              {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
              {saving ? "Salvando…" : "Atualizar nome"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation (project or category) ── */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.kind === "project" ? "Excluir este projeto?" : "Excluir esta categoria?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.kind === "project"
                ? `"${pendingDelete?.name}" e todas as suas fotos serão excluídos. Esta ação não pode ser desfeita.`
                : `A categoria "${pendingDelete?.name}" será excluída.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPendingDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
};

/* ─── MOBILE ACTION ROW ─── */
function MobileAction({ icon, label, hint, onClick, destructive }: {
  icon: ReactNode; label: string; hint: string; onClick: () => void; destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] items-center gap-4 px-5 py-3 text-left transition-colors duration-150 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
        destructive ? "text-destructive" : "text-foreground"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg [&_svg]:h-4 [&_svg]:w-4",
          destructive ? "bg-destructive/15" : "bg-secondary"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className={cn("block text-[13px]", destructive ? "text-destructive" : "text-muted-foreground")}>{hint}</span>
      </span>
    </button>
  );
}

/* ─── PROJECT CARD ─── */
function ProjectCard({ project, categories, onOpen, onCopyLink, onShowQr, onDelete, onToggleVisibility, onEditName, onOpenMobileActions, copied }: {
  project: Project;
  categories: Category[];
  onOpen: () => void;
  onCopyLink: () => void;
  onShowQr: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onEditName: () => void;
  onOpenMobileActions: () => void;
  copied: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const photo = project.photos?.[project.coverIndex || 0];
  const category = categories.find((c) => c.id === project.categoryId);
  const count = project.photos?.length || 0;
  const actionBtn =
    "h-10 w-10 border border-border bg-card text-foreground hover:bg-accent";

  return (
    <div className="glass-lift group relative overflow-hidden rounded-[18px] border border-border bg-card">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir projeto ${project.clientName}`}
        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {photo ? (
            <>
              {!isLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
              <img
                src={getOptimizedUrl(photo.url, 400)}
                alt={project.clientName}
                onLoad={() => setIsLoaded(true)}
                className={cn(
                  "h-full w-full object-cover transition-opacity duration-200",
                  isLoaded ? (project.hidden ? "opacity-40" : "opacity-100") : "opacity-0"
                )}
                loading="lazy"
              />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 px-3 py-3">
          <p className="truncate text-[14px] font-medium text-foreground">{project.clientName}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] text-muted-foreground">
              {count} {count === 1 ? "foto" : "fotos"}
            </span>
            {category && <StatusBadge className="max-w-full truncate text-[12px]">{category.name}</StatusBadge>}
            {project.hidden && <StatusBadge tone="warning" className="text-[12px]">Oculto</StatusBadge>}
          </div>
        </div>
      </button>

      {/* Actions: dropdown on desktop, action sheet dialog on phones */}
      <div className="absolute right-2 top-2 flex gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCopyLink}
          aria-label={copied ? "Link copiado" : `Copiar link de ${project.clientName}`}
          className={cn(actionBtn, "hidden md:inline-flex md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 transition-opacity duration-150")}
        >
          {copied ? <Check aria-hidden="true" /> : <LinkIcon aria-hidden="true" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Mais ações para ${project.clientName}`}
              className={cn(actionBtn, "hidden md:inline-flex")}
            >
              <MoreVertical aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={onCopyLink}>
              <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" /> Copiar link
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleVisibility}>
              {project.hidden
                ? <><Eye className="mr-2 h-4 w-4" aria-hidden="true" /> Mostrar projeto</>
                : <><EyeOff className="mr-2 h-4 w-4" aria-hidden="true" /> Ocultar projeto</>}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEditName}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onShowQr}>
              <QrCode className="mr-2 h-4 w-4" aria-hidden="true" /> QR code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileActions}
          aria-label={`Ações para ${project.clientName}`}
          className={cn(actionBtn, "md:hidden")}
        >
          <MoreVertical aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/* ─── STUDIO HERO: random photos from the whole archive, and the studio's numbers ─── */
type HeroShot = { url: string; project: Project };
const HERO_EVERY_MS = 6000;
/** Last photo the hero showed, kept across visits so it is there the instant you come back. */
let heroLast: { url: string; projectId: string } | null = null;
const HERO_MASK = "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.55) 30%, #000 70%)";

function shuffle<T>(list: T[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function StudioHero({ projects, categories, onOpen }: {
  projects: Project[];
  categories: Category[];
  onOpen: (id: string) => void;
}) {
  // One shuffled reel of every published photo (hidden albums left out), made once per visit.
  const reel = useMemo<HeroShot[]>(() => {
    const all: HeroShot[] = [];
    projects.forEach((p) => {
      if (p.hidden) return;
      p.photos?.forEach((f) => { if (!f.isDivider && f.url) all.push({ url: f.url, project: p }); });
    });
    return shuffle(all).slice(0, 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]);

  const [idx, setIdx] = useState(0);
  const cur = useRef(0);
  const [layers, setLayers] = useState<{ key: number; url: string }[]>(
    heroLast ? [{ key: -1, url: heroLast.url }] : []
  );
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shot = reel[idx % Math.max(1, reel.length)];
  const src = (u: string) => getOptimizedUrl(u, 1200);

  // Start from the photo shown last time if it is still in the archive; else load the first.
  useEffect(() => {
    if (!reel.length) return;
    const back = heroLast ? reel.findIndex((r) => src(r.url) === heroLast!.url) : -1;
    if (back >= 0) {
      cur.current = back;
      setIdx(back);
      return;
    }
    const url = src(reel[0].url);
    const img = new Image();
    img.onload = () => {
      setLayers([{ key: 0, url }]);
      heroLast = { url, projectId: reel[0].project.id };
    };
    img.src = url;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel]);

  // Every few seconds, preload the next photo, then cross-fade to it (paused while the tab is hidden).
  useEffect(() => {
    if (reduce || reel.length < 2) return;
    let alive = true;
    const t = window.setInterval(() => {
      if (document.hidden) return;
      const next = (cur.current + 1) % reel.length;
      const url = src(reel[next].url);
      const img = new Image();
      img.onload = () => {
        if (!alive) return;
        cur.current = next;
        setIdx(next);
        setLayers((ls) => [...ls.slice(-1), { key: Date.now(), url }]);
        heroLast = { url, projectId: reel[next].project.id };
      };
      img.src = url;
    }, HERO_EVERY_MS);
    return () => { alive = false; window.clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel, reduce]);

  const album = shot?.project;
  const category = categories.find((c) => c.id === album?.categoryId);
  const albumCount = album?.photos?.filter((f) => !f.isDivider).length || 0;
  const photoCount = projects.reduce((n, p) => n + (p.photos?.filter((f) => !f.isDivider).length || 0), 0);
  const hiddenCount = projects.filter((p) => p.hidden).length;

  const stats = [
    { label: "Álbuns", value: projects.length },
    { label: "Fotos publicadas", value: photoCount },
    { label: "Categorias", value: categories.length },
    { label: "Ocultos", value: hiddenCount },
  ];

  return (
    <section
      aria-label="Resumo do estúdio"
      className="lg relative mb-6 overflow-hidden rounded-[26px] border border-border bg-card"
    >
      <div
        className="absolute inset-y-0 right-0 w-full sm:w-[62%]"
        aria-hidden="true"
        style={{ WebkitMaskImage: HERO_MASK, maskImage: HERO_MASK }}
      >
        {layers.map((l) => (
          <img
            key={l.key}
            src={l.url}
            alt=""
            className={cn("absolute inset-0 h-full w-full object-cover", l.key !== -1 && "hero-shot")}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1f1e24]/90 via-transparent to-transparent sm:from-[#1f1e24]/50" />
      </div>

      <div className="relative flex min-h-[300px] flex-col justify-between gap-8 p-6 sm:p-8">
        {album && (
          <div key={album.id} className="hero-copy max-w-[26rem]">
            <p className="text-[14px] text-muted-foreground">Do seu acervo</p>
            <h2 className="mt-1 text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-white">
              {album.clientName}
            </h2>
            <p className="mt-2 text-[15px] text-white/70">
              {albumCount} {albumCount === 1 ? "foto" : "fotos"}
              {category ? `, ${category.name}` : ""}
            </p>
            <Button onClick={() => onOpen(album.id)} className="mt-5 rounded-full px-6">
              Abrir álbum
            </Button>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-white/[0.1] bg-white/[0.06] sm:max-w-[640px] sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#2a2930]/70 px-4 py-3.5">
              <dt className="text-[13px] text-muted-foreground">{s.label}</dt>
              <dd className="mt-0.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white">
                <CountUp value={s.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default AdminDashboard;
