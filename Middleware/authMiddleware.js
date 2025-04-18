const jwt = require('jsonwebtoken');
const User = require('../Models/User');

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token missing or invalid" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (decoded.tokenVersion != user.tokenVersion) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

function checkAdmin(req, res, next) {
    if (req.user?.type !== "admin") {
        return res.status(403).json({message: "Unauthorized"});
    }
    next();
}

module.exports = {verifyToken, checkAdmin}