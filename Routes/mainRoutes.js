import { Router } from 'express';
import User from '../Models/User.js';

const router = Router();

router.get('/users', async (req, res) => {
    const users = await User.find();
    res.json(users);
});

export default router;
