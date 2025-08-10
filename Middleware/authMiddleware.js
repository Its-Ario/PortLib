import pkg from 'jsonwebtoken';
const { verify } = pkg;
import User from '../Models/User.js';

async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (decoded.tokenVersion !== user.tokenVersion) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

function isAdmin(req, res, next) {
    if (req.user?.type !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
}

function isSuperUser(req, res, next) {
    if (!req.user?.isSuperUser) {
        return res.status(403).json({
            success: false,
            message: 'Super user access required',
        });
    }
    next();
}

export default verifyToken;
export { isAdmin, isSuperUser };
