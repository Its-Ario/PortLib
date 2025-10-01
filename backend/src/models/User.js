import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    name: { type: String },
    username: { type: String, required: true },
    passwordHash: { type: String },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, sparse: true },
    role: { type: String, required: true, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
    tokenVersion: { type: Number, default: 1 },
    balance: { type: Number, default: 0 },
});

userSchema.index({ username: 1 });

export default model('User', userSchema);
