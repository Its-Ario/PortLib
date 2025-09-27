import { Router } from 'express';
import auth from '../middleware/authMiddleware.js';
import passport from 'passport';

import {
    login,
    register,
    changepassword,
    logout
} from '../controllers/authController.js';

const router = Router();

router.get('/verify-token', auth, async (req, res) => {
    const userData = {
        id: req.user._id.toString(),
        name: req.user.name,
    };

    res.status(200).json({ ok: true, user: userData });
});

router.post('/login', login);

router.post('/register', register);

router.patch('/changepassword', auth, changepassword);

router.post('/logout', auth, logout);

router.get('/login/federated/google', passport.authenticate('google', {session: false}));

router.get('/oauth2/redirect/google', passport.authenticate('google', { failureRedirect: '/', session: false }),
  async (req, res) => {
    const googleUser = req.user;
    // const token = generateToken();

    res.json({ ok: true, name: googleUser.displayName });
});

export default router;
