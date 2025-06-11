import { createRequire } from "module";
import { col, fn, Op, where } from "sequelize";
const require = createRequire(import.meta.url);

import { deleteImageFromCloudinary } from "../../config/helpers/cloudinary.mjs";


const Sequelize = require("../../config/dbConnection");
const HallImages = require("../../models/HallImages.model");
const Hall = require("../../models/Hall.model");
const HallFacilities = require("../../models/HallFacilities.model");
const Rating = require("../../models/Rating.model");

const { getMessage } = require("../language/messages");
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");


export const createHall = async (req, res) => {
    const lang = getLanguage(req);

    const {
        name_ar,
        name_en,
        capacity,
        price_per_hour,
        description_ar,
        description_en,
        length,
        width,
        suitable_for_ar,
        suitable_for_en,
        type
    } = req.body;
    console.log(req.files)
    if (
        !name_ar || !name_en ||
        !capacity || !price_per_hour ||
        !description_ar || !description_en ||
        !length || !width || !suitable_for_ar || !suitable_for_en || !type ||
        !req.files.mainImage
    ) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const t = await Sequelize.transaction();
    try {
        const hall = await Hall.create({
            name: { ar: name_ar, en: name_en },
            capacity,
            price_per_hour,
            description: { ar: description_ar, en: description_en },
            length,
            width,
            suitable_for: { ar: suitable_for_ar, en: suitable_for_en },
            type
        }, { transaction: t });

        await HallImages.create({
            hall_id: hall.id,
            image_name_url: req.files.mainImage && req.files.mainImage[0] ? req.files.mainImage[0].path : null,
            main: true,
        }, { transaction: t });

        if (req.files.additionalImages) {
            const additionalImages = req.files.additionalImages.map((file) => ({
                hall_id: hall.id,
                image_name_url: file.path,
                main: false,
            }));
            await HallImages.bulkCreate(additionalImages, { transaction: t });
        }

        await t.commit();

        res.status(201).json({ message: getMessage("addedHall", lang), hall });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({
            message: getMessage("serverError", lang),
            error: error.message,
        });
    }
}

export const getHalls = async (req, res) => {
    const lang = getLanguage(req);
    const { page = 1, limit = 10, hallType } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    where.is_deleted = false;
    if (hallType) {
        where.type = hallType;
    }

    const hallsCount = await Hall.count({ where });

    const halls = await Hall.findAll({
        where,
        limit,
        offset,
        include: [
            {
                model: HallFacilities,
                as: "facilities",
                attributes: ["id", "name", "description", "image"],
                required: false,
            },
            {
                model: HallImages,
                as: "images",
                attributes: ["id", "image_name_url", "main"],
            }
        ],
    });

    if (!halls || halls.length === 0) {
        return res.status(404).json({ success: false, message: getMessage('hallsNotFound', lang) });
    }

    const hallIds = halls.map(hall => hall.id);

    const ratings = await Rating.findAll({
        where: {
            hall_id: {
                [Op.in]: hallIds
            }
        },
        attributes: [
            "hall_id",
            [fn("AVG", col("rating")), "averageRating"],
            [fn("COUNT", col("id")), "ratingCount"]
        ],
        group: ["hall_id"]
    });

    const ratingsMap = {};
    ratings.forEach(rating => {
        ratingsMap[rating.hall_id] = {
            averageRating: parseFloat(rating.get("averageRating")).toFixed(1),
            ratingCount: parseInt(rating.get("ratingCount"))
        };
    });

    const hallsWithRatings = halls.map(hall => {
        const ratingData = ratingsMap[hall.id] || { averageRating: 0, ratingCount: 0 };
        return {
            ...hall.toJSON(),
            averageRating: ratingData.averageRating,
            ratingCount: ratingData.ratingCount
        };
    });

    res.status(200).json({ halls: hallsWithRatings, totalCount: hallsCount });
};

export const getHallsNotAllData = async (req, res) => {
    const halls = await Hall.findAll({
        where: { is_deleted: false },
        attributes: ["id", "name"]
    });
    res.status(200).json(halls);
};

export const getHallById = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const hall = await Hall.findOne({
        where: {
            id: id,
            is_deleted: false
        },
        include: [
            {
                model: HallFacilities,
                as: "facilities",
                attributes: ["id", "name", "description", "image"],
                required: false,
            },
            {
                model: HallImages,
                as: "images",
                attributes: ["id", "image_name_url", "main"],
            },
        ],
    });
    if (!hall) {
        return res.status(404).json({ message: getMessage("hallNotFound", lang) });
    }
    res.status(200).json({ hall });
}

export const updateHall = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const { name_ar, name_en, capacity, price_per_hour, description_ar, description_en, length, width, suitable_for_ar, suitable_for_en, type } = req.body;
    if (!id || !name_ar || !name_en || !capacity || !price_per_hour || !description_ar || !description_en || !length || !width || !suitable_for_ar || !suitable_for_en || !type) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const hall = await Hall.findByPk(id);
    if (!hall) {
        return res.status(404).json({ message: getMessage("hallNotFound", lang) });
    }
    await hall.update({
        name: { ar: name_ar, en: name_en },
        capacity,
        price_per_hour,
        description: { ar: description_ar, en: description_en },
        length,
        width,
        suitable_for: { ar: suitable_for_ar, en: suitable_for_en },
        type
    });
    res.status(200).json({ message: getMessage("updatedHall", lang) });
}

export const addhallImage = async (req, res) => {
    const lang = getLanguage(req);

    const hall_id = req.params.id;

    if (!req.file) {
        return res.status(400).json({ message: getMessage("missingImage", lang) });
    }

    const hallImage = await HallImages.create({
        hall_id,
        image_name_url: req.file.path,
        main: false,
    });

    res.status(201).json({ message: getMessage("addedImage", lang), hallImage: hallImage });
}

export const updateMainImage = async (req, res) => {
    const lang = getLanguage(req);
    const id = req.params.id;

    const hallImage = await HallImages.findByPk(id);

    if (!hallImage) {
        return res.status(404).json({ message: getMessage("imageNotFound", lang) });
    }

    if (hallImage.image_name_url) {
        await deleteImageFromCloudinary(hallImage.image_name_url);
    }

    await hallImage.update({
        image_name_url: req.file.path,
    });
    res.status(200).json({ message: getMessage("updatedImage", lang) });
}


export const addFacility = async (req, res) => {
    const lang = getLanguage(req);
    const hall_id = req.params.id;

    const { name_ar, name_en, description_ar, description_en } = req.body;
    const image = req.file ? req.file.path : null;

    if (!name_ar || !name_en || !description_ar || !description_en) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const facility = await HallFacilities.create({
        hall_id,
        name: { ar: name_ar, en: name_en },
        description: { ar: description_ar, en: description_en },
        image
    });

    res.status(201).json({ message: getMessage("facilityAdded", lang), facility });
}

export const updateFacility = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const { name_ar, name_en, description_ar, description_en } = req.body;
    let image = req.file ? req.file.path : null;


    if (!id || !name_ar || !name_en || !description_ar || !description_en) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const facility = await HallFacilities.findByPk(id);
    if (!facility) {
        return res.status(404).json({ message: getMessage("facilityNotFound", lang) });
    }
    if (facility.image) {
        await deleteImageFromCloudinary(facility.image);
    }

    facility.update({
        name: { ar: name_ar, en: name_en },
        description: { ar: description_ar, en: description_en },
        image
    });

    res.status(200).json({ message: getMessage("facilityUpdated", lang), facility });
}

export const deleteFacility = async (req, res) => {
    const lang = getLanguage(req);

    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const facility = await HallFacilities.findByPk(id);

    if (!facility) {
        return res.status(404).json({ message: getMessage("facilityNotFound", lang) });
    }

    if (facility.image) {
        await deleteImageFromCloudinary(facility.image);
    }

    await facility.destroy();

    res.status(200).json({ message: getMessage("facilityDeleted", lang) });
}


export const deleteHallImage = async (req, res) => {
    const lang = getLanguage(req);
    const image_id = req.params.id;

    const hallImage = await HallImages.findByPk(image_id);

    if (!hallImage) {
        return res.status(404).json({ message: getMessage("imageNotFound", lang) });
    }
    if (hallImage.main === true) {
        return res.status(400).json({ message: getMessage("cannotDeleteMainImage", lang) });
    }

    if (hallImage.image_name_url) {
        await deleteImageFromCloudinary(hallImage.image_name_url);
    }

    await hallImage.destroy();

    res.status(200).json({ message: getMessage("deletedImage", lang) });
}

export const deleteHall = async (req, res) => {
    const lang = getLanguage(req);

    const hall_id = req.params.id;

    const images = await HallImages.findAll({ where: { hall_id: hall_id } });

    const fImages = await HallFacilities.findAll({ where: { hall_id: hall_id } })

    for (const image of images) {
        if (image.image_name_url) {
            await deleteImageFromCloudinary(image.image_name_url);
        }
    }

    for (const image of fImages) {
        if (image.image) {
            await deleteImageFromCloudinary(image.image);
        }
    }

    const hall = await Hall.findByPk(hall_id);

    if (!hall) {
        return res.status(404).json({ message: getMessage("hallNotFound", lang) });
    }

    hall.is_deleted = true;
    await hall.save();

    res.status(200).json({ message: getMessage("hallDeleted", lang) });
}

