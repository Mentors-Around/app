import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });
  console.log('Connected to MongoDB');

  const emails = ['subhi.singh11m@gmail.com', 'sugyanworkplace@gmail.com', 'alex.nightfury60@gmail.com', 'alex.nightfury60'];

  for (const email of emails) {
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { name: email }],
      deletedAt: null
    }).select('+passwordHash');

    if (!user) {
      console.log(`User not found for identifier: ${email}`);
      continue;
    }

    console.log(`\nUser: ${user.name} (${user.email || 'no-email'})`);
    console.log(`Role: ${user.role}`);
    console.log(`isActive: ${user.isActive}`);
    console.log(`isBanned: ${user.isBanned}`);
    console.log(`Password Hash in DB: ${user.passwordHash}`);

    // Test password match
    const testPasswords = ['Subhi@123', 'Alex@123', 'Finn@123', 'subhi123', 'alex123', 'finn123', 'sugyan12345'];
    for (const pw of testPasswords) {
      const match = await bcrypt.compare(pw, user.passwordHash || '').catch(err => false);
      if (match) {
        console.log(`  -> MATCH found with password: "${pw}"`);
      }
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
