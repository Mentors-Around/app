import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });
  console.log('Connected to MongoDB');

  const user = await User.findOne({
    $or: [{ email: 'alex.nightfury60@gmail.com' }, { email: 'alex.nightfury60' }],
    deletedAt: null
  });

  if (!user) {
    console.log('Teacher not found!');
  } else {
    user.passwordHash = 'Finn@123';
    await user.save();
    console.log(`Password reset for ${user.email} successfully.`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
