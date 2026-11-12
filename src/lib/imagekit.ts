const PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || "";
const URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || "";
const PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY || "";

export async function uploadToImageKit(file: File, folder: string = "gofocus"): Promise<{ url: string; publicId: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append("publicKey", PUBLIC_KEY);
    formData.append("folder", folder);
    formData.append("useUniqueFileName", "true");

    try {
        const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
            method: "POST",
            body: formData,
            headers: {
                "Authorization": `Basic ${btoa(PRIVATE_KEY + ":")}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erro no upload para ImageKit");
        }

        const data = await response.json();
        return {
            url: data.url,
            publicId: data.fileId
        };
    } catch (error) {
        console.error("ImageKit upload error:", error);
        throw error;
    }
}

export async function deleteFromImageKit(fileId: string): Promise<boolean> {
    if (!fileId) return false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Basic ${btoa(PRIVATE_KEY + ":")}`
            },
            signal: controller.signal
        });
        return response.ok;
    } catch (error) {
        console.error("ImageKit delete error:", error);
        return false;
    } finally {
        clearTimeout(timeout);
    }
}

export function getOptimizedUrl(url: string, width?: number, height?: number): string {
    if (!url || !url.includes("ik.imagekit.io")) return url;
    const transformations = [];
    if (width) transformations.push(`w-${width}`);
    if (height) transformations.push(`h-${height}`);
    transformations.push("q-90");
    transformations.push("f-auto");

    const transformString = transformations.join(",");
    return url.includes("?") ? `${url}&tr=${transformString}` : `${url}?tr=${transformString}`;
}
