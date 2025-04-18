const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../Models/User')
const {verifyToken, checkAdmin} = require('../Middleware/authMiddleware')

const router = express.Router();

router.get('/', verifyToken, checkAdmin, (req, res) => {
    res.status(200).json("Hi, Admin");
});

router.post('/adduser', verifyToken, async (req, res) => {
    const {password, ...rest} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        ...rest,
        password: hashedPassword
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
});

module.exports = router;