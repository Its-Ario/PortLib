import { Router } from 'express';
import { hash } from 'bcrypt';
import User, { findById, findByIdAndUpdate } from '../Models/User';
import auth, { isAdmin } from '../Middleware/authMiddleware';

const router = Router();
router.use(auth, isAdmin)

router.get('/', (req, res) => {
    res.status(200).json("Hi, Admin");
});

router.post('/adduser', async (req, res) => {
    const {password, ...rest} = req.body;
    const hashedPassword = await hash(password, 10);
    const newUser = new User({
        ...rest,
        password: hashedPassword
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
});

router.patch('/togglesuperuser/:id', async (req, res) => {
    const user = await findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const updatedUser = await findByIdAndUpdate(
        req.params.id,
        { isSuperUser: !user.isSuperUser },
        { new: true }
    );

    res.json({ message: "SuperUser status toggled", user: updatedUser });
});

export default router;