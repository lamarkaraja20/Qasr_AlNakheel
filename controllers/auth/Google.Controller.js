require("dotenv").config();
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const express = require("express");
const jwt = require("jsonwebtoken");
const Customer = require("../../models/Customer.model");

const router = express.Router();

const callbackURL = process.env.NODE_ENV === "production"
    ? "https://qasr-alnakheel.onrender.com/auth/google/callback"
    : "http://localhost:3000/auth/google/callback";
    
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    //callbackURL: "/auth/google/callback",
    callbackURL,
    scope: ["profile", "email"],
    passReqToCallback: true
}, async (request, accessToken, refreshToken, profile, done) => {
    try {
        const google_id = profile.id;
        const email = profile.emails[0].value;
        if (!google_id) {
            return done(null, false, { message: "Google ID not found in profile" });
        }

        let user = await Customer.findOne({ where: { google_id } });
        let userByEmail = await Customer.findOne({ where: { email } });

        if (!user && userByEmail) {
            return done(null, false, { message: "This email is already registered." });
        } else if (!user) {
            user = await Customer.create({
                google_id: profile.id,
                first_name: profile.name.givenName,
                last_name: profile.name.familyName,
                email: profile.emails[0].value,
                profile_picture: profile.photos?.[0]?.value || null,
                is_verified: true,
                auth_provider: 'google',
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

/*
Call this API "/google/callback"  
The request will be handled by the `passport` configuration above,  
where the user's profile data will be retrieved from Google and returned with the user data.  

In the `callback` API, the system will check if the user exists in the database:  
- If the user exists, a new `accessToken` will be generated.  
- The `accessToken` will be sent to the browser via cookies, and the user will be redirected to the homepage on the frontend.

*/

router.get("/google/callback", passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/login` }), async (req, res) => {
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
router.get("/google/logout", (req, res) => {
    res.clearCookie("QasrAlNakheel");
    req.logout(() => {
        req.session.destroy(() => {
            res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
        });
    });
});
*/
module.exports = router;
