import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);

const sequelize = require("../../config/dbConnection");
const Customer = require("../../models/Customer.model");
const Booking = require("../../models/Booking.model");
const Contact = require("../../models/Contact.model");
const Payment = require("../../models/Payment.model");
const Room = require("../../models/Room.model");
const CustomerPool = require("../../models/CustomerPool.model");
const CustomerRestaurant = require("../../models/CustomerRestaurant.model");
const HallReservation = require("../../models/HallReservation.model");
const Rating = require("../../models/Rating.model");
const Employee = require("../../models/Employee.model");
const Restaurant = require("../../models/Restaurant.model");
const Pool = require("../../models/Pool.model");
const Hall = require("../../models/Hall.model");

export const getDashboardDetails = async (req, res) => {
    const allCustomers = await Customer.count();
    const verifiedCustomers = await Customer.count({ where: { is_verified: true } });

    const unpaidBookings = await Booking.count({ where: { payed: false } });
    const confirmedBookings = await Booking.count({ where: { status: 'confirmed' } });
    const canceledBookings = await Booking.count({ where: { status: 'canceled' } });

    const unreadMessages = await Contact.count({ where: { status: 'unread' } });

    const totalRevenueThisMonth = await Payment.sum('payment_amount', {
        where: {
            payment_date: {
                [Op.between]: [
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
                ]
            }
        }
    });

    const occupiedRooms = await Booking.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('room_id')), 'room_id']],
        where: {
            status: 'confirmed',
            [Op.and]: [
                { check_in_date: { [Op.lte]: new Date() } }, 
                { check_out_date: { [Op.gte]: new Date() } }
            ]
        },
        raw: true
    });

    const occupiedRoomIds = occupiedRooms.map(room => room.room_id);
    const occupiedRoomsCount = occupiedRoomIds.length;

    const totalRooms = await Room.count();
    const availableRoomsCount = totalRooms - occupiedRoomsCount;

    const poolReservationsThisMonth = await CustomerPool.count({
        where: {
            reservation_time: {
                [Op.between]: [
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
                ]
            }
        }
    });

    const restaurantReservationsThisMonth = await CustomerRestaurant.count({
        where: {
            reservation_date: {
                [Op.between]: [
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
                ]
            }
        }
    });

    const hallReservationsThisMonth = await HallReservation.count({
        where: {
            start_time: {
                [Op.between]: [
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
                ]
            }
        }
    });

    const averageRoomRating = await Rating.findOne({
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
        where: { room_id: { [Op.not]: null } }
    });
    const avgRating = parseFloat(averageRoomRating.dataValues.avgRating).toFixed(2);

    const activeEmployees = await Employee.count({ where: { status: 'Active' } });
    const inactiveEmployees = await Employee.count({ where: { status: 'Inactive' } });

    const data = [
        {
            title: { ar: "عدد العملاء", en: "Customer Count" },
            value: allCustomers,
        },
        {
            title: { ar: "العملاء الموثقين", en: "Verified Customers" },
            value: verifiedCustomers
        },
        {
            title: { ar: "الحجوزات غير المدفوعة", en: "Unpaid Bookings" },
            value: unpaidBookings
        },
        {
            title: { ar: "الحجوزات المؤكدة", en: "Confirmed Bookings" },
            value: confirmedBookings
        },
        {
            title: { ar: "الحجوزات الملغاة", en: "Canceled Bookings" },
            value: canceledBookings
        },
        {
            title: { ar: "الرسائل غير المقروءة", en: "Unread Messages" },
            value: unreadMessages
        },
        {
            title: { ar: "إيرادات هذا الشهر", en: "Revenue This Month" },
            value: totalRevenueThisMonth
        },
        {
            title: { ar: "الغرف المتاحة", en: "Available Rooms" },
            value: availableRoomsCount
        },
        {
            title: { ar: "الغرف المشغولة", en: "Occupied Rooms" },
            value: occupiedRoomsCount
        },
        {
            title: { ar: "حجوزات المسابح هذا الشهر", en: "Pool Reservations This Month" },
            value: poolReservationsThisMonth
        },
        {
            title: { ar: "حجوزات المطاعم هذا الشهر", en: "Restaurant Reservations This Month" },
            value: restaurantReservationsThisMonth
        },
        {
            title: { ar: "حجوزات القاعات هذا الشهر", en: "Hall Reservations This Month" },
            value: hallReservationsThisMonth
        },
        {
            title: { ar: "متوسط تقييم الغرف", en: "Average Room Rating" },
            value: avgRating
        },
        {
            title: { ar: "الموظفون النشطون", en: "Active Employees" },
            value: activeEmployees
        },
        {
            title: { ar: "الموظفون غير النشطين", en: "Inactive Employees" },
            value: inactiveEmployees
        }
    ];

    res.status(200).json(data);
};

export const getAboutStatistics = async (req, res) => {
    const allCustomers = await Customer.count();
    const Bookings = await Booking.count();
    const restaurantReservations = await CustomerRestaurant.count();
    const hallReservations = await HallReservation.count();
    const poolReservations = await CustomerPool.count();

    const data = [
        {
            title: { ar: "حسابات الزبائن", en: "Customer Accounts" },
            value: allCustomers
        },
        {
            title: { ar: "حجوزات الغرف", en: "Room Bookings" },
            value: Bookings
        },
        {
            title: { ar: "زيارات المطعم", en: "Restaurant Visits" },
            value: restaurantReservations
        },
        {
            title: { ar: "حجوزات القاعات", en: "Hall Reservations" },
            value: hallReservations
        },
        {
            title: { ar: "حجوزات المسبح", en: "Pool Reservations" },
            value: poolReservations
        }
    ];

    res.status(200).json(data);
}


export const getSomeDataForUser = async (req, res) => {
    const id = req.params.id;

    const Bookings = await Booking.count({ where: { cust_id: id } });
    const restaurantReservations = await CustomerRestaurant.count({ where: { cust_id: id } });
    const hallReservations = await HallReservation.count({ where: { cust_id: id } });
    const poolReservations = await CustomerPool.count({ where: { customer_id: id } });

    const data = [
        {
            title: { ar: "حجوزات الغرف", en: "Room Bookings" },
            value: Bookings
        },
        {
            title: { ar: "زيارات المطعم", en: "Restaurant Visits" },
            value: restaurantReservations
        },
        {
            title: { ar: "حجوزات القاعات", en: "Hall Reservations" },
            value: hallReservations
        },
        {
            title: { ar: "حجوزات المسبح", en: "Pool Reservations" },
            value: poolReservations
        }
    ];

    res.status(200).json(data);
}



export const getAllworkPlaces = async (req, res) => {
    const [pools, restaurants, halls] = await Promise.all([
        Pool.findAll({
            where: { is_deleted: false },
            attributes: ['id', 'name']
        }),
        Restaurant.findAll({
            where: { is_deleted: false },
            attributes: ['id', 'name']
        }),
        Hall.findAll({
            where: { is_deleted: false },
            attributes: ['id', 'name']
        })
    ]);

    res.status(200).json({
        success: true,
        data: {
            pools,
            restaurants,
            halls
        }
    });
}