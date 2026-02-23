import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from '../config';

export interface IAdmin extends Document {
    email: string;
    passwordHash: string;
    role: 'admin';
    createdAt: Date;
    comparePassword(candidate: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin'],
        default: 'admin',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
AdminSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    this.passwordHash = await bcrypt.hash(this.passwordHash, config.bcryptSaltRounds);
    next();
});

// Compare password method
AdminSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    return bcrypt.compare(candidate, this.passwordHash);
};

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
