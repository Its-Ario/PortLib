import { Router } from 'express';
import { hash } from 'bcrypt';
import userService from '../services/userService.js';
import auth, { isAdmin } from '../middleware/authMiddleware.js';

const router = Router();
router.use(auth, isAdmin);

router.get('/', (req, res) => {
    res.status(200).json('Hi, Admin');
});

router.post('/adduser', async (req, res) => {
    const { password, ...rest } = req.body;
    const hashedPassword = await hash(password, 10);
    const newUser = new userService.registerUser({
        ...rest,
        passwordHash: hashedPassword,
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
});

router.patch('/changerole/:id', async (req, res) => {
    const user = await userService.getUserProfile(req.params.id);
    const newRole = req.body.role;
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const validRoles = ['ADMIN', 'MEMBER'];
    if (!validRoles.includes(newRole)) {
        return res.status('400').json({
            success: false,
            message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
    }

    const updatedUser = await userService.updateRole(req.params.id, newRole);

    res.json({ success: true, message: 'Role updated successfuly', role: updatedUser.role });
});

export default router;
