import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);

const fs = require("fs");
import { fileURLToPath } from "url";
const sequelize = require("../../config/dbConnection");

const path = require("path");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Sequelize = require("../../config/dbConnection");
const Room = require("../../models/Room.model");
const RoomImage = require("../../models/RoomImage.model");
const RoomPricing = require("../../models/RoomPricing.model");
const Booking = require("../../models/Booking.model");
const Service = require("../../models/Service.model");
const RoomService = require("../../models/RoomService.model");
const SpecialPricing = require("../../models/SpecialPricing.model");
const RoomType = require("../../models/RoomType.model");
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
            image_name_url: req.files.mainImage && req.files.mainImage[0] ? req.files.mainImage[0].filename : null,
            main: true,
        }, { transaction: t });

        if (req.files.additionalImages) {
            const additionalImages = req.files.additionalImages.map((file) => ({
                room_id: newRoom.id,
                image_name_url: file.filename,
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

export const getAllRooms = async (req, res) => {

    const lang = getLanguage(req);

    const { page = 1, limit = 10, capacity, type } = req.query;

    const where = {};

    if (capacity) {
        const parsedCapacity = parseInt(capacity, 10);
        if (!isNaN(parsedCapacity)) where.capacity = parsedCapacity;
    }
    if (type) where.type = type;

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

    if (!rooms) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    const today = new Date();
    for (const room of rooms) {
        const isBooked = await Booking.findOne({
            where: {
                room_id: room.id,
                check_in_date: { [Op.lte]: today },
                check_out_date: { [Op.gt]: today },
                status: "confirmed",
            },
        });
        room.setDataValue("isBooked", !!isBooked);
    }

    res.status(200).json({ rooms: rooms, totalCount: totalCount, totalPages: Math.ceil(totalCount / limit) })
}


export const getRoomById = async (req, res) => {
    const lang = getLanguage(req);
    const room_id = req.params.id;

    const room = await Room.findByPk(room_id, {
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
    room.setDataValue("isBooked", !!isBooked);

    res.status(200).json({ room: room });
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
        image_name_url: req.file.filename,
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

    const imagePath = path.join(__dirname, "../../uploads/roomImages", roomImage.image_name_url);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    await roomImage.update({
        image_name_url: req.file.filename,
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

    const existingSpecialPrice = await SpecialPricing.findOne({
        where: {
            id: { [Op.ne]: id },
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

    await specialPricing.update({
        name,
        description,
        start_date: startDate,
        end_date: endDate,
        price,
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

    const imagePath = path.join(__dirname, "../../uploads/roomImages", roomImage.image_name_url);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    await roomImage.destroy();

    res.status(200).json({ message: getMessage("deletedImage", lang) });
}


export const deleteRoom = async (req, res) => {
    const lang = getLanguage(req);

    const room_id = req.params.id;

    const images = await RoomImage.findAll({ where: { room_id: room_id } });

    images.forEach((image) => {
        const imagePath = path.join(__dirname, "../../uploads/roomImages", image.image_name_url);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    });

    const room = await Room.findByPk(room_id);

    if (!room) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }

    await room.destroy();

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

export const getRoomTypes = async (req, res) => {
    const roomTypes = await RoomType.findAll({
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

export const getRoomTypeById = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const roomType = await RoomType.findByPk(id);
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
    await roomType.destroy();
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