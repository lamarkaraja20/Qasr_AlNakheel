import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require("fs");
import { fileURLToPath } from "url";

const path = require("path");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Sequelize = require("../../config/dbConnection");
const HallImages = require("../../models/HallImages.model");
const Hall = require("../../models/Hall.model");
const HallFacilities = require("../../models/HallFacilities.model");

const { getMessage } = require("../language/messages");
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");


export const createHall = async (req, res) => {
    const lang = getLanguage(req);

    const { name_ar, name_en, capacity, price_per_hour, description_ar, description_en } = req.body;
    if (!name_ar || !name_en || !capacity || !price_per_hour || !description_ar || !description_en || !req.files.mainImage) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const t = await Sequelize.transaction();
    try {
        const hall = await Hall.create({
            name: { ar: name_ar, en: name_en },
            capacity,
            price_per_hour,
            description: { ar: description_ar, en: description_en },
        }, { transaction: t });

        await HallImages.create({
            hall_id: hall.id,
            image_name_url: req.files.mainImage && req.files.mainImage[0] ? req.files.mainImage[0].filename : null,
            main: true,
        }, { transaction: t });

        if (req.files.additionalImages) {
            const additionalImages = req.files.additionalImages.map((file) => ({
                hall_id: hall.id,
                image_name_url: file.filename,
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
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const hallsCount = await Hall.count();
    const halls = await Hall.findAll({
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
            },
        ],
    });
    if (!halls) {
        return res.status(404).json({ success: false, message: getMessage('hallsNotFound', lang) });
    }

    res.status(200).json({ halls, totalCount: hallsCount });
}

export const getHallById = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const hall = await Hall.findByPk(id, {
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
    const { name_ar, name_en, capacity, price_per_hour, description_ar, description_en } = req.body;
    if (!id || !name_ar || !name_en || !capacity || !price_per_hour || !description_ar || !description_en) {
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
        image_name_url: req.file.filename,
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

    const imagePath = path.join(__dirname, "../../uploads/hallImages", hallImage.image_name_url);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    await hallImage.update({
        image_name_url: req.file.filename,
    });
    res.status(200).json({ message: getMessage("updatedImage", lang) });
}


export const addFacility = async (req, res) => {
    const lang = getLanguage(req);
    const hall_id = req.params.id;

    const { name_ar, name_en, description_ar, description_en } = req.body;
    const image = req.file ? req.file.filename : null;

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
    let image = req.file ? req.file.filename : null;

    if (!id || !name_ar || !name_en || !description_ar || !description_en) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const facility = await HallFacilities.findByPk(id);
    if (!facility) {
        return res.status(404).json({ message: getMessage("facilityNotFound", lang) });
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

    const imagePath = path.join(__dirname, "../../uploads/facilitiesImages", facility.image);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
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

    const imagePath = path.join(__dirname, "../../uploads/hallImages", hallImage.image_name_url);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    await hallImage.destroy();

    res.status(200).json({ message: getMessage("deletedImage", lang) });
}

export const deleteHall = async (req, res) => {
    const lang = getLanguage(req);

    const hall_id = req.params.id;

    const images = await HallImages.findAll({ where: { hall_id: hall_id } });

    const fImages = await HallFacilities.findAll({ where: { hall_id: hall_id } })

    images.forEach((image) => {
        const imagePath = path.join(__dirname, "../../uploads/hallImages", image.image_name_url);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    });

    fImages.forEach((image) => {
        const imagePath = path.join(__dirname, "../../uploads/facilitiesImages", image.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    });

    const hall = await Hall.findByPk(hall_id);

    if (!hall) {
        return res.status(404).json({ message: getMessage("hallNotFound", lang) });
    }

    await hall.destroy();

    res.status(200).json({ message: getMessage("hallDeleted", lang) });
}

