

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// إعداد بيانات Cloudinary - يفضل استخدام .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// دالة لإنشاء Multer باستخدام Cloudinary
const createCloudinaryUpload = (folder, fields = null, limits = { fileSize: 15 * 1024 * 1024 }) => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            return {
                folder,
                format: file.mimetype.split('/')[1], // jpg, png, etc.
                public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/\s+/g, '-')}`
            };
        }
    });

    const fileFilter = (req, file, cb) => {
        const allowedFileTypes = /jpeg|jpg|png/;
        const mimetype = allowedFileTypes.test(file.mimetype);
        const extname = allowedFileTypes.test(file.originalname.toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG, JPG, PNG files are allowed'));
    };

    return fields ?
        multer({ storage, limits, fileFilter }).fields(fields) :
        multer({ storage, limits, fileFilter }).single('image');
};

// استخدامات متعددة حسب نوع الصور
const uploadprofilePicturesImage = createCloudinaryUpload('profilePictures');

const uploadRoomImages = createCloudinaryUpload('roomImages', [
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);

const uploadSingleRoomImage = createCloudinaryUpload('roomImages');

const uploadHallImages = createCloudinaryUpload('hallImages', [
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);
const addHallImage = createCloudinaryUpload('hallImages');

const uploadPoolImages = createCloudinaryUpload('poolImages', [
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);
const uploadMorePoolImage = createCloudinaryUpload('poolImages');

const uploadRestaurantImages = createCloudinaryUpload('restaurantImages', [
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);
const uploadMoreRestaurantImage = createCloudinaryUpload('restaurantImages');

const uploadServiceImage = createCloudinaryUpload('serviceImage');

const uploadFacilityImages = createCloudinaryUpload('facilitiesImages');
const uploadFacilitiesImages = createCloudinaryUpload('facilitiesImages', [
    { name: 'images', maxCount: 10 }
]);

module.exports = {
    uploadprofilePicturesImage,
    uploadPoolImages,
    addHallImage,
    uploadHallImages,
    uploadFacilityImages,
    uploadRoomImages,
    uploadServiceImage,
    uploadSingleRoomImage,
    uploadFacilitiesImages,
    uploadMorePoolImage,
    uploadRestaurantImages,
    uploadMoreRestaurantImage
};
