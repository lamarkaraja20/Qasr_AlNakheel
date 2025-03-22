require("dotenv").config();
const passport = require("passport");
const { Strategy: FacebookStrategy } = require("passport-facebook");
const express = require("express");
const jwt = require("jsonwebtoken");
const Customer = require("../../models/Customer.model");

const router = express.Router();

const callbackURL = process.env.NODE_ENV === "production"
    ? "https://qasr-alnakheel.onrender.com/auth/facebook/callback"
    : "http://localhost:3000/auth/facebook/callback";
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL,
    //callbackURL: "/auth/facebook/callback",
    profileFields: ["id", "emails", "name", "picture.type(large)"],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const facebook_id = profile.id;
        if (!facebook_id) {
            return done(null, false, { message: "Facebook ID not found in profile" });
        }

        let user = await Customer.findOne({ where: { facebook_id } });
        if (!user) {
            user = await Customer.create({
                facebook_id: profile.id,
                first_name: profile.name.givenName || "",
                last_name: profile.name.familyName || "",
                profile_picture: profile.photos?.[0]?.value || null,
                is_verified: true,
                auth_provider: "facebook",
            });
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Customer.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

router.get("/facebook/callback", passport.authenticate("facebook", { failureRedirect: `${process.env.FRONTEND_URL}/login` }), async (req, res) => {
    if (!req.user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login` || "http://localhost:5173/login");
    }

    const accessToken = jwt.sign(
        { id: req.user.id, role: "user", is_verified: req.user.is_verified },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("QasrAlNakheel", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
});

/*
router.get("/facebook/logout", (req, res) => {
    res.clearCookie("QasrAlNakheel");
    req.logout(() => {
        req.session.destroy(() => {
            res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
        });
    });
});
*/
module.exports = router;
