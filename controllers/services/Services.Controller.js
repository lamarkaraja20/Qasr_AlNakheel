import { createRequire } from "module";
import { Op, Sequelize } from "sequelize";
const require = createRequire(import.meta.url);

const Service = require("../../models/Service.model");
const { getMessage } = require("../language/messages");

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const addService = async (req, res) => {
    const lang = getLanguage(req);

    const { name_ar, name_en, description_ar, description_en } = req.body;

    if (!name_ar || !name_en || !description_ar || !description_en) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const name = { ar: name_ar, en: name_en };
    const description = { ar: description_ar, en: description_en };

    const newService = await Service.create({
        name,
        description,
        image: req.file ? req.file.path : null,
    })
    res.status(201).json({ message: getMessage("addedService", lang), service: newService, });
}


export const getAllServices = async (req, res) => {
    const lang = getLanguage(req);

    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;

    const skip = (page - 1) * limit;

    const { search } = req.query;

    const services = await Service.findAndCountAll({
        limit,
        offset: skip,
        where: {
            ...(search && {
                [Op.or]: [
                    Sequelize.where(Sequelize.json('name.ar'), {
                        [Op.iLike]: `%${search}%`
                    }),
                    Sequelize.where(Sequelize.json('name.en'), {
                        [Op.iLike]: `%${search}%`
                    }),
                    Sequelize.where(Sequelize.json('description.ar'), {
                        [Op.iLike]: `%${search}%`
                    }),
                    Sequelize.where(Sequelize.json('description.en'), {
                        [Op.iLike]: `%${search}%`
                    }),
                ],
            }),
        }
    });

    if (!services.rows.length) {
        return res.status(200).json({ message: getMessage("noServicesFound", lang) });
    }
    res.status(200).json(services);
}

export const updateService = async (req, res) => {
    const lang = getLanguage(req);

    const service_id = req.params.id;
    const { name_ar, name_en, description_ar, description_en } = req.body;

    const service = await Service.findByPk(service_id);

    if (!service) {
        return res.status(404).json({ message: getMessage("serviceNotFound", lang) });
    }

    if (!name_ar || !name_en || !description_ar || !description_en) {
        return res.status(400).json({ message: getMessage("missingFields", lang) });
    }

    const name = { ar: name_ar, en: name_en };
    const description = { ar: description_ar, en: description_en };

    await service.update({
        name,
        description,
        image: req.file ? req.file.path : service.image,
    });

    res.status(200).json({ message: getMessage("updatedService", lang), service });
}

export const deleteService = async (req, res) => {
    const lang = getLanguage(req);

    const service_id = req.params.id;

    const service = await Service.findByPk(service_id);

    if (!service) {
        return res.status(404).json({ message: getMessage("serviceNotFound", lang) });
    }

    await service.destroy();

    res.status(200).json({ message: getMessage("deletedService", lang) });
}


export const getServiceById = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const service = await Service.findByPk(id);
    if (!service) {
        return res.status(200).json({ message: getMessage("serviceNotFound", lang) });
    }
    res.status(200).json(service);
}