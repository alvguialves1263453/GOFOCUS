import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Loader2, LogOut, Link as LinkIcon, Check, QrCode,
  Tag, ExternalLink, X, ArrowUpRight, LayoutGrid, Layers,
  Search, Eye, EyeOff, Filter, Edit2, MoreVertical, Calendar,
  SlidersHorizontal, Bell, Settings as SettingsIcon
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTasks, type Task as TaskType, type Priority } from '@/hooks/useTasks';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { TaskModal } from '@/components/tasks/TaskModal';
import { TaskSidebar } from '@/components/tasks/TaskSidebar';
import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';

// NAO MEXER PQ DEU CERTO! (NAO SABER COMO TA FEITO, MAS FUNCIONA)
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<"projects" | "categories" | "planner">("projects");
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

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "visible" | "hidden">("all");
  const [mobileActionProject, setMobileActionProject] = useState<Project | null>(null);

  // Planner States
  const { tasks, isLoading: tasksLoading, createTask, updateTask, deleteTask } = useTasks();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [selectedTaskDate, setSelectedTaskDate] = useState<Date | undefined>(undefined);
  const [taskView, setTaskView] = useState<'month' | 'week' | 'agenda'>('month');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskFilterPriority, setTaskFilterPriority] = useState<Priority[]>([]);
  const [taskShowCompleted, setTaskShowCompleted] = useState<boolean | null>(null);

  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && user) {
      loadProjects();
      loadCategories();
    }
  }, [authLoading, user]);

  useEffect(() => {
    const tabItem = searchParams.get("tab");
    const taskId = searchParams.get("id");
    
    if (tabItem === "planner" || taskId) {
      setActiveTab("planner");
      
      if (taskId && !tasksLoading && tasks.length > 0) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          setSelectedTask(task);
          setIsTaskDetailsOpen(true);
        }
      }
    }
  }, [searchParams, tasksLoading, tasks.length]);

  const loadProjects = async () => {
    const data = await getProjectsAsync();
    setProjects(data);
  };

  const loadCategories = async () => {
    const data = await getCategoriesAsync();
    setCategories(data);
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

  // Planner Handlers
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) || 
                          task.description?.toLowerCase().includes(taskSearchQuery.toLowerCase());
      const matchesPriority = taskFilterPriority.length === 0 || taskFilterPriority.includes(task.priority);
      const matchesCompleted = taskShowCompleted === null || task.completed === taskShowCompleted;
      
      return matchesSearch && matchesPriority && matchesCompleted;
    });
  }, [tasks, taskSearchQuery, taskFilterPriority, taskShowCompleted]);

  const handleOpenTaskCreateModal = (date?: Date) => {
    setSelectedTask(null);
    setSelectedTaskDate(date || new Date());
    setIsTaskModalOpen(true);
  };

  const handleOpenTaskEditModal = (task: TaskType) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const handleTaskEditFromDetails = () => {
    setIsTaskDetailsOpen(false);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: any) => {
    if (taskData.id) {
      updateTask.mutate(taskData);
    } else {
      createTask.mutate(taskData);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    try {
      await deleteCategoryAsync(id);
      toast.success("Categoria excluída");
      loadCategories();
    } catch {
      toast.error("Erro ao excluir categoria");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Excluir este projeto?")) return;
    const projectToDelete = projects.find((p) => p.id === id);
    try {
      if (projectToDelete?.photos) {
        await Promise.all(
          projectToDelete.photos.filter((p) => !!p.publicId).map((p) => deleteFromImageKit(p.publicId))
        );
      }
      await deleteProjectAsync(id);
      toast.success("Projeto excluído");
      loadProjects();
    } catch {
      toast.error("Erro ao excluir projeto");
    }
  };

  const handleCopyLink = (e: React.MouseEvent, slug: string, id: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/cliente/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShowQr = (e: React.MouseEvent, name: string, slug: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/cliente/${slug}`;
    setQrProject({ name, url });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleToggleVisibility = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">Autenticando…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-serif text-sm sm:text-base text-white">GoFocus</span>
            <span className="hidden sm:block text-white/15">|</span>
            <span className="hidden xs:block text-[8px] sm:text-[9px] uppercase tracking-[0.4em] text-white/30 font-medium whitespace-nowrap">
              Painel Admin
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href="/links"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-sm text-[9px] uppercase tracking-[0.3em] text-white hover:bg-white hover:text-black transition-colors"
            >
              Página de Links
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 rounded-sm text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/50 hover:text-white transition-colors"
            >
              <span className="hidden xs:inline">Ver Site</span>
              <ExternalLink className="h-3 w-3 sm:hidden" />
              <ArrowUpRight className="hidden sm:block h-3 w-3" />
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/35 hover:text-white transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden xs:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">

        {/* ── PAGE TITLE + TABS ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.45em] text-white/30 mb-2 font-medium">Administração</p>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-white">Gestão de Conteúdo</h1>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center border border-white/10 rounded-sm overflow-hidden self-start w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all ${
                activeTab === "projects"
                  ? "bg-white text-black shadow-lg"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <LayoutGrid className="h-3 w-3" />
              Projetos
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border-l border-white/10 ${
                activeTab === "categories"
                  ? "bg-white text-black shadow-lg"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Layers className="h-3 w-3" />
              Categorias
            </button>
            <button
              onClick={() => setActiveTab("planner")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border-l border-white/10 ${
                activeTab === "planner"
                  ? "bg-white text-black shadow-lg"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              <Calendar className="h-3 w-3" />
              Planner
            </button>
          </div>
        </div>

        {/* ── PROJECTS TAB ── */}
        {activeTab === "projects" && (
          <div>
            {/* Section header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                   <input 
                      type="text" 
                      placeholder="Buscar por nome…" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/3 border border-white/8 pl-9 pr-4 py-2 text-[11px] rounded-sm focus:outline-none focus:border-white/20 transition-colors"
                   />
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-[34px] bg-white/3 border-white/8 text-[10px] w-full sm:w-[130px] focus:ring-0">
                      <Filter className="h-3 w-3 mr-2 text-white/20" />
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/10 text-white">
                      <SelectItem value="all" className="text-[10px] uppercase">Todas Categorias</SelectItem>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-[10px] uppercase">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger className="h-[34px] bg-white/3 border-white/8 text-[10px] w-full sm:w-[110px] focus:ring-0">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/10 text-white">
                      <SelectItem value="all" className="text-[10px] uppercase">Todos</SelectItem>
                      <SelectItem value="visible" className="text-[10px] uppercase font-bold">Visíveis</SelectItem>
                      <SelectItem value="hidden" className="text-[10px] uppercase text-white/40">Ocultos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setActiveTab("categories")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-white/40 hover:text-white transition-colors border border-white/5 hover:border-white/20 rounded-sm"
                >
                  <Tag className="h-3 w-3" />
                  Gerenciar Categorias
                </button>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-[9px] font-semibold uppercase tracking-wider rounded-sm transition-all duration-300 ${
                    showForm
                      ? "border border-white/15 text-white/50 hover:text-white"
                      : "bg-white text-black hover:opacity-80"
                  }`}
                >
                  {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {showForm ? "Fechar" : "Novo Projeto"}
                </button>
              </div>
            </div>

            {/* New project form */}
            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mb-6 border border-white/8 bg-white/2 rounded-sm p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-medium">
                          Nome do Projeto
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Casamento em Milão"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSave()}
                          className="w-full bg-transparent border border-white/10 px-4 py-3 rounded-sm text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-medium">
                          Categoria
                        </label>
                        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                          <SelectTrigger className="w-full bg-transparent border border-white/10 px-4 py-3 h-auto rounded-sm text-sm text-white focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Selecionar…" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#111] border-white/10 text-white">
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="focus:bg-white/10 focus:text-white">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saving || !projectName.trim()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-[9px] font-semibold uppercase tracking-wider rounded-sm transition-opacity hover:opacity-80 disabled:opacity-30"
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      {saving ? "Salvando…" : "Criar Projeto"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Projects grid */}
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 border border-dashed border-white/8 rounded-sm">
                <FolderOpen className="h-8 w-8 text-white/10 mb-4" strokeWidth={1} />
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">Nenhum projeto ainda.</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 border border-white/6 bg-white/2 rounded-sm">
                <Search className="h-8 w-8 text-white/10 mb-4" strokeWidth={1} />
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">Nenhum resultado para os filtros atuais.</p>
                <button 
                  onClick={() => { setSearchQuery(""); setFilterCategory("all"); setFilterStatus("all"); }}
                  className="mt-4 text-[9px] uppercase tracking-widest text-white/40 hover:text-white underline underline-offset-4"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {filteredProjects.map((project, i) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    categories={categories}
                    index={i}
                    onClick={() => navigate(`/admin/projeto/${project.id}`)}
                    onCopyLink={handleCopyLink}
                    onShowQr={handleShowQr}
                    onEditName={(e: any, p: Project) => {
                      e.stopPropagation();
                      setEditingProject(p);
                      setEditProjectName(p.clientName);
                    }}
                    onDelete={handleDelete}
                    onToggleVisibility={handleToggleVisibility}
                    onOpenMobileActions={(p: Project) => setMobileActionProject(p)}
                    copiedId={copiedId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MOBILE ACTIONS DIALOG ── */}
        <Dialog open={!!mobileActionProject} onOpenChange={(open) => !open && setMobileActionProject(null)}>
          <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden">
            <div className="p-6 pb-4 border-b border-white/5">
              <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 mb-1">Ações do Projeto</p>
              <h3 className="font-serif text-lg">{mobileActionProject?.clientName}</h3>
            </div>
            
            <div className="grid grid-cols-1 divide-y divide-white/5">
              <button
                onClick={(e) => {
                  setMobileActionProject(null);
                  handleCopyLink(e as any, mobileActionProject!.slug, mobileActionProject!.id);
                }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white/5 border border-white/10">
                  <LinkIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">Copiar Link</p>
                  <p className="text-[9px] uppercase tracking-wider text-white/20">Link de visualização do cliente</p>
                </div>
              </button>

              <button
                onClick={(e) => {
                  setMobileActionProject(null);
                  handleToggleVisibility(e as any, mobileActionProject!);
                }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white/5 border border-white/10">
                  {mobileActionProject?.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-xs font-medium">{mobileActionProject?.hidden ? "Mostrar Álbum" : "Ocultar Álbum"}</p>
                  <p className="text-[9px] uppercase tracking-wider text-white/20">Visibilidade na página principal</p>
                </div>
              </button>

              <button
                onClick={(e) => {
                  setMobileActionProject(null);
                  setEditingProject(mobileActionProject);
                  setEditProjectName(mobileActionProject!.clientName);
                }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white/5 border border-white/10">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">Renomear</p>
                  <p className="text-[9px] uppercase tracking-wider text-white/20">Alterar nome do cliente ou evento</p>
                </div>
              </button>

              <button
                onClick={(e) => {
                  setMobileActionProject(null);
                  handleShowQr(e as any, mobileActionProject!.clientName, mobileActionProject!.slug);
                }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-white/5 border border-white/10">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">QR Code</p>
                  <p className="text-[9px] uppercase tracking-wider text-white/20">Gerar código para acesso rápido</p>
                </div>
              </button>

              <button
                onClick={(e) => {
                  setMobileActionProject(null);
                  handleDelete(e as any, mobileActionProject!.id);
                }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left text-red-400"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-red-500/10 border border-red-500/20">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">Excluir Projeto</p>
                  <p className="text-[9px] uppercase tracking-wider text-red-500/30">Esta ação não pode ser desfeita</p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── CATEGORIES TAB ── */}
        {activeTab === "categories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-px h-4 bg-white/30" />
                <span className="text-[9px] uppercase tracking-[0.4em] text-white/35 font-medium">
                  {categories.length} {categories.length === 1 ? "Categoria" : "Categorias"}
                </span>
              </div>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className={`flex items-center gap-2 px-5 py-2.5 text-[9px] font-semibold uppercase tracking-wider rounded-sm transition-all duration-300 ${
                  showCategoryForm
                    ? "border border-white/15 text-white/50 hover:text-white"
                    : "bg-white text-black hover:opacity-80"
                }`}
              >
                {showCategoryForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                {showCategoryForm ? "Fechar" : "Nova Categoria"}
              </button>
            </div>

            <AnimatePresence>
              {showCategoryForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="mb-6 border border-white/8 bg-white/2 rounded-sm p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-medium">
                          Nome da Categoria
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Arquitetura, Interiores…"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
                          className="w-full bg-transparent border border-white/10 px-4 py-3 rounded-sm text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={handleSaveCategory}
                          disabled={categorySaving || !categoryName.trim()}
                          className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[9px] font-semibold uppercase tracking-wider rounded-sm transition-opacity hover:opacity-80 disabled:opacity-30 whitespace-nowrap"
                        >
                          {categorySaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
                          {categorySaving ? "Salvando…" : "Criar Categoria"}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 border border-dashed border-white/8 rounded-sm">
                <Tag className="h-8 w-8 text-white/10 mb-4" strokeWidth={1} />
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">Nenhuma categoria criada.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 border border-white/6 rounded-sm overflow-hidden">
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-[8px] tabular-nums text-white/18 font-medium w-5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/85 truncate">{cat.name}</p>
                        <p className="text-[8px] uppercase tracking-widest text-white/25 mt-0.5">/{cat.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCategoryName(cat.name);
                        }}
                        className="flex h-8 w-8 items-center justify-center text-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Tag className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="flex h-8 w-8 items-center justify-center text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PLANNER TAB ── */}
        {activeTab === "planner" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                  <input 
                    type="text" 
                    placeholder="Buscar agendamentos…" 
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className="w-full bg-white/3 border border-white/8 pl-9 pr-4 py-3 text-xs rounded-2xl focus:outline-none focus:border-white/20 transition-all placeholder:text-white/10"
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-[46px] w-[46px] items-center justify-center bg-white/3 border border-white/8 rounded-2xl hover:bg-white/5 active:scale-95 transition-all outline-none">
                      <SlidersHorizontal className="w-4 h-4 text-white/40" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-[#111] border-white/10 p-2 rounded-2xl shadow-2xl text-white">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-3 py-2">Prioridade</DropdownMenuLabel>
                    {['Baixa', 'Média', 'Alta', 'Urgente'].map((p) => (
                      <DropdownMenuCheckboxItem
                        key={p}
                        checked={taskFilterPriority.includes(p as Priority)}
                        onCheckedChange={() => {
                          setTaskFilterPriority(prev => 
                            prev.includes(p as Priority) 
                              ? prev.filter(x => x !== p) 
                              : [...prev, p as Priority]
                          );
                        }}
                        className="rounded-xl mb-1 focus:bg-white/10"
                      >
                        {p}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator className="bg-white/5 my-2" />
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-3 py-2">Status</DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={taskShowCompleted === true}
                      onCheckedChange={() => setTaskShowCompleted(taskShowCompleted === true ? null : true)}
                      className="rounded-xl focus:bg-white/10"
                    >
                      Concluídas
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={taskShowCompleted === false}
                      onCheckedChange={() => setTaskShowCompleted(taskShowCompleted === false ? null : false)}
                      className="rounded-xl focus:bg-white/10"
                    >
                      Pendentes
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  onClick={() => handleOpenTaskCreateModal()}
                  className="hidden sm:flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-white/5"
                >
                  <Plus className="h-4 w-4" />
                  Nova Tarefa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <div className="bg-white/2 rounded-3xl border border-white/5 p-1 relative min-h-[400px]">
                {tasksLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-3xl z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                  </div>
                ) : null}
                <TaskCalendar 
                  tasks={filteredTasks}
                  onSelectDate={(date) => handleOpenTaskCreateModal(date)}
                  onEditTask={(task) => handleOpenTaskEditModal(task)}
                  view={taskView}
                  setView={setTaskView}
                />
              </div>
              <div className="hidden lg:block space-y-6">
                 <TaskSidebar 
                   tasks={tasks}
                   onSelectTask={(task) => handleOpenTaskEditModal(task)}
                 />
              </div>
            </div>
          </div>
        )}

        {/* Floating Add Button for Mobile - Only for Project or Planner tab */}
        {(activeTab === "projects" || activeTab === "planner") && (
          <button 
            className="sm:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white text-black shadow-2xl flex items-center justify-center p-0 z-50 hover:scale-110 active:scale-95 transition-all"
            onClick={() => activeTab === "projects" ? setShowForm(true) : handleOpenTaskCreateModal()}
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Task Modals */}
      <TaskDetailsModal
        isOpen={isTaskDetailsOpen}
        onClose={() => setIsTaskDetailsOpen(false)}
        task={selectedTask}
        onEdit={handleTaskEditFromDetails}
        onDelete={(id) => deleteTask.mutate(id)}
        onAddAnother={(date) => handleOpenTaskCreateModal(date)}
      />

      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={(id) => deleteTask.mutate(id)}
        initialTask={selectedTask}
        initialDate={selectedTaskDate}
      />

      {/* ── QR Dialog ── */}
      <Dialog open={!!qrProject} onOpenChange={(open) => !open && setQrProject(null)}>
        <DialogContent className="sm:max-w-sm bg-[#111] border-white/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-center text-white">
              QR Code — {qrProject?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="bg-white p-4 rounded-sm">
              {qrProject && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrProject.url)}`}
                  alt="QR Code"
                  className="w-[180px] h-[180px]"
                />
              )}
            </div>
            <p className="text-[9px] text-center uppercase tracking-[0.3em] text-white/30 px-4 leading-relaxed">
              Aponte a câmera para abrir o portfólio
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Category Dialog ── */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-md bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-white">
              Editar Categoria
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-medium">Nome da Categoria</label>
              <input
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                className="w-full bg-transparent border border-white/10 px-4 py-3 rounded-sm text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              onClick={handleUpdateCategory}
              disabled={categorySaving || !editCategoryName.trim()}
              className="w-full py-3 bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-sm hover:opacity-80 transition-opacity disabled:opacity-30"
            >
              {categorySaving ? "Salvando…" : "Atualizar Categoria"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Project Name Dialog ── */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="sm:max-w-md bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-normal text-white">
              Renomear Álbum
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.3em] text-white/35 font-medium">Nome do Álbum</label>
              <input
                type="text"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                className="w-full bg-transparent border border-white/10 px-4 py-3 rounded-sm text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <button
              onClick={handleUpdateProjectName}
              disabled={saving || !editProjectName.trim()}
              className="w-full py-3 bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-sm hover:opacity-80 transition-opacity disabled:opacity-30"
            >
              {saving ? "Salvando…" : "Atualizar Nome"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ─── PROJECT CARD ─── */
function ProjectCard({ project, categories, index, onClick, onCopyLink, onShowQr, onDelete, onToggleVisibility, onEditName, onOpenMobileActions, copiedId }: any) {
  const [isLoaded, setIsLoaded] = useState(false);
  const photo = project.photos?.[project.coverIndex || 0];
  const category = categories.find((c: any) => c.id === project.categoryId);

  return (
    <motion.div
      className={`group relative cursor-pointer bg-white/3 border transition-all duration-300 rounded-sm overflow-hidden ${
        project.hidden ? 'opacity-50 border-white/5 grayscale-[0.5]' : 'border-white/6 hover:border-white/15'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] bg-[#111] overflow-hidden">
        {photo ? (
          <>
            {/* Shimmer Skeleton */}
            {!isLoaded && (
              <div className="absolute inset-0 overflow-hidden z-10 bg-[#111]">
                <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
              </div>
            )}
            
            <motion.img
              src={getOptimizedUrl(photo.url, 400)}
              alt={project.clientName}
              onLoad={() => setIsLoaded(true)}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ 
                opacity: isLoaded ? 1 : 0, 
                filter: isLoaded ? "blur(0px)" : "blur(10px)"
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-6 w-6 text-white/10" strokeWidth={1} />
          </div>
        )}

        {/* Category badge */}
        {category && (
          <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-sm">
            <span className="text-[7px] uppercase tracking-widest text-white/60 font-medium">{category.name}</span>
          </div>
        )}

        {/* Desktop Hover overlay with actions (Hidden on mobile) */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onCopyLink(e, project.slug, project.id); }}
            title="Copiar link"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
          >
            {copiedId === project.id
              ? <Check className="h-3.5 w-3.5" />
              : <LinkIcon className="h-3.5 w-3.5" />
            }
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(e, project); }}
            title={project.hidden ? "Mostrar Projeto" : "Ocultar Projeto"}
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
          >
            {project.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={(e) => onEditName(e, project)}
            title="Renomear"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onShowQr(e, project.clientName, project.slug); }}
            title="QR Code"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
          >
            <QrCode className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(e, project.id); }}
            title="Excluir"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-white/10 hover:bg-red-500/30 text-white hover:text-red-300 border border-white/15 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile Settings Button (Only on mobile) */}
        <div className="absolute top-2 right-2 md:hidden">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenMobileActions(project); }}
            className="flex h-9 w-9 items-center justify-center rounded-sm bg-black/60 text-white border border-white/10 active:scale-90 transition-transform"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/80 truncate leading-tight">{project.clientName}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[8px] uppercase tracking-widest text-white/28 whitespace-nowrap">
              {project.photos?.length || 0} capturas
            </p>
            {project.hidden && (
              <span className="text-[7px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-sm">
                Ocultado
              </span>
            )}
          </div>
        </div>
        <ExternalLink className="h-3 w-3 text-white/20 shrink-0 group-hover:text-white/50 transition-colors" />
      </div>
    </motion.div>
  );
}

export default AdminDashboard;
