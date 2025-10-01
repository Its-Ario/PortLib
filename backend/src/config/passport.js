import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

import { config } from 'dotenv';
config({ path: '../.env' });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                user.googleId = profile.id;
            } else {
                user = new User({
                    name: profile.displayName,
                    username: profile.emails[0].value,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                });
            }
            await user.save();
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

export default passport;