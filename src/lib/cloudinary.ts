const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dhhims97u";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || "";
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || "";

/**
 * Compresses an image before upload.
 */
async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error("Erro na compressão da imagem"));
                        }
                    },
                    "image/jpeg",
                    0.7 // quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

/**
 * Uploads a file to Cloudinary in the 'gofocus' folder.
 * Returns the secure URL and public_id of the uploaded image.
 */
export async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
    const compressedBlob = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressedBlob, file.name);
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
        return { url: data.secure_url, publicId: data.public_id };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
}
/**
 * Generates a SHA-1 signature for Cloudinary requests.
 */
async function generateSignature(publicId: string, timestamp: number): Promise<string> {
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Deletes an image from Cloudinary using its public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
    if (!publicId) return false;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = await generateSignature(publicId, timestamp);

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", API_KEY);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Cloudinary Delete Error:", errorData);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        return false;
    }
}
