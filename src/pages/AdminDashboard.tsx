import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getProjects, saveProject, deleteProject, updateProject, generateSlug, fileToBase64, type Project } from "@/lib/storage";

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
    deleteProject(id);
    setProjects(getProjects());
  };

  const toggleFeatured = (id: string, current: boolean) => {
    updateProject(id, { featured: !current });
    setProjects(getProjects());
  };

  const handleLogout = () => {
    sessionStorage.removeItem("gofocus_auth");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-light tracking-[0.15em] text-foreground">
              GoFocus
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Painel Administrativo
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="border border-foreground px-6 py-2.5 text-xs uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background"
          >
            {showForm ? "Cancelar" : "Novo Projeto"}
          </button>
        </div>

        {/* New Project Form */}
        {showForm && (
          <motion.div
            className="mb-12 border border-border p-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
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
                <label className="block mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Fotos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  className="text-sm text-muted-foreground file:mr-4 file:border file:border-border file:bg-background file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-foreground file:cursor-pointer hover:file:bg-foreground hover:file:text-background file:transition-colors"
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
                className="border border-foreground px-6 py-2.5 text-xs uppercase tracking-[0.3em] text-foreground transition-colors duration-300 hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {saving ? "Salvando..." : "Salvar Projeto"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Projects List */}
        <div className="flex flex-col gap-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">
              Nenhum projeto criado ainda.
            </p>
          ) : (
            projects.map((project) => (
              <motion.div
                key={project.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between border border-border p-5 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center gap-4">
                  {/* Cover thumbnail */}
                  {project.photos[project.coverIndex] && (
                    <img
                      src={project.photos[project.coverIndex]}
                      alt={project.clientName}
                      className="w-12 h-12 object-cover flex-shrink-0"
                    />
                  )}
                  <div>
                    <h3 className="font-display text-lg text-foreground">
                      {project.clientName}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {project.photos.length} foto{project.photos.length > 1 ? "s" : ""} •{" "}
                      <a
                        href={`/cliente/${project.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground transition-colors"
                      >
                        /cliente/{project.slug}
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleFeatured(project.id, project.featured)}
                    className={`text-xs uppercase tracking-[0.2em] transition-colors ${
                      project.featured
                        ? "text-foreground border border-foreground px-3 py-1"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {project.featured ? "★ Destaque" : "☆ Destacar"}
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
