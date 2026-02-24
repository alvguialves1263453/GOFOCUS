import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover_image: string;
  featured: boolean;
  created_at: string;
  photos?: Photo[];
}

export interface Photo {
  id: string;
  project_id: string;
  image_url: string;
  created_at: string;
}

// ─── Projects ───

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, photos(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchFeaturedProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, photos(*)")
    .eq("featured", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, photos(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProject(title: string, userId: string): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ title, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Partial<Pick<Project, "title" | "description" | "cover_image" | "featured">>): Promise<void> {
  const { error } = await supabase.from("projects").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  // Delete storage files first
  const { data: photos } = await supabase.from("photos").select("image_url").eq("project_id", id);
  if (photos && photos.length > 0) {
    const paths = photos.map((p) => {
      const url = new URL(p.image_url);
      const parts = url.pathname.split("/storage/v1/object/public/project-photos/");
      return parts[1] || "";
    }).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from("project-photos").remove(paths);
    }
  }
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// ─── Photos ───

export async function uploadPhotos(projectId: string, files: File[]): Promise<Photo[]> {
  const uploaded: Photo[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `projects/${projectId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("project-photos")
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from("photos")
      .insert({ project_id: projectId, image_url: urlData.publicUrl })
      .select()
      .single();
    if (error) throw error;
    uploaded.push(data);
  }

  return uploaded;
}

export async function deletePhoto(photo: Photo): Promise<void> {
  // Remove from storage
  const url = new URL(photo.image_url);
  const parts = url.pathname.split("/storage/v1/object/public/project-photos/");
  const path = parts[1] || "";
  if (path) {
    await supabase.storage.from("project-photos").remove([path]);
  }
  // Remove from database
  const { error } = await supabase.from("photos").delete().eq("id", photo.id);
  if (error) throw error;
}
