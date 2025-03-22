const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyTokenAdmin = (req, res, next) => {
    const accessToken = req.cookies.QasrAlNakheel;
    if (!accessToken) {
        return res.status(403).json({ message: 'No token provided.' });
    }

    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token.' });
        }

        req.userId = decoded.id;
        if (decoded.role === "admin") {
            next();
        } else {
            return res.status(403).json({ message: 'You do not have the necessary permissions.' });
        }
    });
};

const verifyTokenUserLoggedIn = (req, res, next) => {
    const accessToken = req.cookies.QasrAlNakheel;

    if (!accessToken) {
        return res.status(403).json({ message: 'No token provided.' });
    }


    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token.' });
        }

        if (decoded.role === "user" && req.parmas.id === decoded.id) {
            next();
        } else {
            return res.status(403).json({ message: 'You do not have the necessary permissions.' });
        }
    });
}

const verifyTokenUserVerified = (req, res, next) => {
    const accessToken = req.cookies.QasrAlNakheel;

    if (!accessToken) {
        return res.status(403).json({ message: 'No token provided.' });
    }
    
    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token.' });
        }
        if (decoded.role === "user" && req.params.id === decoded.id && decoded.is_verified === true) {
            
            next();
        } else {
            return res.status(403).json({ message: 'You do not have the necessary permissions.' });
        }
    });
}

module.exports = {
    verifyTokenAdmin,
    verifyTokenUserVerified,
    verifyTokenUserLoggedIn
};