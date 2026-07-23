import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Classroom, User } from './models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

async function check() {
  await mongoose.connect(MONGODB_URI, { dbName: 'app' });
  console.log('Connected to DB');
  
  const count = await Classroom.countDocuments({});
  console.log('Total classrooms in DB:', count);
  
  const rooms = await Classroom.find({}).lean();
  rooms.forEach(r => {
    console.log(`- ID: ${r._id}, Title: ${r.title}, Status: ${r.status}, TeacherId: ${r.teacherId}, Mode: ${r.mode}`);
  });

  const activeCount = await Classroom.countDocuments({ status: 'active' });
  console.log('Active classrooms:', activeCount);

  // Check the student we are logged in as
  const student = await User.findOne({ email: '24bcs148@iiitdwd.ac.in' }).lean();
  if (student) {
    console.log('Student found:', student._id, 'Name:', student.name);
    const enrollments = await mongoose.model('Enrollment').find({ studentId: student._id }).lean();
    console.log('Student enrollments:', enrollments);
    const queries = await mongoose.model('EnrollmentQuery').find({ studentId: student._id }).lean();
    console.log('Student queries:', queries);

    // Call discoverForStudent
    const result = await Classroom.discoverForStudent(student._id);
    console.log('discoverForStudent result:', result);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
