import User from '../Models/User';
import bcrypt from 'bcrypt';

class UserService {
    async registerUser(userData) {
        const { name, username, email, password } = userData;

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            throw new Error('User with this email or username already exists.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            username,
            email,
            passwordHash: hashedPassword,
        });

        await newUser.save();

        const userObject = newUser.toObject();
        delete userObject.passwordHash;
        return userObject;
    }

    async getUserProfile(userId) {
        return User.findById(userId).select('-passwordHash').lean();
    }

    async getUserProfileBy(field, value) {
        if (!field) {
            throw new Error('Field name is required');
        }
        const query = { [field]: value };
        return User.findOne(query).select('-passwordHash').lean();
    }

    async updateUserFunds(userId, amount) {
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { balance: amount } },
            { new: true, runValidators: true, select: '-passwordHash' }
        );

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    async updateRole(userId, newRole) {
        const validRoles = ['ADMIN', 'MEMBER'];
        if (!validRoles.includes(newRole)) {
            throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role: newRole },
            { new: true, runValidators: true }
        ).select('-passwordHash');

        if (!updatedUser) {
            throw new Error('User not found');
        }

        return updatedUser;
    }

    async getAllUsers({ limit = 50, skip = 0 } = {}) {
        const safeLimit = Math.min(Math.max(1, limit), 100);

        return User.find()
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean();
    }
}

export default new UserService();
