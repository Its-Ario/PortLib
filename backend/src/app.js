import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './logger.js';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from 'dotenv';

config({
    path: '../.env',
});

import mainRoutes from './routes/mainRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(json());
app.use(passport.initialize());

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/api/oauth2/redirect/google',
  scope: [ 'profile' ]
}, function (accessToken, refreshToken, profile, cb) {
  return cb(null, profile);
}));

app.use(
    morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    })
);

app.use(express.static('public'));

app.use('/api', mainRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/book', bookRoutes);
app.use('/api/transaction', transactionRoutes);

export default app;
