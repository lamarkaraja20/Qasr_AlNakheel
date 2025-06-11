import { createRequire } from "module";
const require = createRequire(import.meta.url);

const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const getPublicIdFromUrl = (url) => {
    try {
        const parts = url.split('/');
        const fileNameWithExtension = parts[parts.length - 1];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${fileNameWithExtension.split('.')[0]}`;
        return publicId;
    } catch (err) {
        return null;
    }
};

export const deleteImageFromCloudinary = async (imageUrl) => {
    const publicId = getPublicIdFromUrl(imageUrl);
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error(`❌ Error deleting image from Cloudinary: ${err.message}`);
    }
};