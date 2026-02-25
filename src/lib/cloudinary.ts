const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dhhims97u";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";

/**
 * Uploads a file to Cloudinary in the 'gofocus' folder.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "gofocus");

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Cloudinary Error Data:", errorData);
            const message = errorData.error?.message || "Erro no upload para Cloudinary";
            if (message.includes("upload_preset")) {
                throw new Error(`Cloudinary Error: ${message}. Certifique-se que o preset '${UPLOAD_PRESET}' está como 'Unsigned' no seu painel da Cloudinary.`);
            }
            throw new Error(message);
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}
