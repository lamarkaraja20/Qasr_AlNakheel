const messages = {
    en: {
        emailExists: "Email already exists!",
        employeeAdded: "Employee added successfully.",
        employeeNotFound: "Employee not found!",
        incorrectPassword: "Incorrect current password!",
        passwordChanged: "Password changed successfully.",
        shiftUpdated: "Shift updated successfully.",
        statusUpdated: "Status updated successfully.",
        jobUpdated: "Job position updated successfully.",
        employeeDeleted: "Employee deleted successfully.",
        shiftRequired: "Shift value is required!",
        statusRequired: "Status value is required!",
        jobRequired: "Job description is required!",
        oneLocationRequired: "Only one of hall_id, rest_id, or pool_id should have a value!",
        employeeUpdated: "Employee updated successfully.",
        employeeLogedIn: "Employee logged in successfully.",
        wrongPassword: "Incorrect password!",
        createUserAccount: "User registered successfully.",
        userNotFound: "User not found!",
        login: "User Logged in successfully.",
        notSupported: "Login using this email is not supported.",
        loggedOut: "User logged out successfully.",
        getUser: "User data returned.",
        alreadyVerified: "User is already verified.",
        errorSendEmail: "Error sending email!",
        sendVerificationCode: "Verification code sent to email.",
        verificationError: "Invalid or expired verification code!",
        expiredVerificationError: "Verification code expired, send one more...",
        verifiedSuccessfully: "Account verified successfully.",
        addedService: "Service added successfully.",
        missingFields: "Missing field!",
        noServicesFound: "Services not found!",
        serviceNotFound: "Service not found!",
        deletedService: "Service deleted successfully.",
        updatedService: "Updated service data successfully.",
        addedRoom: "Added room successfully.",
        invalidPricing: "Invalid Pricing Sending!",
        serverError: "Server internal error!",
        roomNotFound: "Room not found!",
        updatedRoom: "Updated room successfully.",
        addedImage: "Added image successfully.",
        imageNotFound: "Image not found!",
        deletedImage: "Deleted image successfully.",
        updatedImage: "Updated image successfully.",
        missingPricing: "Missing send pricing information!",
        updatedPricing: "Updated pricing information successfully.",
        roomDeleted: "Room deleted successfully.",
        addedSpecialPricing: "Added special pricing information.",
        invalidDates: "Invalid dates!",
        specialPriceExists: "Special price exists!",
        specialPriceNotFound: "Special price not found!",
        bookingDone: "The room has been booked successfully.",
        fixedPriceNotFound: "There is no fixed price for the day.",
        roomPriceNotFound: "No room Price found.",
        capacity: "Maximum room capacity is : ",
        roomNotAvailable: "The room is not available at this time.",
        earlierDateBook: "Bookings cannot be made on earlier dates.",
        noBookingsFound: "No bookings found.",
        bookingCanceled: "Booking canceled.",
        deleteBooking: "Booking deleted successfully.",
        messageSent: "Message sent successfully.",
        customerNotFound: "Customer not found!",
        messageNotFound: "Message not found!",
        messageDeleted: "Message deleted successfully.",
        messageMarkedAsRead: "Message marked as read",
        invalidInput: "Invalid input",
        ratingDone: "Rating done successfully.",
        ratingUpdated: "Rating updated successfully",
        addedHall: "Hall added successfully.",
        facilitiesRequired: "Facilities data is required",
        facilitiesAdded: "Facilities added successfully",
        facilityAdded: "Facility added successfully.",
        facilityUpdated: "Facility updated successfully.",
        facilityNotFound: "Facility not found",
        hallNotFound: "Hall not found",
        hallDeleted: "Hall deleted successfully.",
        hallsNotFound: "No halls found",
        updatedHall: "Hall updated successfully",
        facilityDeleted: "Hall facility deleted successfully",
        addedPool: "Added pool successfully.",
        poolNotFound: "Pool not found",
        poolDeleted: "Pool deleted successfully",
        poolsNotFound: "No pools found",
        updatedPool: "Pool updated successfully",
        addedRoomType: "Room type added successfully.",
        roomTypeNotFound: "Room type not found!",
        updatedRoomType: "Room type updated successfully.",
        roomTypeDeleted: "Room type deleted successfully.",
        missingImage: "Missing image",
        cannotDeleteMainImage: "Cannot delete main image",
        addedReservation: "Added reservation successfully",
        invalidStartTime: "Invalid start time",
        reservationNotFound: "Reservation not found",
        cannotCancelLate: "Can not cancel late",
        canceledReservation: "Reservation canceled",
        alreadyCheckedIn: "Already check in",
        alreadyCheckedOut: "Already checked out",
        cannotCheckInCanceled: "Can not check in canceled reservation",
        checkedInSuccessfully: "Checks in successfully.",
        invalidCheckOut: "Invalid check out",
        checkedOut: "Check out successfully",
        checkInTooEarly: "Check in too early",
        invalidEndTime: "Invalid end time",
        hallNotAvailable: "Hall not available",
        hallReservationCreated: "Hall reservation created successfully",
        reservationCancelled: "Reservation cancelled successfully",
        reservationAccepted: "Reservation accepted.",
        reservationDeleted: "Reservation deleted successfully.",
        addedRestaurant: "Restaurant added successfully.",
        restaurantsNotFound: "Restaurants not found",
        updatedRestaurant: "Updated restaurant successfully",
        restaurantDeleted: "Restaurant deleted successfully",
        invalidreservationDate: "Invalid reservation date",
        restaurantFull: "Restaurant full in this time",
        customersNotFound: "Customers not found",
        noUnpaidInvoices: "no Unpaid Invoices",
        paymentSuccess: "Payment success",
        invalidInvoices: "Invalid Invoices",
        invalidData: "Invalid Data",
        noPaidInvoices: "No Paid Invoices",
        invalidAmount: "Invalid Amount",
        invalidInvoiceType: "Invalid Invoice Type",
        invoiceNotFound: "Invoice not found",
        invoiceAlreadyPaid: "Invoice already paid",
        serviceRequired: "Service type is required!",
        invalidServiceType: "Service type is not allowed!",
        noPaymentsFound: "No payments were found",
        mobileExists: "Mobile number is already exists",
        noPasswordSet: "Your account was created using Google or Facebook. Please use the same provider to log in or reset your password.",
    },
    ar: {
        emailExists: "البريد الإلكتروني موجود بالفعل",
        employeeAdded: "تم إضافة الموظف بنجاح",
        employeeNotFound: "الموظف غير موجود",
        incorrectPassword: "كلمة المرور الحالية غير صحيحة",
        passwordChanged: "تم تحديث كلمة المرور بنحاح",
        shiftUpdated: "تم تحديث الوردية بنجاح",
        statusUpdated: "تم تحديث الحالة بنجاح",
        jobUpdated: "تم تحديث الوظيفة بنجاح",
        employeeDeleted: "تم حذف الموظف بنجاح",
        shiftRequired: "يجب إدخال قيمة الوردية",
        statusRequired: "يجب إدخال قيمة الحالة",
        jobRequired: "الوصف الوظيفي مطلوب",
        oneLocationRequired: "يجب تحديد واحد فقط من اماكن العمل",
        employeeUpdated: "تم تحديث الموظف بنجاح",
        employeeLogedIn: "تم تسجيل الدخول بنجاح",
        wrongPassword: "كلمة المرور غير صحيحة",
        createUserAccount: "تم تسجيل المستخدم بنجاح",
        userNotFound: "المستخدم غير موجود",
        notSupported: "لا يتم دعم تسجيل الدخول باستخدام هذا البريد الإلكتروني.",
        loggedOut: "تم تسجيل الخروج بنجاح",
        getUser: "ارجاع بيانات المستخدم",
        alreadyVerified: "تم التحقق من هذا المستخدم مسبقاً",
        errorSendEmail: "فشل ارسال الايميل",
        sendVerificationCode: "تم ارسال كود التحقق إلى الإيميل",
        verificationError: "كود التحقق غير صحيح أو انتهى وقته",
        expiredVerificationError: "انتهت صلاحية كود التحقق ارسل واحد آخر",
        verifiedSuccessfully: "تم التحقق من الحساب بنجاح",
        addedService: "تم اضافة الخدمة بنجاح",
        missingFields: "كل القيم مطلوبة",
        noServicesFound: "لم يتم ايجاد الخدمات",
        serviceNotFound: "لم يتم ايجاد هذه الخدمة",
        deletedService: "تم حذف الخدمة بنجاح",
        updatedService: "تم تحديث بيانات الخدمة بنجاح",
        addedRoom: "تم اضافة غرفة بنجاح",
        invalidPricing: "إرسال تسعير غير صالح",
        serverError: "خطأ داخلي من السيرفر",
        roomNotFound: "لم يتم ايجيد الغرفة",
        updatedRoom: "تم تحديث بيانات الغرفة بنجاح",
        addedImage: "تم اضافة الصورة بنجاح",
        imageNotFound: "لم يتم ايجاد الصورة",
        deletedImage: "تم حذف الصورة بنجاح",
        updatedImage: "تم تحديث الصورة بنجاح",
        missingPricing: "خطأ في ارسال بيانات التسعير",
        updatedPricing: "تم  تحديث التسعير بنجاح",
        roomDeleted: "تم حذف الغرفة",
        addedSpecialPricing: "تم اضافة السعر الخاص",
        invalidDates: "خطأ في التاريخ",
        specialPriceExists: "هناك سعر خاص مسبق في هذا التاريخ",
        specialPriceNotFound: "لا يوجد عروض خاصة",
        bookingDone: "تم حجز الغرفة بنجاح",
        fixedPriceNotFound: "لا يوجد سعر محدد ليوم ",
        roomPriceNotFound: "لم يتم العثور على أسعار للغرفة",
        capacity: "السعة القصوى للغرفة هي :",
        roomNotAvailable: "الغرفة غير متاحة في هذه الفترة",
        earlierDateBook: "لا يمكن الحجز في تواريخ سابقة",
        noBookingsFound: "لا يوجد حجوزات",
        bookingCanceled: "تم الغاء الحجز ",
        deleteBooking: "تم حذف الحجز بنجاح",
        messageSent: "تم ارسال الرسالة بنجاح",
        customerNotFound: "لم يتم ايجاد هذا العميل",
        messageNotFound: "لم يتم ايجاد هذه الرسالة",
        messageDeleted: "تم حذف الرسالة بنجاح",
        messageMarkedAsRead: "تم تحديث حالة الرسالة الى مقروء",
        invalidInput: "خطأ في البيانات المرسلة",
        ratingDone: "تم التقييم بنجاح",
        ratingUpdated: "تم تغيير التقييم ",
        login: "تم تسجيل الدخول بنجاح",
        addedHall: "تم اضافة القاعة بنجاح",
        facilitiesRequired: "بيانات المرافق مطلوبة",
        facilitiesAdded: "تمت اضافة المرافق بنجاح",
        facilityAdded: "تم اضافة المرفق بنجاح",
        facilityUpdated: "تم تحديث بيانات المرفق",
        facilityNotFound: "لم يتم العثور على المرفق",
        hallNotFound: "لم يتم العثور على القاعة",
        hallDeleted: "تم حذف القاعة بنجاح",
        hallsNotFound: "لا يتم العثور على قاعات",
        updatedHall: "تم تحديث القاعة بنجاح",
        facilityDeleted: "تم حذف مرفق القاعة بنجاح",
        addedPool: "تم اضافة المسبح بنجاح",
        poolNotFound: "لم يتم العثور على المسبح",
        poolsNotFound: "لا يتم العثور على المسابح",
        updatedPool: "تم تحديث المسبح بنجاح",
        poolDeleted: "تم حذف المسبح",
        addedRoomType: "تم اضافة نوع الغرفة بنجاح",
        roomTypeNotFound: "لم يتم العثور على نوع الغرفة",
        updatedRoomType: "تم تحديث بيانات نوع الغرفة",
        roomTypeDeleted: "تم حذف نوع الغرفة",
        missingImage: "لم يتم العثور على الصورة",
        cannotDeleteMainImage: "لا يمكن حذف الصورة الاساسية",
        addedReservation: "تم انشاء الحجز بنجاح",
        invalidStartTime: "وقت الحجز ليس صالح",
        reservationNotFound: "لم يتم العثور على الحجز",
        cannotCancelLate: "لا يمكن الالغاء متأخراً",
        canceledReservation: "تم الغاء الحجز",
        alreadyCheckedIn: "تم تسجيل الدخول مسبقاً",
        alreadyCheckedOut: "تم تسجيل الخروج",
        cannotCheckInCanceled: "لا يمكن تسجيل الدخول في حجز تم الغاءه",
        checkedInSuccessfully: "تم تسجيل الدخول",
        invalidCheckOut: "تسجيل خروج غير صالح",
        checkedOut: "تم تسجيل الخروج بنجاح",
        checkInTooEarly: "لم يحن موعد الحجز",
        invalidEndTime: "وقت انتهاء غير صحيح",
        hallNotAvailable: "القاعة غير متوفرة في هذا الوقت",
        hallReservationCreated: "تم انشاء حجز القاعة بنجاح",
        reservationCancelled: "تم الغاء الحجز بنجاح",
        reservationAccepted: "تم قبول الحجز",
        reservationDeleted: "تم حذف الحجز بنجاح",
        addedRestaurant: "تم اضافة المطعم بنجاح",
        restaurantsNotFound: "لم يعثر على المطاعم",
        updatedRestaurant: "تم تحديث المطعم بنجاح",
        restaurantDeleted: "تم حذف المطعم بنجاح",
        invalidreservationDate: "وقت الحجز غير صالح",
        restaurantFull: "المطعم ممتلئ في هذا الوقت",
        customersNotFound: "لم يتم العثور على الزبائن",
        noUnpaidInvoices: "لا يوجد فواتير غير مدفوعة",
        paymentSuccess: "تم الدفع بنجاح",
        invalidInvoices: "فواتير غير صالحة",
        invalidData: "بيانات غير صحيحة",
        noPaidInvoices: "لا يوجد فواتير مدفوعة",
        invalidAmount: "قيمة السعر غير صحيحة",
        invalidInvoiceType: "خطأ في نوع الفاتورة",
        invoiceNotFound: "لم يتم العثور على الفاتورة",
        invoiceAlreadyPaid: "الفاتورة مدفوعة مسبقاً",
        serviceRequired: "نوع الفاتورة مطلوب!",
        invalidServiceType: "نوع الفاتورة غير صالح!",
        noPaymentsFound: "لم يتم العثور على أي مدفوعات",
        mobileExists: "رقم الهاتف المسجل موجود بالفعل",
        noPasswordSet: "تم إنشاء حسابك باستخدام Google أو Facebook. يرجى استخدام نفس المزود لتسجيل الدخول أو إعادة تعيين كلمة المرور."
    }
};

export function getMessage(key, lang) {
    return messages[lang] && messages[lang][key] ? messages[lang][key] : messages["en"][key];
};