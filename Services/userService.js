import User from '../Models/User.js';
import bcrypt from 'bcrypt';
import logger from '../logger.js';

class UserService {
    async registerUser(userData) {
        try {
            const { name, username, email, password } = userData;
            logger.info(`Registering user: ${username} (${email})`);

            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) {
                logger.warn(`User already exists: ${username} or ${email}`);
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
            logger.info(`User created: ${newUser._id}`);

            const userObject = newUser.toObject();
            delete userObject.passwordHash;
            return userObject;
        } catch (error) {
            logger.error(`Failed to register user: ${error.message}`, error);
            throw error;
        }
    }

    async getUserProfile(userId) {
        try {
            logger.info(`Fetching profile for user: ${userId}`);
            return User.findById(userId).select('-passwordHash').lean();
        } catch (error) {
            logger.error(`Failed to get user profile: ${error.message}`, error);
            throw error;
        }
    }

    async getUserProfileBy(field, value) {
        try {
            if (!field) throw new Error('Field name is required');
            logger.info(`Fetching user by ${field}: ${value}`);
            const query = { [field]: value };
            return User.findOne(query).select('-passwordHash').lean();
        } catch (error) {
            logger.error(`Failed to get user by ${field}: ${error.message}`, error);
            throw error;
        }
    }

    async updateUserFunds(userId, amount) {
        try {
            logger.info(`Updating funds for user ${userId} by ${amount}`);
            const user = await User.findByIdAndUpdate(
                userId,
                { $inc: { balance: amount } },
                { new: true, runValidators: true, select: '-passwordHash' }
            );

            if (!user) {
                logger.warn(`User not found for funds update: ${userId}`);
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            logger.error(`Failed to update user funds: ${error.message}`, error);
            throw error;
        }
    }

    async updateRole(userId, newRole) {
        try {
            const validRoles = ['ADMIN', 'MEMBER'];
            if (!validRoles.includes(newRole)) {
                throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
            }

            logger.info(`Updating role for user ${userId} to ${newRole}`);
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { role: newRole },
                { new: true, runValidators: true }
            ).select('-passwordHash');

            if (!updatedUser) {
                logger.warn(`User not found for role update: ${userId}`);
                throw new Error('User not found');
            }

            return updatedUser;
        } catch (error) {
            logger.error(`Failed to update user role: ${error.message}`, error);
            throw error;
        }
    }

    async getAllUsers({ limit = 50, skip = 0 } = {}) {
        try {
            const safeLimit = Math.min(Math.max(1, limit), 100);
            logger.info(`Fetching all users: limit=${safeLimit}, skip=${skip}`);
            return User.find()
                .select('-passwordHash -tokenVersion -__v')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .lean();
        } catch (error) {
            logger.error(`Failed to fetch users: ${error.message}`, error);
            throw error;
        }
    }
}

export default new UserService();
