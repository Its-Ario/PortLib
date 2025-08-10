import { Router } from 'express';
import { find } from '../Models/User';

const router = Router();

router.get('/users', async (req, res) => {
    const users = await find();
    res.json(users);
});

export default router;