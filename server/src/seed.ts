import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import Session from './models/Session';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Session.deleteMany({});

  // Create guard
  const guard = await User.create({
    email: 'guard@setu.ie',
    password: 'guard123',
    role: 'guard',
    name: 'John Guard',
  });

  // Create students
  const student1 = await User.create({
    email: 'alice@setu.ie',
    password: 'student123',
    role: 'student',
    name: 'Alice Murphy',
    rollNumber: 'C00123456',
    department: 'Computer Science',
  });

  const student2 = await User.create({
    email: 'bob@setu.ie',
    password: 'student123',
    role: 'student',
    name: 'Bob Walsh',
    rollNumber: 'C00234567',
    department: 'Engineering',
  });

  const student3 = await User.create({
    email: 'carol@setu.ie',
    password: 'student123',
    role: 'student',
    name: 'Carol Byrne',
    rollNumber: 'C00345678',
    department: 'Business',
  });

  // Create demo sessions
  await Session.create({
    student: student1._id,
    belongings: [
      { description: 'Dell Laptop - Silver', type: 'laptop' },
      { description: 'Data Structures Textbook', type: 'book' },
    ],
    status: 'pending',
  });

  await Session.create({
    student: student2._id,
    belongings: [
      { description: 'Lenovo ThinkPad - Black', type: 'laptop' },
      { description: 'Engineering Notes Folder', type: 'bag' },
    ],
    status: 'active',
    entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    guard: guard._id,
  });

  await Session.create({
    student: student3._id,
    belongings: [{ description: 'MacBook Air - Gold', type: 'laptop' }],
    status: 'completed',
    entryTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
    exitTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    guard: guard._id,
  });

  console.log('\n✅ Seed complete!\n');
  console.log('Guard:    guard@setu.ie   / guard123');
  console.log('Student1: alice@setu.ie   / student123 (C00123456)');
  console.log('Student2: bob@setu.ie     / student123 (C00234567)');
  console.log('Student3: carol@setu.ie   / student123 (C00345678)');

  await mongoose.disconnect();
}

seed().catch(console.error);
