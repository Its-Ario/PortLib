import { Router } from 'express';
import userService from '../Services/userService';
const router = Router();

router.get('/users', async (req, res) => {
    const users = await userService.getAllUsers();
    res.json(users);
});

export default router;
