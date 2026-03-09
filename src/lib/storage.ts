import { supabase } from './supabase';

export interface ProjectPhoto {
  url: string;
  publicId: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Project {
  id: string;
  clientName: string;
  slug: string;
  photos: ProjectPhoto[]; // Hosted URLs (Cloudinary)
  createdAt: string;
  featured: boolean;
  coverIndex: number; // which photo to use as cover
  likes?: number;
  categoryId?: string;
}

const STORAGE_KEY = 'gofocus_projects';
const CATEGORIES_KEY = 'gofocus_categories';

// --- SUPABASE ASYNC FUNCTIONS ---

export async function getProjectsAsync(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching projects from Supabase:', error);
      return getProjectsLocal(); // Fallback to local
    }

    // Map snake_case from DB to camelCase for UI
    return (data || []).map((p: any) => ({
      ...p,
      categoryId: p.category_id
    }));
  } catch (err) {
    console.error('Critical failure in getProjectsAsync:', err);
    return getProjectsLocal();
  }
}

export async function saveProjectAsync(project: Project): Promise<void> {
  const { categoryId, ...rest } = project;
  const dbProject = {
    ...rest,
    category_id: categoryId
  };

  const { error } = await supabase.from('projects').insert([dbProject]);
  if (error) throw error;

  // Also save locally for backup
  saveProjectLocal(project);
}

export async function updateProjectAsync(id: string, updates: Partial<Project>): Promise<void> {
  const { categoryId, ...rest } = updates;
  const dbUpdates = {
    ...rest,
    ...(categoryId !== undefined && { category_id: categoryId })
  };

  const { error } = await supabase
    .from('projects')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;

  // Also update locally for backup
  updateProjectLocal(id, updates);
}

export async function deleteProjectAsync(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Also delete locally for backup
  deleteProjectLocal(id);
}
/* 
NOTE: To increment likes safely, we use an RPC or a raw query. 
Since we don't have an RPC setup yet, we catch the current count and increment.
Ideal production: create a postgres function as follows:
create function increment_likes(project_id uuid) 
returns void as $$
update projects set likes = likes + 1 where id = project_id;
$$ language sql;
*/
export async function incrementLikesAsync(id: string, visitorId?: string): Promise<number> {
  // If no visitorId, we fallback to simple increment (legacy or unknown)
  if (visitorId) {
    try {
      // 1. Record the individual like
      const { error: likeError } = await supabase
        .from('project_likes')
        .insert({ project_id: id, visitor_id: visitorId });

      if (likeError) {
        // 23505 is unique violation (already liked), we can safely ignore it and just count
        if (likeError.code !== '23505') {
          console.error('Error inserting like:', likeError);
          // If RLS is enabled but no policy exists, Supabase might return a 403 or empty error
          throw likeError;
        }
      }
    } catch (err) {
      console.error('Catch block error in incrementLikesAsync (like insertion):', err);
      throw err;
    }
  }

  // 2. Get current likes
  const { data, error } = await supabase
    .from('projects')
    .select('likes')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching project likes count:', error);
    throw error;
  }

  const newLikes = (data.likes || 0) + 1;

  // 3. Update the counter
  const { error: updateError } = await supabase
    .from('projects')
    .update({ likes: newLikes })
    .eq('id', id);

  if (updateError) {
    console.error('Error updating project likes counter:', updateError);
    throw updateError;
  }

  return newLikes;
}

export async function checkIfLikedAsync(projectId: string, visitorId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('project_likes')
    .select('id')
    .eq('project_id', projectId)
    .eq('visitor_id', visitorId)
    .maybeSingle();

  if (error) {
    console.error('Error checking if liked:', error);
    return false;
  }

  return !!data;
}

export async function getProjectBySlugAsync(slug: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching project by slug:', error);
      }
      return getProjectBySlugLocal(slug);
    }

    return {
      ...data,
      categoryId: data.category_id
    };
  } catch (err) {
    console.error('Critical failure in getProjectBySlugAsync:', err);
    return getProjectBySlugLocal(slug);
  }
}

// --- CATEGORIES ASYNC FUNCTIONS ---

export async function getCategoriesAsync(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      return getCategoriesLocal();
    }

    return data || [];
  } catch (err) {
    console.error('Critical failure in getCategoriesAsync:', err);
    return getCategoriesLocal();
  }
}

export async function saveCategoryAsync(category: Category): Promise<void> {
  const { error } = await supabase.from('categories').insert([category]);
  if (error) throw error;
  saveCategoryLocal(category);
}

export async function updateCategoryAsync(id: string, updates: Partial<Category>): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
  updateCategoryLocal(id, updates);
}

export async function deleteCategoryAsync(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  deleteCategoryLocal(id);
}

// --- LOCAL STORAGE BACKUP / FALLBACK (LEGACY) ---

function getProjectsLocal(): Project[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data).map((p: any) => ({
    ...p,
    featured: p.featured ?? false,
    coverIndex: p.coverIndex ?? 0,
    photos: (p.photos || []).map((photo: any) =>
      typeof photo === 'string' ? { url: photo, publicId: "" } : photo
    )
  }));
}

function saveProjectLocal(project: Project): void {
  const projects = getProjectsLocal();
  projects.push(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function updateProjectLocal(id: string, updates: Partial<Project>): void {
  const projects = getProjectsLocal().map(p =>
    p.id === id ? { ...p, ...updates } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function deleteProjectLocal(id: string): void {
  const projects = getProjectsLocal().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function getProjectBySlugLocal(slug: string): Project | null {
  return getProjectsLocal().find(p => p.slug === slug) || null;
}

// --- CATEGORIES LOCAL STORAGE ---

function getCategoriesLocal(): Category[] {
  const data = localStorage.getItem(CATEGORIES_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

function saveCategoryLocal(category: Category): void {
  const categories = getCategoriesLocal();
  categories.push(category);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function updateCategoryLocal(id: string, updates: Partial<Category>): void {
  const categories = getCategoriesLocal().map(c =>
    c.id === id ? { ...c, ...updates } : c
  );
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function deleteCategoryLocal(id: string): void {
  const categories = getCategoriesLocal().filter(c => c.id !== id);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

// --- LEGACY SYNC EXPORTS (Keep for temporary compatibility) ---

/** @deprecated Use getProjectsAsync */
export function getProjects(): Project[] {
  return getProjectsLocal();
}

/** @deprecated Use saveProjectAsync */
export function saveProject(project: Project): void {
  saveProjectLocal(project);
}

/** @deprecated Use updateProjectAsync */
export function updateProject(id: string, updates: Partial<Project>): void {
  updateProjectLocal(id, updates);
}

/** @deprecated Use deleteProjectAsync */
export function deleteProject(id: string): void {
  deleteProjectLocal(id);
}

// --- UTILITIES ---

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
