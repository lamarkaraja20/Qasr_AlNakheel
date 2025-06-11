const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyAnyoneHasAccount = (req, res, next) => {
    const accessToken = req.cookies.QasrAlNakheel;

    if (!accessToken) {
        return res.status(403).json({ message: 'You must be logged in.' });
    }

    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired access token.' });
        }

        if (["user", "admin", "reception", "employee"].includes(decoded.role)) {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied: insufficient role permissions.' });
        }
    });
}

const verifyTokenAdmin = (req, res, next) => {
    const accessToken = req.cookies.QasrAlNakheel;
    if (!accessToken) {
        return res.status(403).json({ message: 'You must be logged in.' });
    }

    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired access token.' });
        }

        req.userId = decoded.id;
        if (decoded.role === "admin") {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied: admin role required.' });
        }
    });
};

const verifyTokenAdminOrReceptionist = (req, res, next) => {
    const accessToken = req.cookies.QasrAlNakheel;
    if (!accessToken) {
        return res.status(403).json({ message: 'You must be logged in.' });
    }

    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired access token.' });
        }

        req.userId = decoded.id;
        if (["admin", "reception"].includes(decoded.role)) {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied: admin or receptionist role required.' });
        }
    });
};

const verifyTokenUserLoggedIn = (req, res, next) => {
    const accessToken = req.cookies.QasrAlNakheel;

    if (!accessToken) {
        return res.status(403).json({ message: 'You must be logged in.' });
    }


    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired access token.' });
        }

        if (decoded.role !== "user") {
            return res.status(403).json({ message: 'Access denied: user role required.' });
        }

        if (decoded.banned === true) {
            return res.status(403).json({ message: 'Your account is banned.' });
        }

        if (req.params.id !== decoded.id) {
            return res.status(403).json({ message: 'Access denied: you can only access your own data.' });
        }

        next();
    });
}

const verifyTokenUserVerified = (req, res, next) => {
    const accessToken = req.cookies.QasrAlNakheel;

    if (!accessToken) {
        return res.status(403).json({ message: 'You must be logged in.' });
    }

    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired access token.' });
        }

        if (decoded.role !== "user") {
            return res.status(403).json({ message: 'Access denied: user role required.' });
        }

        if (decoded.banned === true) {
            return res.status(403).json({ message: 'Your account is banned.' });
        }

        if (decoded.is_verified !== true) {
            return res.status(403).json({ message: 'Your account is not verified.' });
        }

        if (req.params.id !== decoded.id) {
            return res.status(403).json({ message: 'Access denied: you can only access your own data.' });
        }

        next();
    });
}

module.exports = {
    verifyTokenAdminOrReceptionist,
    verifyAnyoneHasAccount,
    verifyTokenAdmin,
    verifyTokenUserVerified,
    verifyTokenUserLoggedIn
};