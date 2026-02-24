import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getProjects, saveProject, deleteProject, updateProject, generateSlug, fileToBase64, type Project } from "@/lib/storage";
import { Plus, FolderOpen, Star, Trash2, ExternalLink, Image } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("gofocus_auth") !== "true") {
      navigate("/admin");
      return;
    }
    setProjects(getProjects());
  }, [navigate]);

  const handleSave = async () => {
    if (!clientName.trim() || files.length === 0) return;
    setSaving(true);
    const photos = await Promise.all(files.map(fileToBase64));
    const project: Project = {
      id: crypto.randomUUID(),
      clientName: clientName.trim(),
      slug: generateSlug(clientName.trim()),
      photos,
      createdAt: new Date().toISOString(),
      featured: false,
      coverIndex: 0,
    };
    saveProject(project);
    setProjects(getProjects());
    setClientName("");
    setFiles([]);
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;
    deleteProject(id);
    setProjects(getProjects());
  };

  const toggleFeatured = (e: React.MouseEvent, id: string, current: boolean) => {
    e.stopPropagation();
    updateProject(id, { featured: !current });
    setProjects(getProjects());
  };

  const handleLogout = () => {
    sessionStorage.removeItem("gofocus_auth");
    navigate("/admin");
  };

  const totalPhotos = projects.reduce((sum, p) => sum + p.photos.length, 0);
  const featuredCount = projects.filter((p) => p.featured).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-light tracking-[0.15em] text-foreground">
              GoFocus
            </h1>
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.3em] text-muted-foreground border-l border-border pl-4">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver Site
            </a>
            <button
              onClick={handleLogout}
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Stats */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          {[
            { label: "Projetos", value: projects.length, icon: FolderOpen },
            { label: "Fotos", value: totalPhotos, icon: Image },
            { label: "Destaques", value: featuredCount, icon: Star },
          ].map((stat) => (
            <div key={stat.label} className="border border-border p-5">
              <stat.icon className="h-4 w-4 text-muted-foreground mb-3" strokeWidth={1.5} />
              <p className="font-display text-2xl font-light text-foreground">{stat.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-display text-lg font-light tracking-wide text-foreground">Projetos</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 border border-foreground px-5 py-2.5 text-[10px] uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
          >
            <Plus className="h-3.5 w-3.5" />
            {showForm ? "Cancelar" : "Novo Projeto"}
          </button>
        </div>

        {/* New Project Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="mb-10 border border-border p-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-5">
                <input
                  type="text"
                  placeholder="Nome do Cliente"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                />
                <div>
                  <label className="block mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Fotos
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="text-sm text-muted-foreground file:mr-4 file:border file:border-border file:bg-background file:px-4 file:py-2 file:text-[10px] file:uppercase file:tracking-widest file:text-foreground file:cursor-pointer hover:file:bg-foreground hover:file:text-background file:transition-colors"
                  />
                  {files.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {files.length} foto{files.length > 1 ? "s" : ""} selecionada{files.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !clientName.trim() || files.length === 0}
                  className="border border-foreground px-6 py-2.5 text-[10px] uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {saving ? "Salvando..." : "Salvar Projeto"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border py-20">
            <FolderOpen className="h-8 w-8 text-muted-foreground/40 mb-4" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Nenhum projeto criado ainda.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Novo Projeto" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                className="group relative border border-border overflow-hidden cursor-pointer transition-colors hover:border-foreground/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/admin/projeto/${project.id}`)}
              >
                {/* Cover image */}
                <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
                  {project.photos[project.coverIndex] ? (
                    <img
                      src={project.photos[project.coverIndex]}
                      alt={project.clientName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/30" strokeWidth={1} />
                    </div>
                  )}

                  {/* Featured badge */}
                  {project.featured && (
                    <div className="absolute top-3 left-3 bg-foreground px-2 py-1 text-[9px] uppercase tracking-widest text-background">
                      Destaque
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base text-foreground">{project.clientName}</h3>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {project.photos.length} foto{project.photos.length !== 1 ? "s" : ""} •{" "}
                        {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                    <button
                      onClick={(e) => toggleFeatured(e, project.id, project.featured)}
                      className={`flex h-8 w-8 items-center justify-center border transition-colors ${
                        project.featured
                          ? "border-foreground text-foreground"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                      title={project.featured ? "Remover destaque" : "Destacar"}
                    >
                      <Star className="h-3.5 w-3.5" fill={project.featured ? "currentColor" : "none"} />
                    </button>
                    <a
                      href={`/cliente/${project.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                      title="Ver prévia do cliente"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <div className="flex-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                      title="Excluir projeto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
