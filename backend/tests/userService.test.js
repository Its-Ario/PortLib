import { jest } from '@jest/globals';
import { Types } from 'mongoose';
import userService from '../src//services/userService.js';
import User from '../src/models/User.js';

jest.mock('bcrypt', () => ({
    genSalt: jest.fn(),
    hash: jest.fn(),
}));

async function createUser() {
    const user = await User.create({
        username: 'u',
        balance: 20,
        passwordHash: '1',
        email: 'a@b.com',
        type: 'user',
    });

    return user;
}

describe('userService', () => {
    describe('registerUser', () => {
        const userData = {
            name: 'n',
            username: 'u',
            password: 'p',
            email: 'a@b.com',
        };
        it('should create and save a new user successfully', async () => {
            const result = await userService.registerUser(userData);

            expect(result).not.toHaveProperty('password');
            expect(result).not.toHaveProperty('passwordHash');
            expect(result.username).toBe(userData.username);
        });

        it('should throw an error if the user already exists', async () => {
            await createUser();

            await expect(userService.registerUser(userData)).rejects.toThrow(
                'User with this email or username already exists.'
            );
        });
    });

    describe('getUserProfile', () => {
        it('should return a user profile by ID', async () => {
            const user = await createUser();
            const result = await userService.getUserProfile(user.id.toString());

            expect(result._id).toEqual(user._id);
            expect(result.name).toBe(user.name);
        });
    });

    describe('updateUserFunds', () => {
        it('should correctly add funds to a user account', async () => {
            const user = await createUser();
            user.balance = 100;
            await user.save();

            const result = await userService.updateUserFunds(user.id.toString(), 50);

            expect(result.balance).toBe(150);
        });

        it('should throw an error if the user is not found', async () => {
            const userId = new Types.ObjectId();

            await expect(userService.updateUserFunds(userId.toString(), 50)).rejects.toThrow(
                'User not found'
            );
        });
    });

    describe('updateRole', () => {
        let user;

        beforeEach(async () => {
            user = await createUser();
        });
        it('should update the user role successfully', async () => {
            const result = await userService.updateRole(user.id.toString(), 'ADMIN');

            expect(result.role).toBe('ADMIN');
        });

        it('should throw an error for an invalid role', async () => {
            await expect(
                userService.updateRole(user.id.toString(), 'INVALID_ROLE')
            ).rejects.toThrow('Invalid role. Must be one of: ADMIN, MEMBER');
        });
    });

    describe('getAllUsers', () => {
        it('should return a list of users', async () => {
            const user = await createUser();
            await createUser();
            const result = await userService.getAllUsers();

            expect(result).not.toHaveProperty('passwordHash');
            expect(result).not.toHaveProperty('tokenVersion');
            expect(result.length).toBe(2);
            expect(result[0].username).toBe(user.username);
        });
    });

    describe('updateTokenVersion', () => {
        it('should increment tokenVersion for a user', async () => {
            const user = await createUser();
            user.tokenVersion = 0;
            await user.save();

            const updatedUser = await userService.updateTokenVersion(user.id.toString());

            expect(updatedUser.tokenVersion).toBe(1);
        });

        it('should throw an error if the user is not found', async () => {
            const userId = new Types.ObjectId();

            await expect(userService.updateTokenVersion(userId.toString())).rejects.toThrow(
                'User not found'
            );
        });
    });
});
