import { createRequire } from "module";
import { col, fn, Op } from "sequelize";
const require = createRequire(import.meta.url);
import { deleteImageFromCloudinary } from "../../config/helpers/cloudinary.mjs";


const Sequelize = require("../../config/dbConnection");
const Restaurant = require("../../models/Restaurant.model");
const RestaurantImages = require("../../models/RestaurantImages.model");
const Rating = require("../../models/Rating.model");

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
            Cuisine_type: { ar: cuisine_type_ar, en: cuisine_type_en },
            description: { ar: description_ar, en: description_en },
        }, { transaction: t });

        await RestaurantImages.create({
            rest_id: restaurant.id,
            image_name_url: req.files.mainImage && req.files.mainImage[0] ? req.files.mainImage[0].path : null,
            main: true,
        }, { transaction: t });

        if (req.files.additionalImages) {
            const additionalImages = req.files.additionalImages.map((file) => ({
                rest_id: restaurant.id,
                image_name_url: file.path,
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
        where: { is_deleted: false },
        include: [
            { model: RestaurantImages, as: "images" },
        ],
    });

    if (!restaurants.length) {
        return res.status(404).json({ message: getMessage("restaurantsNotFound", lang) });
    }

    const restaurantIds = restaurants.map(rest => rest.id);

    const ratings = await Rating.findAll({
        where: {
            rest_id: {
                [Op.in]: restaurantIds
            }
        },
        attributes: [
            "rest_id",
            [fn("AVG", col("rating")), "averageRating"],
            [fn("COUNT", col("id")), "ratingCount"]
        ],
        group: ["rest_id"]
    });

    const ratingsMap = {};
    ratings.forEach(rating => {
        ratingsMap[rating.rest_id] = {
            averageRating: parseFloat(rating.get("averageRating")).toFixed(1),
            ratingCount: parseInt(rating.get("ratingCount"))
        };
    });

    const restaurantsWithRatings = restaurants.map(rest => {
        const ratingData = ratingsMap[rest.id] || { averageRating: "0.0", ratingCount: 0 };
        return {
            ...rest.toJSON(),
            averageRating: ratingData.averageRating,
            ratingCount: ratingData.ratingCount
        };
    });

    res.status(200).json(restaurantsWithRatings);
};

export const getRestaurantById = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const restaurant = await Restaurant.findOne({
        where: { id: id, is_deleted: false },
        include: [
            { model: RestaurantImages, as: "images" },
        ],
    });

    if (!restaurant) {
        return res.status(404).json({ message: getMessage("restaurantsNotFound", lang) });
    }

    const rating = await Rating.findOne({
        where: { rest_id: id },
        attributes: [
            [fn("AVG", col("rating")), "averageRating"],
            [fn("COUNT", col("id")), "ratingCount"]
        ],
    });

    const averageRating = rating?.get("averageRating") ? parseFloat(rating.get("averageRating")).toFixed(1) : "0.0";
    const ratingCount = rating?.get("ratingCount") ? parseInt(rating.get("ratingCount")) : 0;

    const restaurantWithRating = {
        ...restaurant.toJSON(),
        averageRating,
        ratingCount
    };

    res.status(200).json(restaurantWithRating);
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
        image_name_url: req.file.path,
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

    if (restaurantImage.image_name_url) {
        await deleteImageFromCloudinary(restaurantImage.image_name_url);
    }

    await restaurantImage.update({
        image_name_url: req.file.path,
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

    if (restaurantImage.image_name_url) {
        await deleteImageFromCloudinary(restaurantImage.image_name_url);
    }

    await restaurantImage.destroy();

    res.status(200).json({ message: getMessage("deletedImage", lang) });
}

export const deleteRestaurant = async (req, res) => {
    const lang = getLanguage(req);

    const rest_id = req.params.id;

    const images = await RestaurantImages.findAll({ where: { rest_id: rest_id } });

    for (const image of images) {
        if (image.image_name_url) {
            await deleteImageFromCloudinary(image.image_name_url);
        }
    }

    const restaurant = await Restaurant.findByPk(rest_id);

    if (!restaurant) {
        return res.status(404).json({ message: getMessage("restaurantsNotFound", lang) });
    }

    restaurant.is_deleted = true;
    await restaurant.save();

    res.status(200).json({ message: getMessage("restaurantDeleted", lang) });
}