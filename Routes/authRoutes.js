const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../Models/User')

const router = express.Router();

function generateToken(user) {
    return jwt.sign(
    { id: user._id, type: user.type },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
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

module.exports = router;