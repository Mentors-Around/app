import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { TeacherProfile } from '../models/TeacherProfile.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });
  console.log('Connected to MongoDB');

  const result = await TeacherProfile.pendingVerification({ page: 1, limit: 20 });
  console.log('Pending verification result:', JSON.stringify(result, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
