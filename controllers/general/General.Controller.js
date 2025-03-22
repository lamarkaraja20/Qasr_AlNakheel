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
    try {
        // بيانات العملاء
        const allCustomers = await Customer.count();
        const verifiedCustomers = await Customer.count({ where: { is_verified: true } });

        // بيانات الحجوزات
        const unpaidBookings = await Booking.count({ where: { payed: false } });
        const confirmedBookings = await Booking.count({ where: { status: 'confirmed' } });
        const canceledBookings = await Booking.count({ where: { status: 'canceled' } });

        // بيانات الرسائل
        const unreadMessages = await Contact.count({ where: { status: 'unread' } });

        // بيانات المدفوعات
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

        // بيانات الغرف
        const occupiedRooms = await Booking.findAll({
            attributes: [[sequelize.fn('DISTINCT', sequelize.col('room_id')), 'room_id']],
            where: {
                status: 'confirmed',
                [Op.and]: [
                    { check_in_date: { [Op.lte]: new Date() } }, // تاريخ الوصول أقل من أو يساوي اليوم
                    { check_out_date: { [Op.gte]: new Date() } }  // تاريخ المغادرة أكبر من أو يساوي اليوم
                ]
            },
            raw: true
        });

        const occupiedRoomIds = occupiedRooms.map(room => room.room_id);
        const occupiedRoomsCount = occupiedRoomIds.length;

        const totalRooms = await Room.count();
        const availableRoomsCount = totalRooms - occupiedRoomsCount;

        // Pool data
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

        // Restaurant data
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

        // Hall data
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

        // Rating data
        const averageRoomRating = await Rating.findOne({
            attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']],
            where: { room_id: { [Op.not]: null } }
        });
        const avgRating = parseFloat(averageRoomRating.dataValues.avgRating).toFixed(2);
        // بيانات الموظفين
        const activeEmployees = await Employee.count({ where: { status: 'Active' } });
        const inactiveEmployees = await Employee.count({ where: { status: 'Inactive' } });

        // تنظيم البيانات للعرض
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};