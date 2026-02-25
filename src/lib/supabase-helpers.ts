import { supabase } from "@/integrations/supabase/client";

export interface Project {
    id: string;
    name: string;
    created_at: string;
    photos?: Photo[];
}

export interface Photo {
    id: string;
    project_id: string;
    file_path: string;
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

export async function fetchProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
        .from("projects")
        .select("*, photos(*)")
        .eq("id", id)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function createProject(name: string): Promise<Project> {
    const { data, error } = await supabase
        .from("projects")
        .insert({ name })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function updateProject(id: string, updates: Partial<Pick<Project, "name">>): Promise<void> {
    const { error } = await supabase.from("projects").update(updates).eq("id", id);
    if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
}

// ─── Photos & Storage ───

export async function uploadPhotos(projectId: string, files: File[]): Promise<void> {
    for (const file of files) {
        const uuid = crypto.randomUUID();
        const ext = "jpg"; // Requirement says .jpg, but we could detect from file.name
        const filePath = `fotos/${projectId}/${uuid}.${ext}`;

        const { error: uploadError } = await supabase.storage
            .from("fotos")
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
            .from("photos")
            .insert({
                project_id: projectId,
                file_path: filePath
            });

        if (dbError) throw dbError;
    }
}

export function getPublicUrl(filePath: string) {
    return supabase.storage.from("fotos").getPublicUrl(filePath).data.publicUrl;
}

export async function deletePhoto(photoId: string, filePath: string): Promise<void> {
    // Delete from storage
    await supabase.storage.from("fotos").remove([filePath]);

    // Delete from DB
    const { error } = await supabase.from("photos").delete().eq("id", photoId);
    if (error) throw error;
}
