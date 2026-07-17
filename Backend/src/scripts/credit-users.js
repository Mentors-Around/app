import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { StudentWallet } from '../models/StudentWallet.model.js';
import { TeacherProfile } from '../models/TeacherProfile.model.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME });
  console.log('Connected to MongoDB');

  // 1. Credit Student
  const student = await User.findOne({ email: 'subhi.singh11m@gmail.com', deletedAt: null });
  if (student) {
    let wallet = await StudentWallet.findOne({ studentId: student._id });
    if (!wallet) {
      wallet = await StudentWallet.create({ studentId: student._id });
    }
    wallet.tokenBalance = 10;
    wallet.cashBalancePaise = 500000; // ₹5000
    await wallet.save();
    console.log(`Credited Student ${student.name} wallet. Cash: ₹${wallet.cashBalanceRupees}, Tokens: ${wallet.tokenBalance}`);
  } else {
    console.log('Student not found!');
  }

  // 2. Credit Teacher
  const teacher = await User.findOne({ email: 'alex.nightfury60@gmail.com', deletedAt: null });
  if (teacher) {
    let profile = await TeacherProfile.findOne({ userId: teacher._id });
    if (profile) {
      profile.walletPaise = 500000; // ₹5000
      await profile.save();
      console.log(`Credited Teacher ${teacher.name} profile wallet. Cash: ₹${profile.walletPaise / 100}`);
    } else {
      console.log('Teacher Profile not found!');
    }
  } else {
    console.log('Teacher not found!');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
