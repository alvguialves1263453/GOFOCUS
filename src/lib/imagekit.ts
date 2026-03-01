const PUBLIC_KEY = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || "";
const URL_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || "";
const PRIVATE_KEY = import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY || "";

/**
 * Uploads a file to ImageKit.
 * Note: Client-side upload using private key is NOT recommended for production.
 * For a real app, you should use an authentication endpoint.
 */
export async function uploadToImageKit(file: File): Promise<{ url: string; publicId: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append("publicKey", PUBLIC_KEY);

    // ImageKit requires a signature for client-side uploads if not using an auth endpoint.
    // In a pure frontend app without a backend to sign, we'd have to use their SDK or a simple POST.
    // However, ImageKit API for direct upload usually needs authentication.

    try {
        // For this simple implementation, we'll use a basic fetch.
        // NOTE: ImageKit normally expects a signature. We'll try a direct upload if possible
        // but the most reliable way in a frontend-only app is using the SDK with an auth endpoint.
        // If we MUST do it purely frontend with the private key (unsafe), we generate a signature here.

        const expire = Math.floor(Date.now() / 1000) + 3600;
        const token = crypto.randomUUID();

        // Simple mock signature generation logic (requires hmac-sha1 usually)
        // For now, since we don't have a backend, we'll use the Public API flow if available
        // or provide the simplest possible implementation.

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
 * Returns an optimized URL for a given ImageKit URL.
 * Example: Adding transformations for width, height, or quality.
 */
export function getOptimizedUrl(url: string, width?: number, height?: number): string {
    if (!url || !url.includes("ik.imagekit.io")) return url;

    const transformations = [];
    if (width) transformations.push(`w-${width}`);
    if (height) transformations.push(`h-${height}`);
    transformations.push("q-auto"); // Automatic quality
    transformations.push("f-auto"); // Automatic format (webp/avif)

    const transformString = transformations.join(",");

    // Append transformation to URL
    if (url.includes("?")) {
        return `${url}&tr=${transformString}`;
    }
    return `${url}?tr=${transformString}`;
}
