import { createRequire } from "module";
import { col, fn, Op } from "sequelize";
const require = createRequire(import.meta.url);

import { deleteImageFromCloudinary } from "../../config/helpers/cloudinary.mjs";
const sequelize = require("../../config/dbConnection");


const Sequelize = require("../../config/dbConnection");
const Room = require("../../models/Room.model");
const RoomImage = require("../../models/RoomImage.model");
const RoomPricing = require("../../models/RoomPricing.model");
const Booking = require("../../models/Booking.model");
const Service = require("../../models/Service.model");
const RoomService = require("../../models/RoomService.model");
const SpecialPricing = require("../../models/SpecialPricing.model");
const RoomType = require("../../models/RoomType.model");
const Rating = require("../../models/Rating.model");

const { getMessage } = require("../language/messages");

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const addRoom = async (req, res) => {
    const lang = getLanguage(req);

    const { room_no, type, capacity, room_length, num_of_baths, adult_guests, child_guests, category_ar, category_en, bed_type_ar, bed_type_en, pricing, services } = req.body;

    if (!room_no || !type || !capacity || !req.files.mainImage || !pricing) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const t = await Sequelize.transaction();
    try {
        const newRoom = await Room.create({
            room_no,
            type,
            capacity,
            room_length,
            num_of_baths,
            adult_guests,
            child_guests,
            category: { ar: category_ar, en: category_en },
            bed_type: { ar: bed_type_ar, en: bed_type_en },
        }, { transaction: t });

        await RoomImage.create({
            room_id: newRoom.id,
            image_name_url: req.files.mainImage && req.files.mainImage[0] ? req.files.mainImage[0].path : null,
            main: true,
        }, { transaction: t });

        if (req.files.additionalImages) {
            const additionalImages = req.files.additionalImages.map((file) => ({
                room_id: newRoom.id,
                image_name_url: file.path,
                main: false,
            }));
            await RoomImage.bulkCreate(additionalImages, { transaction: t });
        }

        if (Array.isArray(services) && services.length > 0) {
            const serviceRecords = services.map(service => ({
                room_id: newRoom.id,
                service_id: service
            }));
            await RoomService.bulkCreate(serviceRecords, { transaction: t });
        }

        if (Array.isArray(pricing) && pricing.length === 7) {
            const parsedPricing = pricing.map(priceEntry => JSON.parse(priceEntry));
            const roomPricing = parsedPricing.map((priceEntry) => ({
                room_id: newRoom.id,
                day_of_week: priceEntry.day,
                price: priceEntry.price,
            }));
            await RoomPricing.bulkCreate(roomPricing, { transaction: t });
        } else {
            return res.status(400).json({ message: getMessage("invalidPricing", lang) });
        }

        await t.commit();

        res.status(201).json({ message: getMessage("addedRoom", lang), room: newRoom, });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({
            message: getMessage("serverError", lang),
            error: error.message,
        });
    }
}

export const getAllRoomsNotAllData = async (req, res) => {
    const lang = getLanguage(req);
    const { page = 1, limit = 10, capacity, type, search, active } = req.query;
    const where = {};
    where.is_deleted = false;

    if (capacity) {
        const parsedCapacity = parseInt(capacity, 10);
        if (!isNaN(parsedCapacity)) where.capacity = parsedCapacity;
    }
    if (type) where.type = type;
    if (search) {
        where.room_no = { [Op.iLike]: `%${search}%` };
    }
    if (active) where.isActive = active === 'true';


    const offset = (page - 1) * limit;

    const totalCount = await Room.count({ where });

    const rooms = await Room.findAll({
        attributes: ["id", "room_no", "category", "isActive"],
        where,
        limit,
        offset,
        include: [{
            model: RoomType,
            attributes: ["id", "name"],
            required: false
        }, {
            model: RoomImage,
            attributes: ["id", "image_name_url", "main"],
            required: false,
            where: { main: true }
        },{
            model: RoomPricing,
            attributes: ["id", "day_of_week", "price"],
            required: false
        }],
    });

    if (!rooms.length) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    const roomIds = rooms.map(room => room.id);

    // ✅ جلب التقييمات
    const ratings = await Rating.findAll({
        where: {
            room_id: { [Op.in]: roomIds }
        },
        attributes: [
            "room_id",
            [fn("AVG", col("rating")), "averageRating"],
            [fn("COUNT", col("id")), "ratingCount"]
        ],
        group: ["room_id"]
    });

    const ratingsMap = {};
    ratings.forEach(rating => {
        ratingsMap[rating.room_id] = {
            averageRating: parseFloat(rating.get("averageRating")).toFixed(1),
            ratingCount: parseInt(rating.get("ratingCount"))
        };
    });

    const today = new Date();
    const roomsWithExtra = await Promise.all(rooms.map(async room => {
        const isBooked = await Booking.findOne({
            where: {
                room_id: room.id,
                check_in_date: { [Op.lte]: today },
                check_out_date: { [Op.gt]: today },
                status: "confirmed",
            },
        });

        const ratingData = ratingsMap[room.id] || { averageRating: "0.0", ratingCount: 0 };

        return {
            ...room.toJSON(),
            isBooked: !!isBooked,
            averageRating: ratingData.averageRating,
            ratingCount: ratingData.ratingCount
        };
    }));

    res.status(200).json({ rooms: roomsWithExtra, totalCount, totalPages: Math.ceil(totalCount / limit) });
}

export const getAvailableRoomPerType = async (req, res) => {
    const lang = getLanguage(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const roomTypes = await RoomType.findAll();

    const result = [];

    for (const type of roomTypes) {
        const availableRoom = await Room.findOne({
            where: {
                type: type.id,
                isActive: true,
                is_deleted: false,
            },
            include: [
                {
                    model: Booking,
                    required: false,
                    where: {
                        status: "confirmed",
                        check_in_date: { [Op.lte]: today },
                        check_out_date: { [Op.gt]: today },
                    },
                },
                {
                    model: RoomImage,
                    attributes: ["id", "image_name_url", "main"],
                    required: false,
                },
                {
                    model: RoomPricing,
                    attributes: ["id", "day_of_week", "price"],
                    required: false,
                },
                {
                    model: SpecialPricing,
                    where: { end_date: { [Op.gt]: today } },
                    attributes: ["id", "name", "description", "start_date", "end_date", "price"],
                    required: false,
                },
                {
                    model: Service,
                    through: { attributes: [] },
                    attributes: ["id", "name", "description", "image"],
                    required: false,
                },
            ],
        });

        if (availableRoom && (!availableRoom.Bookings || availableRoom.Bookings.length === 0)) {
            // ✅ جلب التقييم الخاص بالغرفة
            const rating = await Rating.findOne({
                where: { room_id: availableRoom.id },
                attributes: [
                    [fn("AVG", col("rating")), "averageRating"],
                    [fn("COUNT", col("id")), "ratingCount"]
                ],
            });

            const averageRating = rating?.get("averageRating") ? parseFloat(rating.get("averageRating")).toFixed(1) : "0.0";
            const ratingCount = rating?.get("ratingCount") ? parseInt(rating.get("ratingCount")) : 0;

            const typeData = {
                id: type.id,
                name: type.name,
                description: type.description,
                room: {
                    ...availableRoom.toJSON(),
                    isBooked: false,
                    averageRating,
                    ratingCount
                }
            };
            result.push(typeData);
        }
    }

    res.status(200).json({ roomTypes: result, totalCount: result.length });
}

export const getAllRooms = async (req, res) => {
    const lang = getLanguage(req);
    const { page = 1, limit = 10, type, search, active } = req.query;
    const where = {};
    where.is_deleted = false;

    if (type) where.type = type;
    if (search) {
        where.room_no = { [Op.like]: `%${search}%` };
    }
    if (active) where.isActive = active === 'true';

    const offset = (page - 1) * limit;

    const totalCount = await Room.count({ where });

    const rooms = await Room.findAll({
        where,
        limit,
        offset,
        include: [{
            model: RoomType,
            attributes: ["id", "name", "description"],
            required: false
        }, {
            model: RoomImage,
            attributes: ["id", "image_name_url", "main"],
            required: false
        }, {
            model: RoomPricing,
            attributes: ["id", "day_of_week", "price"],
            required: false
        }, {
            model: SpecialPricing,
            where: { end_date: { [Op.gt]: new Date() } },
            attributes: ["id", "name", "description", "start_date", "end_date", "price"],
            required: false
        }, {
            model: Service,
            through: { attributes: [] },
            attributes: ["id", "name", "description", "image"],
            required: false
        }],
    });

    if (!rooms.length) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    const roomIds = rooms.map(room => room.id);

    // ✅ جلب التقييمات
    const ratings = await Rating.findAll({
        where: {
            room_id: { [Op.in]: roomIds }
        },
        attributes: [
            "room_id",
            [fn("AVG", col("rating")), "averageRating"],
            [fn("COUNT", col("id")), "ratingCount"]
        ],
        group: ["room_id"]
    });

    const ratingsMap = {};
    ratings.forEach(rating => {
        ratingsMap[rating.room_id] = {
            averageRating: parseFloat(rating.get("averageRating")).toFixed(1),
            ratingCount: parseInt(rating.get("ratingCount"))
        };
    });

    const today = new Date();
    const roomsWithExtra = await Promise.all(rooms.map(async room => {
        const isBooked = await Booking.findOne({
            where: {
                room_id: room.id,
                check_in_date: { [Op.lte]: today },
                check_out_date: { [Op.gt]: today },
                status: "confirmed",
            },
        });

        const ratingData = ratingsMap[room.id] || { averageRating: "0.0", ratingCount: 0 };

        return {
            ...room.toJSON(),
            isBooked: !!isBooked,
            averageRating: ratingData.averageRating,
            ratingCount: ratingData.ratingCount
        };
    }));

    res.status(200).json({ rooms: roomsWithExtra, totalCount, totalPages: Math.ceil(totalCount / limit) });
}

export const getRoomById = async (req, res) => {
    const lang = getLanguage(req);
    const room_id = req.params.id;

    const room = await Room.findOne({
        where: {
            id: room_id,
            is_deleted: false
        },
        include: [{
            model: RoomType,
            attributes: ["id", "name", "description"],
            required: false
        }, {
            model: RoomImage,
            attributes: ["id", "image_name_url", "main"],
            required: false
        }, {
            model: RoomPricing,
            attributes: ["id", "day_of_week", "price"],
            required: false
        }, {
            model: SpecialPricing,
            where: { end_date: { [Op.gt]: new Date() } },
            attributes: ["id", "name", "description", "start_date", "end_date", "price"],
            required: false
        }, {
            model: Service,
            through: { attributes: [] },
            attributes: ["id", "name", "description", "image"],
            required: false
        }],
    });

    if (!room) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    const today = new Date();
    const isBooked = await Booking.findOne({
        where: {
            room_id,
            check_in_date: { [Op.lte]: today },
            check_out_date: { [Op.gt]: today },
            status: "confirmed",
        },
    });

    const rating = await Rating.findOne({
        where: { room_id },
        attributes: [
            [fn("AVG", col("rating")), "averageRating"],
            [fn("COUNT", col("id")), "ratingCount"]
        ],
    });

    const averageRating = rating?.get("averageRating") ? parseFloat(rating.get("averageRating")).toFixed(1) : "0.0";
    const ratingCount = rating?.get("ratingCount") ? parseInt(rating.get("ratingCount")) : 0;

    const roomWithExtra = {
        ...room.toJSON(),
        isBooked: !!isBooked,
        averageRating,
        ratingCount
    };

    res.status(200).json({ room: roomWithExtra });
}

export const changeRoomActiveStatis = async (req, res,) => {
    const lang = getLanguage(req);
    const room_id = req.params.id;

    if (!room_id) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const room = await Room.findByPk(room_id);

    if (!room) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    room.isActive = !room.isActive;

    await room.save();

    res.status(200).json({
        message: getMessage("statusUpdated", lang),
        isActive: room.isActive,
    });
}

export const updateRoom = async (req, res) => {
    const lang = getLanguage(req);
    const room_id = req.params.id;
    const { room_no, type, capacity,
        room_length, num_of_baths, adult_guests, child_guests,
        category_ar, category_en, bed_type_ar, bed_type_en
    } = req.body;

    if (!room_id || !room_no || !type || !capacity
        || !room_length || !num_of_baths || !adult_guests
        || !child_guests || !category_ar || !category_en
        || !bed_type_ar || !bed_type_en
    ) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }


    const room = await Room.findByPk(room_id);

    if (!room) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    await room.update({
        room_no,
        type,
        capacity,
        room_length,
        num_of_baths,
        adult_guests,
        child_guests,
        category: { ar: category_ar, en: category_en },
        bed_type: { ar: bed_type_ar, en: bed_type_en },
    });

    res.status(200).json({ message: getMessage("updatedRoom", lang), room: room });

}

export const addRoomImage = async (req, res) => {
    const lang = getLanguage(req);

    const room_id = req.params.id;

    if (!req.file) {
        return res.status(400).json({ message: getMessage("missingImage", lang) });
    }

    const roomImage = await RoomImage.create({
        room_id,
        image_name_url: req.file.path,
        main: false,
    });

    res.status(201).json({ message: getMessage("addedImage", lang), roomImage: roomImage });
}

export const updateMainImage = async (req, res) => {
    const lang = getLanguage(req);
    const id = req.params.id;

    const roomImage = await RoomImage.findByPk(id);

    if (!roomImage) {
        return res.status(404).json({ message: getMessage("imageNotFound", lang) });
    }

    if (roomImage.image_name_url) {
        await deleteImageFromCloudinary(roomImage.image_name_url);
    }

    await roomImage.update({
        image_name_url: req.file.path,
    });
    res.status(200).json({ message: getMessage("updatedImage", lang) });
}

export const updateRoomPricing = async (req, res) => {
    const lang = getLanguage(req);
    const room_id = req.params.id;
    const { pricing } = req.body;

    if (!pricing) {
        return res.status(400).json({ message: getMessage("missingPricing", lang) });
    }

    await RoomPricing.destroy({
        where: { room_id },
    });

    const roomPricing = await RoomPricing.bulkCreate(pricing.map((priceEntry) => ({
        room_id,
        day_of_week: priceEntry.day,
        price: priceEntry.price,
    })));

    res.status(200).json({ message: getMessage("updatedPricing", lang), roomPricing: roomPricing });
}

export const createSpecialPricing = async (req, res) => {
    const lang = getLanguage(req);
    const { room_id, name_ar, name_en, description_ar, description_en, start_date, end_date, price } = req.body;

    if (!room_id || !name_ar || !name_en || !description_ar || !description_en || !start_date || !end_date || !price) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const name = {
        ar: name_ar,
        en: name_en,
    }
    const description = {
        ar: description_ar,
        en: description_en,
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate > endDate) {
        return res.status(400).json({ message: getMessage("invalidDates", lang) });
    }

    const existingSpecialPrice = await SpecialPricing.findOne({
        where: {
            room_id,
            [Op.or]: [
                { start_date: { [Op.between]: [startDate, endDate] } },
                { end_date: { [Op.between]: [startDate, endDate] } },
                {
                    start_date: { [Op.lte]: startDate },
                    end_date: { [Op.gte]: endDate }
                }
            ]
        }
    });

    if (existingSpecialPrice) {
        return res.status(400).json({ message: getMessage("specialPriceExists", lang) });
    }

    const specialPricing = await SpecialPricing.create({
        room_id,
        name,
        description,
        start_date: startDate,
        end_date: endDate,
        price,
    });

    res.status(201).json({ message: getMessage("addedSpecialPricing", lang), specialPricing: specialPricing });
}

export const getRoomPrices = async (req, res) => {
    const lang = getLanguage(req);
    const id = req.params.id
    const prices = await RoomPricing.findAll({
        where: { room_id: id }
    })
    if (prices.length === 0) {
        return res.status(404).json({ message: getMessage("priceNotFound", lang) });
    }
    res.status(200).json(prices)
}

export const getSpecialPriceForRoom = async (req, res) => {
    const lang = getLanguage(req);
    const id = req.params.id
    const specialPrice = await SpecialPricing.findAll({
        where: { room_id: id }
    })
    if (specialPrice.length === 0) {
        return res.status(200).json({ message: getMessage("specialPriceNotFound", lang) });
    }
    res.status(200).json(specialPrice)
}

export const getSpecialPrice = async (req, res) => {
    const lang = getLanguage(req);

    const specialPrice = await SpecialPricing.findAll({
        include: [{
            model: Room,
            include: [{
                model: RoomImage,
                attributes: ["image_name_url", "main"],
            }, {
                model: RoomPricing,
                attributes: ["day_of_week", "price"],
            }]
        }],
    });
    if (!specialPrice) {
        return res.status(404).json({ message: getMessage("specialPriceNotFound", lang) });
    }

    res.status(200).json(specialPrice);
}

export const updateSpecialPricing = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const { name_ar, name_en, description_ar, description_en, start_date, end_date, price } = req.body;

    if (!id || !name_ar || !name_en || !description_ar || !description_en || !start_date || !end_date || !price) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const name = {
        ar: name_ar,
        en: name_en,
    };
    const description = {
        ar: description_ar,
        en: description_en,
    };

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate > endDate) {
        return res.status(400).json({ message: getMessage("invalidDates", lang) });
    }

    const specialPricing = await SpecialPricing.findByPk(id);
    if (!specialPricing) {
        return res.status(404).json({ message: getMessage("specialPricingNotFound", lang) });
    }

    const sameDate =
        new Date(specialPricing.start_date).getTime() === startDate.getTime() &&
        new Date(specialPricing.end_date).getTime() === endDate.getTime();

    if (!sameDate) {
        const existingSpecialPrice = await SpecialPricing.findOne({
            where: {
                id: { [Op.ne]: id },
                room_id: specialPricing.room_id,
                [Op.or]: [
                    { start_date: { [Op.between]: [startDate, endDate] } },
                    { end_date: { [Op.between]: [startDate, endDate] } },
                    { start_date: { [Op.lte]: startDate }, end_date: { [Op.gte]: endDate } }
                ]
            }
        });

        if (existingSpecialPrice) {
            return res.status(400).json({ message: getMessage("specialPriceExists", lang) });
        }
    }


    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }
    await specialPricing.update({
        name,
        description,
        start_date: startDate,
        end_date: endDate,
        price: parsedPrice,
    });

    res.status(200).json({ message: getMessage("updatedSpecialPricing", lang), specialPricing });
};

export const deleteRoomImage = async (req, res) => {
    const lang = getLanguage(req);
    const image_id = req.params.id;

    const roomImage = await RoomImage.findByPk(image_id);

    if (!roomImage) {
        return res.status(404).json({ message: getMessage("imageNotFound", lang) });
    }
    if (roomImage.main === true) {
        return res.status(400).json({ message: getMessage("cannotDeleteMainImage", lang) });
    }

    if (roomImage.image_name_url) {
        await deleteImageFromCloudinary(roomImage.image_name_url);
    }
    await roomImage.destroy();

    res.status(200).json({ message: getMessage("deletedImage", lang) });
}

export const deleteRoom = async (req, res) => {
    const lang = getLanguage(req);

    const room_id = req.params.id;

    const images = await RoomImage.findAll({ where: { room_id: room_id } });

    for (const image of images) {
        if (image.image_name_url) {
            await deleteImageFromCloudinary(image.image_name_url);
        }
    }

    const room = await Room.findByPk(room_id);

    if (!room) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    room.is_deleted = true;
    await room.save();

    res.status(200).json({ message: getMessage("roomDeleted", lang) });
}

//Rooms Types Functions
export const addRoomType = async (req, res) => {

    const lang = getLanguage(req);
    const { name_ar, name_en, description_ar, description_en } = req.body;
    if (!name_ar || !name_en || !description_ar || !description_en) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }
    const roomType = await RoomType.create({
        name: { ar: name_ar, en: name_en },
        description: { ar: description_ar, en: description_en }
    });
    res.status(201).json({ message: getMessage("addedRoomType", lang), roomType: roomType });
}

export const getRoomTypeForNavbar = async (req, res) => {
    const roomTypes = await RoomType.findAll({
        where: { is_deleted: false },
        attributes: [
            "id",
            "name"
        ],
    });

    res.status(200).json(roomTypes);
}

export const getRoomTypes = async (req, res) => {
    const roomTypes = await RoomType.findAll({
        where: { is_deleted: false },
        include: [
            {
                model: Room,
                attributes: [],
            }
        ],
        attributes: [
            "id",
            "name",
            "description",
            [sequelize.fn("COUNT", sequelize.col("Rooms.id")), "room_count"]
        ],
        group: ["RoomType.id"]
    });

    res.status(200).json(roomTypes);
}

export const getRoomTypeAndRoomsByTypeIdWithoutDate = async (req, res) => {
    const lang = getLanguage(req);
    const typeId = req.params.id;

    const roomType = await RoomType.findOne({
        where: { id: typeId, is_deleted: false },
        include: [
            {
                model: Room,
                where: { type: typeId },
                attributes: [
                    "id",
                    "room_no",
                    "capacity",
                    "adult_guests",
                    "child_guests",
                    "isActive",
                    "bed_type",
                ],
                include: [
                    {
                        model: RoomImage,
                        where: { main: true },
                        required: false,
                        attributes: ["id", "image_name_url"],
                    },
                    {
                        model: RoomPricing,
                        attributes: ["id", "day_of_week", "price"],
                    },
                    {
                        model: SpecialPricing,
                        where: { end_date: { [Op.gt]: new Date() } },
                        required: false,
                        attributes: ["id", "name", "description", "start_date", "end_date", "price"],
                    },
                    {
                        model: Service,
                        through: { attributes: [] },
                        attributes: ["id", "name", "image"],
                    },
                ],
            },
        ],
    });

    if (!roomType) {
        return res.status(404).json({ message: getMessage("roomTypeNotFound", lang) });
    }

    const roomIds = roomType.Rooms.map(room => room.id);

    const ratings = await Rating.findAll({
        where: {
            room_id: roomIds
        },
        attributes: ["room_id", "rating"],
    });

    const ratingData = {};

    ratings.forEach(r => {
        if (!ratingData[r.room_id]) {
            ratingData[r.room_id] = { sum: 0, count: 0 };
        }
        ratingData[r.room_id].sum += r.rating;
        ratingData[r.room_id].count += 1;
    });

    const roomsWithRatings = roomType.Rooms.map(roomModel => {
        const room = roomModel.toJSON();
        const data = ratingData[room.id] || { sum: 0, count: 0 };
        room.averageRating = data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0;
        room.ratingCount = data.count;
        return room;
    });

    const finalData = {
        ...roomType.toJSON(),
        Rooms: roomsWithRatings
    };

    res.status(200).json(finalData);
};

export const getRoomTypeAndRoomsByTypeId = async (req, res) => {
    const lang = getLanguage(req);
    const typeId = req.params.id;

    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
        return res.status(400).json({ message: getMessage("missingDateParams", lang) });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (checkOutDate <= checkInDate) {
        return res.status(400).json({ message: getMessage("invalidDateRange", lang) });
    }

    const roomType = await RoomType.findOne({
        where: { id: typeId, is_deleted: false },
        include: [
            {
                model: Room,
                where: { type: typeId, isActive: true },
                include: [
                    {
                        model: RoomImage,
                        where: { main: true },
                        attributes: ["id", "image_name_url"],
                    },
                    {
                        model: RoomPricing,
                        attributes: ["id", "day_of_week", "price"],
                    },
                    {
                        model: SpecialPricing,
                        where: { end_date: { [Op.gt]: new Date() } },
                        required: false,
                        attributes: ["id", "name", "description", "start_date", "end_date", "price"],
                    },
                    {
                        model: Service,
                        through: { attributes: [] },
                        attributes: ["id", "name", "image"],
                    },
                    {
                        model: Booking,
                        required: false,
                        where: {
                            status: { [Op.not]: ["canceled"] },
                            [Op.or]: [
                                {
                                    check_in_date: {
                                        [Op.between]: [checkInDate, checkOutDate],
                                    },
                                },
                                {
                                    check_out_date: {
                                        [Op.between]: [checkInDate, checkOutDate],
                                    },
                                },
                                {
                                    check_in_date: { [Op.lte]: checkInDate },
                                    check_out_date: { [Op.gte]: checkOutDate },
                                },
                            ],
                        },
                        attributes: ["id", "check_in_date", "check_out_date"],
                    },
                ],
            },
        ],
    });

    if (!roomType) {
        return res.status(404).json({ message: getMessage("roomTypeNotFound", lang) });
    }

    const availableRooms = roomType.Rooms.filter(room => room.Bookings.length === 0);

    const roomIds = availableRooms.map(room => room.id);

    const ratings = await Rating.findAll({
        where: {
            room_id: roomIds
        },
        attributes: ["room_id", "rating"],
    });

    const ratingData = {};

    ratings.forEach(r => {
        if (!ratingData[r.room_id]) {
            ratingData[r.room_id] = { sum: 0, count: 0 };
        }
        ratingData[r.room_id].sum += r.rating;
        ratingData[r.room_id].count += 1;
    });

    const roomsWithRatings = availableRooms.map(roomModel => {
        const room = roomModel.toJSON();
        const data = ratingData[room.id] || { sum: 0, count: 0 };
        room.averageRating = data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0;
        room.ratingCount = data.count;
        return room;
    });

    const response = {
        ...roomType.toJSON(),
        Rooms: roomsWithRatings,
    };

    return res.status(200).json(response);
};

export const getAllRoomTypesWithRoomsWithoutDate = async (req, res) => {
    const lang = getLanguage(req);

    const roomTypes = await RoomType.findAll({
        where: { is_deleted: false },
        include: [
            {
                model: Room,
                attributes: ["id", "room_no", "capacity", "adult_guests", "child_guests", "isActive", "bed_type"],
                include: [
                    {
                        model: RoomImage,
                        where: { main: true },
                        required: false,
                        attributes: ["id", "image_name_url"],
                    },
                    {
                        model: RoomPricing,
                        attributes: ["id", "day_of_week", "price"],
                    },
                    {
                        model: SpecialPricing,
                        where: { end_date: { [Op.gt]: new Date() } },
                        required: false,
                        attributes: ["id", "name", "description", "start_date", "end_date", "price"],
                    },
                    {
                        model: Service,
                        through: { attributes: [] },
                        attributes: ["id", "name", "image"],
                    }
                ]
            }
        ]
    });

    const rooms = roomTypes.flatMap(rt => rt.Rooms);

    const roomIds = rooms.map(room => room.id);

    const ratings = await Rating.findAll({
        where: {
            room_id: roomIds
        },
        attributes: ["room_id", "rating"],
    });

    const ratingData = {};

    ratings.forEach(r => {
        if (!ratingData[r.room_id]) {
            ratingData[r.room_id] = { sum: 0, count: 0 };
        }
        ratingData[r.room_id].sum += r.rating;
        ratingData[r.room_id].count += 1;
    });

    const roomTypesWithRatings = roomTypes.map(rt => {
        const roomsWithRatings = rt.Rooms.map(roomModel => {
            const room = roomModel.toJSON();
            const data = ratingData[room.id] || { sum: 0, count: 0 };
            room.averageRating = data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0;
            room.ratingCount = data.count;
            return room;
        });
        return {
            ...rt.toJSON(),
            Rooms: roomsWithRatings,
        };
    });

    res.status(200).json(roomTypesWithRatings);
};

export const getAllRoomTypesWithAvailableRoomsByDate = async (req, res) => {
    const lang = getLanguage(req);
    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
        return res.status(400).json({ message: getMessage("missingDateParams", lang) });
    }

    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (checkOutDate <= checkInDate) {
        return res.status(400).json({ message: getMessage("invalidDateRange", lang) });
    }

    const roomTypes = await RoomType.findAll({
        where: { is_deleted: false },
        include: [
            {
                model: Room,
                where: { isActive: true },
                required: false,
                include: [
                    {
                        model: RoomImage,
                        where: { main: true },
                        required: false,
                        attributes: ["id", "image_name_url"],
                    },
                    {
                        model: RoomPricing,
                        attributes: ["id", "day_of_week", "price"],
                    },
                    {
                        model: SpecialPricing,
                        where: { end_date: { [Op.gt]: new Date() } },
                        required: false,
                        attributes: ["id", "name", "description", "start_date", "end_date", "price"],
                    },
                    {
                        model: Service,
                        through: { attributes: [] },
                        attributes: ["id", "name", "image"],
                    },
                    {
                        model: Booking,
                        required: false,
                        where: {
                            status: { [Op.not]: ["canceled"] },
                            [Op.or]: [
                                {
                                    check_in_date: { [Op.between]: [checkInDate, checkOutDate] },
                                },
                                {
                                    check_out_date: { [Op.between]: [checkInDate, checkOutDate] },
                                },
                                {
                                    check_in_date: { [Op.lte]: checkInDate },
                                    check_out_date: { [Op.gte]: checkOutDate },
                                },
                            ],
                        },
                        attributes: ["id", "check_in_date", "check_out_date"],
                    },
                ],
            },
        ],
    });

    const rooms = roomTypes.flatMap(rt => rt.Rooms);
    const roomIds = rooms.map(room => room.id);

    const ratings = await Rating.findAll({
        where: {
            room_id: roomIds
        },
        attributes: ["room_id", "rating"],
    });

    const ratingData = {};

    ratings.forEach(r => {
        if (!ratingData[r.room_id]) {
            ratingData[r.room_id] = { sum: 0, count: 0 };
        }
        ratingData[r.room_id].sum += r.rating;
        ratingData[r.room_id].count += 1;
    });

    const response = roomTypes.map(rt => {
        const availableRooms = rt.Rooms
            .filter(room => room.Bookings.length === 0)
            .map(roomModel => {
                const room = roomModel.toJSON();
                const data = ratingData[room.id] || { sum: 0, count: 0 };
                room.averageRating = data.count > 0 ? parseFloat((data.sum / data.count).toFixed(1)) : 0;
                room.ratingCount = data.count;
                return room;
            });

        return {
            ...rt.toJSON(),
            Rooms: availableRooms,
        };
    });

    return res.status(200).json(response);
}

export const getRoomTypeById = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const roomType = await RoomType.findOne({ where: { id: id, is_deleted: false } });
    if (!roomType) {
        return res.status(404).json({ message: getMessage("roomTypeNotFound", lang) });
    }
    res.status(200).json(roomType);
}

export const updateRoomType = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const { name_ar, name_en, description_ar, description_en } = req.body;
    if (!id || !name_ar || !name_en || !description_ar || !description_en) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }
    const roomType = await RoomType.findByPk(id);
    if (!roomType) {
        return res.status(404).json({ message: getMessage("roomTypeNotFound", lang) });
    }
    await roomType.update({
        name: { ar: name_ar, en: name_en },
        description: { ar: description_ar, en: description_en }
    });
    res.status(200).json({ message: getMessage("updatedRoomType", lang), roomType: roomType });
}

export const deleteRoomType = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const roomType = await RoomType.findByPk(id);
    if (!roomType) {
        return res.status(404).json({ message: getMessage("roomTypeNotFound", lang) });
    }
    roomType.is_deleted = true;
    await roomType.save();
    res.status(200).json({ message: getMessage("roomTypeDeleted", lang) });
}

export const getRoomTypeImage = async (req, res) => {
    const lang = getLanguage(req);
    const typeId = req.params.id;

    const roomTypeExists = await RoomType.findByPk(typeId);
    if (!roomTypeExists) {
        return res.status(404).json({ message: getMessage("roomTypeNotFound", lang) });
    }

    const roomsWithImages = await Room.findAll({
        where: { type: typeId },
        include: [
            {
                model: RoomImage,
                where: { main: true },
                attributes: ["id", "image_name_url"],
            },
        ],
        attributes: ["id"],
    });

    if (!roomsWithImages.length) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    res.status(200).json(roomsWithImages);
};

export const getRoomsImage = async (req, res) => {
    const lang = getLanguage(req);

    const roomsWithImages = await Room.findAll({
        where: { is_deleted: false },
        include: [
            {
                model: RoomImage,
                where: { main: true },
                attributes: ["id", "image_name_url"],
                required: false,
            },
        ],
        attributes: ["id"],
    });

    if (!roomsWithImages.length) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    res.status(200).json(roomsWithImages);
};