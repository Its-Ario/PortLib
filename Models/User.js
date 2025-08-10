import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    name: { type: String },
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    isSuperUser: { type: Boolean, required: true, default: false },
    type: { type: String, required: true, enum: ['admin', 'user'], default: 'user' },
    tokenVersion: { type: Number, default: 1 },
    balance: { type: Number, default: 0 },
});

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export default model('User', userSchema);
