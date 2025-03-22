import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);

const bcrypt = require('bcryptjs');
const { getMessage } = require('../language/messages');

const Employee = require('../../models/Employee.model')
const EmployeeMobile = require('../../models/EmployeeMobile.model')
const Hall = require("../../models/Hall.model");
const Restaurant = require("../../models/Restaurant.model");
const Pool = require("../../models/Pool.model");

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const addEmployee = async (req, res) => {
    const lang = getLanguage(req);
    const { name, email, address, jop_description, hire_date, salary, shift, status, role, hall_id, rest_id, pool_id, mobileNo } = req.body;

    const employee = await Employee.findOne({ where: { email } });
    if (employee) return res.status(400).json({ message: getMessage("emailExists", lang) });

    const password = await bcrypt.hash(req.body.password, 10);

    const newEmployee = await Employee.create({ name, email, password, address, jop_description, hire_date, salary, shift, status, role, hall_id, rest_id, pool_id, mobileNo });

    if (Array.isArray(mobileNo) && mobileNo.length > 0) {
        const mobileRecords = mobileNo.map(number => ({
            emp_id: newEmployee.id,
            mobile_no: number
        }));

        await EmployeeMobile.bulkCreate(mobileRecords);
    }

    res.status(201).json({ message: getMessage("employeeAdded", lang), newEmployee });
}



export const getAllEmployees = async (req, res) => {
    const employees = await Employee.findAll({
        attributes: ['id', 'name', 'email', 'address', 'jop_description', 'hire_date', 'salary', 'shift', 'status', 'role', 'hall_id', 'rest_id', 'pool_id'],
        include: {
            model: EmployeeMobile,
            attributes: ['mobile_no'],
        },
    });
    res.status(200).json(employees);
}



export const getEmployeeById = async (req, res) => {
    const lang = getLanguage(req);
    const employee_id = req.params.id;

    const employee = await Employee.findOne({
        where: { id: employee_id },
        attributes: ['id', 'name', 'email', 'address', 'jop_description', 'hire_date', 'salary', 'shift', 'status', 'role', 'hall_id', 'rest_id', 'pool_id'],
        include: [
            {
                model: EmployeeMobile,
                attributes: ['mobile_no'],
            },
            {
                model: Hall,
                attributes: ['name', 'description'],
                required: false,
            },
            {
                model: Restaurant,
                attributes: ['name', 'capacity'],
                required: false,
            },
            {
                model: Pool,
                attributes: ['size', 'depth'],
                required: false,
            }
        ],
    });
    if (!employee) {
        return res.status(404).json({ message: getMessage("employeeNotFound", lang) });
    }
    res.status(200).json(employee);
}



export const getEmployeeFilter = async (req, res) => {
    const lang = getLanguage(req);
    const { address, jop, hire_date, salary, shift, status, role } = req.query;

    const page = parseInt(req.params.page) || 1;
    const limit = parseInt(req.params.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {};

    if (address) filter.address = { [Op.like]: `%${address}%` };
    if (jop) filter.jop_description = { [Op.like]: `%${jop}%` };
    if (hire_date) filter.hire_date = new Date(hire_date);
    if (salary) filter.salary = { [Op.gte]: parseFloat(salary) };
    if (shift) filter.shift = shift;
    if (status) filter.status = status;
    if (role) filter.role = { [Op.like]: `%${role}%` };

    const totalCount = await Employee.count({ where: filter });


    const employees = await Employee.findAll({
        where: filter,
        attributes: [
            'id', 'name', 'email', 'address', 'jop_description', 'hire_date',
            'salary', 'shift', 'status', 'role', 'hall_id', 'rest_id', 'pool_id'
        ],
        include: [
            {
                model: EmployeeMobile,
                attributes: ['mobile_no'],
            },
            {
                model: Hall,
                attributes: ['name', 'description'],
                required: false,
            },
            {
                model: Restaurant,
                attributes: ['name', 'capacity'],
                required: false,
            },
            {
                model: Pool,
                attributes: ['size', 'depth'],
                required: false,
            }
        ],
        limit,
        offset: skip,
    });

    if (!employees) {
        return res.status(404).json({ message: getMessage("employeeNotFound", lang) });
    }

    res.status(200).json({ employees: employees, totalCount: totalCount, totalPages: Math.ceil(totalCount / limit) });
};



export const changePassword = async (req, res) => {
    const lang = getLanguage(req);
    const employee_id = req.params.id;
    const { currentPassword, newPassword } = req.body;

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
        return res.status(404).json({ message: getMessage("employeeNotFound", lang) });
    }

    const isMatch = await bcrypt.compare(currentPassword, employee.password);
    if (!isMatch) {
        return res.status(401).json({ message: getMessage("incorrectPassword", lang) });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await employee.update({ password: hashedPassword });
    res.status(200).json({ message: getMessage("passwordChanged", lang) })
}



export const updateEmployee = async (req, res) => {
    const lang = getLanguage(req);
    const employee_id = req.params.id;
    const { name, email, address, salary, hire_date, mobileNo } = req.body;

    const transaction = await Employee.sequelize.transaction();

    const employee = await Employee.findByPk(employee_id, { transaction });
    if (!employee) {
        return res.status(404).json({ message: getMessage("employeeNotFound", lang) });
    }

    if (email && email !== employee.email) {
        const existingEmployee = await Employee.findOne({ where: { email }, transaction });
        if (existingEmployee) {
            return res.status(400).json({ message: getMessage("emailExists", lang) });
        }
    }

    await employee.update(
        {
            name: name ?? employee.name,
            email: email ?? employee.email,
            address: address ?? employee.address,
            salary: salary ?? employee.salary,
            hire_date: hire_date ?? employee.hire_date,
        },
        { transaction }
    );

    if (Array.isArray(mobileNo)) {
        await EmployeeMobile.destroy({ where: { emp_id: employee_id }, transaction });

        const mobileRecords = mobileNo.map(number => ({
            emp_id: employee_id,
            mobile_no: number
        }));
        await EmployeeMobile.bulkCreate(mobileRecords, { transaction });
    }

    await transaction.commit();
    res.status(200).json({ message: getMessage("employeeUpdated", lang), employee });
}



export const changeEmployeeShift = async (req, res) => {
    const lang = getLanguage(req);
    const employee_id = req.params.id;
    const { shift } = req.body;
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
        return res.status(404).json({ message: getMessage("employeeNotFound", lang) });
    }
    if (!shift) {
        return res.status(400).json({ message: getMessage("shiftRequired", lang) });
    }

    await employee.update({ shift });
    res.status(200).json({ message: getMessage("shiftUpdated", lang), employee });
}



export const changeEmployeeStatus = async (req, res) => {
    const lang = getLanguage(req);
    const employee_id = req.params.id;
    const { status } = req.body;

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
        return res.status(404).json({ message: getMessage("employeeNotFound", lang) });
    }

    if (!status) {
        return res.status(400).json({ message: getMessage("statusRequired", lang) });
    }

    await employee.update({ status });
    res.status(200).json({ message: getMessage("statusUpdated", lang), employee });
}



export const changeEmployeeJop = async (req, res) => {
    const lang = getLanguage(req);
    const employee_id = req.params.id;

    const { jop_description, hall_id, rest_id, pool_id, role } = req.body;

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
        return res.status(404).json({ message: getMessage("employeeNotFound", lang) });
    }

    if (role !== "Admin") {
        if (!jop_description) {
            return res.status(400).json({ message: getMessage("jobRequired", lang) });
        }

        const locations = [hall_id, rest_id, pool_id].filter(id => id !== undefined && id !== null);
        if (locations.length !== 1) {
            return res.status(400).json({ message: getMessage("oneLocationRequired", lang) });
        }
    }

    await employee.update({
        jop_description,
        role,
        hall_id: hall_id || null,
        rest_id: rest_id || null,
        pool_id: pool_id || null
    });
    res.status(200).json({ message: getMessage("jobUpdated", lang), employee });
}



export const deleteEmployee = async (req, res) => {
    const lang = getLanguage(req);
    const employee_id = req.params.id;

    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
        return res.status(404).json({ message: getMessage("employeeNotFound", lang) });
    }

    await Employee.destroy({ where: { id: employee_id } });

    res.status(200).json({ message: getMessage("employeeDeleted", lang) });
}


