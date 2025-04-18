const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../Models/User');
const {verifyToken, checkAdmin} = require('../Middleware/authMiddleware');

const router = express.Router();
router.use(verifyToken, checkAdmin)

router.get('/', (req, res) => {
    res.status(200).json("Hi, Admin");
});

router.post('/adduser', async (req, res) => {
    const {password, ...rest} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        ...rest,
        password: hashedPassword
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
});

router.patch('/togglesuperuser/:id', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { isSuperUser: !user.isSuperUser },
        { new: true }
    );

    res.json({ message: "SuperUser status toggled", user: updatedUser });
});

module.exports = router;