import mongoose from 'mongoose';
import { Admin } from '../models/Admin';
import { config } from '../config';

/**
 * Seed script to create an initial admin user.
 * Run with: npm run seed
 */
async function seedAdmin() {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('Connected to MongoDB');

        const existingAdmin = await Admin.findOne({ email: 'admin@whisperbite.com' });

        if (existingAdmin) {
            console.log('Admin user already exists. Skipping seed.');
            process.exit(0);
        }

        const admin = new Admin({
            email: 'admin@whisperbite.com',
            passwordHash: 'WhisperBite@2024', // will be hashed by pre-save hook
            role: 'admin',
        });

        await admin.save();
        console.log('✅ Admin user created successfully');
        console.log('   Email: admin@whisperbite.com');
        console.log('   Password: WhisperBite@2024');
        console.log('   ⚠️  Change these credentials in production!');

        process.exit(0);
    } catch (error: any) {
        console.error('Seed failed:', error.message);
        process.exit(1);
    }
}

seedAdmin();
