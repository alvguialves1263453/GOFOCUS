const PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || "";
const URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || "";
const PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY || "";

/**
 * Uploads a file to ImageKit.
 * Note: Client-side upload using private key is NOT recommended for production.
 * For a real app, you should use an authentication endpoint.
 */
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
            console.error("ImageKit Error:", errorData);
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

/**
 * Deletes a file from ImageKit using its fileId.
 */
export async function deleteFromImageKit(fileId: string): Promise<boolean> {
    if (!fileId) return false;

    try {
        const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Basic ${btoa(PRIVATE_KEY + ":")}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("ImageKit Delete Error:", errorData);
            return false;
        }

        return true;
    } catch (error) {
        console.error("ImageKit delete error:", error);
        return false;
    }
}

/**
 * Returns an optimized URL for a given ImageKit URL.
 * Example: Adding transformations for width, height, or quality.
 */
export function getOptimizedUrl(url: string, width?: number, height?: number): string {
    if (!url || !url.includes("ik.imagekit.io")) return url;

    const transformations = [];
    if (width) transformations.push(`w-${width}`);
    if (height) transformations.push(`h-${height}`);
    transformations.push("q-90"); // High quality for photographers
    transformations.push("f-auto"); // Automatic format (webp/avif)


    const transformString = transformations.join(",");

    // Append transformation to URL
    if (url.includes("?")) {
        return `${url}&tr=${transformString}`;
    }
    return `${url}?tr=${transformString}`;
}
