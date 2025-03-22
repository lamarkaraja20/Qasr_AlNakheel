import { createRequire } from "module";
const require = createRequire(import.meta.url);

const fs = require("fs");
import { fileURLToPath } from "url";

const path = require("path");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Sequelize = require("../../config/dbConnection");
const Restaurant = require("../../models/Restaurant.model");
const RestaurantImages = require("../../models/RestaurantImages.model");

const { getMessage } = require("../language/messages");
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const createRestaurant = async (req, res) => {
    const lang = getLanguage(req);
    const { name_ar, name_en, capacity, opening_hours, cuisine_type_en, cuisine_type_ar, description_ar, description_en } = req.body;

    if (!name_ar || !name_en || !capacity) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const t = await Sequelize.transaction();
    try {
        const restaurant = await Restaurant.create({
            name: { ar: name_ar, en: name_en },
            capacity,
            Opening_hours: opening_hours,
            Cuisine_type: { ar: cuisine_type_ar, en: cuisine_type_en},
            description: { ar: description_ar, en: description_en },
        }, { transaction: t });

        await RestaurantImages.create({
            rest_id: restaurant.id,
            image_name_url: req.files.mainImage && req.files.mainImage[0] ? req.files.mainImage[0].filename : null,
            main: true,
        }, { transaction: t });

        if (req.files.additionalImages) {
            const additionalImages = req.files.additionalImages.map((file) => ({
                rest_id: restaurant.id,
                image_name_url: file.filename,
                main: false,
            }));
            await RestaurantImages.bulkCreate(additionalImages, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ message: getMessage("addedRestaurant", lang), restaurant });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({
            message: getMessage("serverError", lang),
            error: error.message,
        });
    }
};

export const getRestaurants = async (req, res) => {
    const lang = getLanguage(req);

    const restaurants = await Restaurant.findAll({
        include: [
            { model: RestaurantImages, as: "images" },
        ],
    });
    if (!restaurants.length) {
        return res.status(404).json({ message: getMessage("restaurantsNotFound", lang) });
    }
    res.status(200).json(restaurants);

};

export const getRestaurantById = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id,
        {
            include: [
                { model: RestaurantImages, as: "images" },
            ],
        }
    );
    if (!restaurant) {
        return res.status(404).json({ message: getMessage("restaurantsNotFound", lang) });
    }
    res.status(200).json(restaurant);

};

export const updateRestaurant = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const { name_ar, name_en, capacity, opening_hours, cuisine_type_en, cuisine_type_ar, description_ar, description_en } = req.body;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
        return res.status(404).json({ message: getMessage("restaurantNotFound", lang) });
    }

    await restaurant.update({
        name: { ar: name_ar, en: name_en },
        capacity,
        Opening_hours: opening_hours,
        Cuisine_type: { ar: cuisine_type_ar, en: cuisine_type_en },
        description: { ar: description_ar, en: description_en },
    });

    res.status(200).json({ message: getMessage("updatedRestaurant", lang), restaurant });

};


export const addRestaurantImage = async (req, res) => {
    const lang = getLanguage(req);

    const rest_id = req.params.id;

    if (!req.file) {
        return res.status(400).json({ message: getMessage("missingImage", lang) });
    }

    const restaurantImage = await RestaurantImages.create({
        rest_id,
        image_name_url: req.file.filename,
        main: false,
    });

    res.status(201).json({ message: getMessage("addedImage", lang), restaurantImage: restaurantImage });
}

export const updateMainImage = async (req, res) => {
    const lang = getLanguage(req);
    const id = req.params.id;

    const restaurantImage = await RestaurantImages.findByPk(id);

    if (!restaurantImage) {
        return res.status(404).json({ message: getMessage("imageNotFound", lang) });
    }

    const imagePath = path.join(__dirname, "../../uploads/restaurantImages", restaurantImage.image_name_url);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    await restaurantImage.update({
        image_name_url: req.file.filename,
    });
    res.status(200).json({ message: getMessage("updatedImage", lang) });
}

export const deleteRestaurantImage = async (req, res) => {
    const lang = getLanguage(req);
    const image_id = req.params.id;

    const restaurantImage = await RestaurantImages.findByPk(image_id);

    if (!restaurantImage) {
        return res.status(404).json({ message: getMessage("imageNotFound", lang) });
    }
    if (restaurantImage.main === true) {
        return res.status(400).json({ message: getMessage("cannotDeleteMainImage", lang) });
    }

    const imagePath = path.join(__dirname, "../../uploads/restaurantImages", restaurantImage.image_name_url);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    await restaurantImage.destroy();

    res.status(200).json({ message: getMessage("deletedImage", lang) });
}

export const deleteRestaurant = async (req, res) => {
    const lang = getLanguage(req);

    const rest_id = req.params.id;

    const images = await RestaurantImages.findAll({ where: { rest_id: rest_id } });


    images.forEach((image) => {
        const imagePath = path.join(__dirname, "../../uploads/restaurantImages", image.image_name_url);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    });

    const restaurant = await Restaurant.findByPk(rest_id);

    if (!restaurant) {
        return res.status(404).json({ message: getMessage("restaurantsNotFound", lang) });
    }

    await restaurant.destroy();

    res.status(200).json({ message: getMessage("restaurantDeleted", lang) });
}