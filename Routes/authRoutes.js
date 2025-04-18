const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { verifyToken } = require('../Middleware/authMiddleware');

const router = express.Router();

function generateToken(user) {
    return jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
    );
}

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await User.find();
    const user = users.find(u => u.username === username && bcrypt.compare(password, u.password));
    
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.json({ token });
});

router.post('/register', async (req, res) => {
    const {name, email, username, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        name,
        email,
        username,
        password: hashedPassword,
        type: 'user'
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
});

router.patch("/changepassword", verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(403).json({ error: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.tokenVersion += 1;
    await user.save();

    res.json({ message: "Password updated successfully" });
});

module.exports = router;