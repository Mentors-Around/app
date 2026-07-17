import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });
  console.log('Connected to MongoDB');

  // 1. Delete test user if exists
  await User.deleteOne({ email: 'testloginuser@gmail.com' });

  // 2. Create user
  const user = await User.create({
    email: 'testloginuser@gmail.com',
    name: 'Test User',
    role: 'student',
    dateOfBirth: new Date('2000-01-01'),
    passwordHash: 'Test@123',
    isActive: true,
  });

  console.log('User created:', user.email);
  console.log('Password hash saved:', user.passwordHash);

  // 3. Test verification
  const foundUser = await User.findOne({ email: 'testloginuser@gmail.com' }).select('+passwordHash');
  const isValid = await foundUser.comparePassword('Test@123');
  console.log('Password comparison with "Test@123":', isValid);

  // Clean up
  await User.deleteOne({ email: 'testloginuser@gmail.com' });
  await mongoose.disconnect();
}

run().catch(console.error);
