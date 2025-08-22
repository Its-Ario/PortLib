import { Router } from 'express';
import { compare, hash } from 'bcrypt';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import auth from '../middleware/authMiddleware.js';
import userService from '../services/userService.js';
import logger from '../logger.js';

const router = Router();

function generateToken(user) {
    return sign({ id: user._id, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
}

router.get('/verify-token', auth, async (req, res) => {
    res.status(200).json({ ok: true, user: req.user });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await userService.getUserProfileBy('username', username);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);

        const userData = {
            id: user._id.toString(),
            name: user.name,
        };

        res.json({ token, user: userData });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { name, email, username, password } = req.body;
        const hashedPassword = await hash(password, 10);

        const newUser = await userService.registerUser({
            name,
            email,
            username,
            passwordHash: hashedPassword,
            role: 'MEMBER',
        });

        res.status(201).json(newUser);
    } catch (error) {
        logger.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.patch('/changepassword', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(403).json({ error: 'Current password incorrect' });

    user.passwordHash = await hash(newPassword, 10);
    user.tokenVersion += 1;
    await userService.updateTokenVersion(user._id.toString());

    res.json({ message: 'Password updated successfully' });
});

router.post('/logout', auth, async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.tokenVersion += 1;
        await userService.updateTokenVersion(user._id.toString());

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
