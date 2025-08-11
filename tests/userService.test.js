import { jest } from '@jest/globals';
import mockingoose from 'mockingoose';
import { Types } from 'mongoose';
import userService from '../Services/userService.js';
import User from '../Models/User.js';

jest.mock('bcrypt', () => ({
    genSalt: jest.fn(),
    hash: jest.fn(),
}));

const userId = new Types.ObjectId();
const mockUser = {
    _id: userId,
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    balance: 100,
    role: 'MEMBER',
};

describe('userService', () => {
    beforeEach(() => {
        mockingoose.resetAll();
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        const userData = {
            name: 'New User',
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123',
        };

        it('should create and save a new user successfully', async () => {
            mockingoose(User).toReturn(null, 'findOne');

            const fakeNewUser = {
                ...userData,
                _id: new Types.ObjectId(),
                toObject: () => ({ ...userData, _id: new Types.ObjectId() }),
            };

            const saveMock = jest.fn().mockResolvedValue(fakeNewUser);
            jest.spyOn(User.prototype, 'save').mockImplementation(saveMock);

            const result = await userService.registerUser(userData);

            expect(saveMock).toHaveBeenCalled();
            expect(result).not.toHaveProperty('password');
            expect(result).not.toHaveProperty('passwordHash');
            expect(result.username).toBe(userData.username);
        });

        it('should throw an error if the user already exists', async () => {
            mockingoose(User).toReturn(mockUser, 'findOne');

            await expect(userService.registerUser(userData)).rejects.toThrow(
                'User with this email or username already exists.'
            );
        });
    });

    describe('getUserProfile', () => {
        it('should return a user profile by ID', async () => {
            mockingoose(User).toReturn(mockUser, 'findOne');

            const result = await userService.getUserProfile(userId.toString());

            expect(result._id).toEqual(mockUser._id);
            expect(result.name).toBe(mockUser.name);
        });
    });

    describe('updateUserFunds', () => {
        it('should correctly add funds to a user account', async () => {
            const updatedUser = { ...mockUser, balance: 150 };
            mockingoose(User).toReturn(updatedUser, 'findOneAndUpdate');

            const result = await userService.updateUserFunds(userId.toString(), 50);

            expect(result.balance).toBe(150);
        });

        it('should throw an error if the user is not found', async () => {
            mockingoose(User).toReturn(null, 'findOneAndUpdate');

            await expect(userService.updateUserFunds(userId.toString(), 50)).rejects.toThrow(
                'User not found'
            );
        });
    });

    describe('updateRole', () => {
        it('should update the user role successfully', async () => {
            const updatedUser = { ...mockUser, role: 'ADMIN' };
            mockingoose(User).toReturn(updatedUser, 'findOneAndUpdate');

            const result = await userService.updateRole(userId.toString(), 'ADMIN');

            expect(result.role).toBe('ADMIN');
        });

        it('should throw an error for an invalid role', async () => {
            await expect(userService.updateRole(userId.toString(), 'INVALID_ROLE')).rejects.toThrow(
                'Invalid role. Must be one of: ADMIN, MEMBER'
            );
        });
    });

    describe('getAllUsers', () => {
        it('should return a list of users', async () => {
            const userList = [
                mockUser,
                { ...mockUser, _id: new Types.ObjectId(), name: 'User Two' },
            ];
            mockingoose(User).toReturn(userList, 'find');

            const result = await userService.getAllUsers();

            expect(result.length).toBe(2);
            expect(result[0].name).toBe(mockUser.name);
        });
    });
});
