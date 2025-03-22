const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const createMulterUpload = (uploadDir, limits, fields = null) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, `../uploads/${uploadDir}`);
            ensureDirExists(uploadPath);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const name = path.parse(file.originalname).name.replace(/\s+/g, '-'); // إزالة المسافات من الاسم الأصلي
            const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${name}${ext}`;
            cb(null, uniqueName);
        },
    });

    const fileFilter = (req, file, cb) => {
        const allowedFileTypes = /jpeg|jpg|png/;
        const mimetype = allowedFileTypes.test(file.mimetype);
        const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error(`File upload only supports JPEG, JPG, PNG`));
    };

    return fields ?
        multer({ storage, limits, fileFilter }).fields(fields) :
        multer({ storage, limits, fileFilter }).single('image');
};

const uploadprofilePicturesImage = createMulterUpload('profilePictures', { fileSize: 15 * 1024 * 1024 });

const uploadRoomImages = createMulterUpload('roomImages', { fileSize: 15 * 1024 * 1024 }, [
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);

const uploadSingleRoomImage = createMulterUpload('roomImages', { fileSize: 15 * 1024 * 1024 });

const uploadHallImages = createMulterUpload('hallImages', { fileSize: 15 * 1024 * 1024 }, [
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);
const addHallImage = createMulterUpload('hallImages', { fileSize: 15 * 1024 * 1024 });

const uploadPoolImages = createMulterUpload('PoolImages', { fileSize: 15 * 1024 * 1024 }, [
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);
const uploadMorePoolImage = createMulterUpload('PoolImages', { fileSize: 15 * 1024 * 1024 });

const uploadRestaurantImages = createMulterUpload('restaurantImages', { fileSize: 15 * 1024 * 1024 }, [
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
]);
const uploadMoreRestaurantImage = createMulterUpload('restaurantImages', { fileSize: 15 * 1024 * 1024 });


const uploadServiceImage = createMulterUpload('serviceImage', { fileSize: 15 * 1024 * 1024 });

const uploadFacilityImages = createMulterUpload('facilitiesImages', { fileSize: 15 * 1024 * 1024 });
const uploadFacilitiesImages = createMulterUpload('facilitiesImages', { fileSize: 15 * 1024 * 1024 }, [
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
