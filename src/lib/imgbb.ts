const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || "0b60291bdcb444e18a9c44a2c4ff0c1e";

export interface ImgBBResponse {
    data: {
        id: string;
        title: string;
        url_viewer: string;
        url: string;
        display_url: string;
        width: number;
        height: number;
        size: number;
        time: number;
        expiration: number;
        image: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        thumb: {
            filename: string;
            name: string;
            mime: string;
            extension: string;
            url: string;
        };
        delete_url: string;
    };
    success: boolean;
    status: number;
}

/**
 * Uploads a file to ImgBB.
 * Returns the secure URL and an ID for the uploaded image.
 */
export async function uploadToImgBB(file: File): Promise<{ url: string; publicId: string }> {
    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch(
            `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("ImgBB Error Data:", errorData);
            throw new Error(errorData.error?.message || "Erro no upload para ImgBB");
        }

        const data: ImgBBResponse = await response.json();

        if (!data.success) {
            throw new Error("ImgBB upload was not successful");
        }

        // ImgBB returns a direct link in data.data.url or data.data.display_url
        return {
            url: data.data.url,
            publicId: data.data.id
        };
    } catch (error) {
        console.error("ImgBB upload error:", error);
        throw error;
    }
}
