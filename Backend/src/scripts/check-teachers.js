import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { TeacherProfile } from '../models/TeacherProfile.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });
  console.log('Connected to MongoDB');

  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users in database '${process.env.DB_NAME}':`);
  for (const u of users) {
    console.log(`User: ${u.name} (${u.email}) - role: ${u.role}, kycStatus: ${u.kycStatus}`);
    if (u.role === 'teacher') {
      const profile = await TeacherProfile.findOne({ userId: u._id }).lean();
      if (profile) {
        console.log(`  Profile found!`);
        console.log(`    verificationStatus: ${profile.verificationStatus}`);
        console.log(`    kycDocumentIds:`, profile.kycDocumentIds);
      } else {
        console.log(`  Profile NOT found!`);
      }
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
