export interface ProjectPhoto {
  url: string;
  publicId: string;
}

export interface Project {
  id: string;
  clientName: string;
  slug: string;
  photos: ProjectPhoto[]; // Hosted URLs (Cloudinary)
  createdAt: string;
  featured: boolean;
  coverIndex: number; // which photo to use as cover
}

const STORAGE_KEY = 'gofocus_projects';

export function getProjects(): Project[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  // migrate old projects without featured field
  return JSON.parse(data).map((p: any) => ({
    ...p,
    featured: p.featured ?? false,
    coverIndex: p.coverIndex ?? 0,
    photos: (p.photos || []).map((photo: any) =>
      typeof photo === 'string' ? { url: photo, publicId: "" } : photo
    )
  }));
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  projects.push(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const projects = getProjects().map(p =>
    p.id === id ? { ...p, ...updates } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getFeaturedProjects(): Project[] {
  return getProjects().filter(p => p.featured);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getProjects().find(p => p.slug === slug);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
