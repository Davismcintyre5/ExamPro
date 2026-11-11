const mongoose = require('mongoose');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Connected to MongoDB: ${mongoose.connection.host}\n`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const listAdmins = async () => {
  console.log('\n=== ADMIN LIST ===\n');
  
  const admins = await User.find({}).select('-password -adminHash');
  
  if (admins.length === 0) {
    console.log('No admins found.\n');
    return;
  }
  
  admins.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.fullName} (${admin.username || admin.email})`);
    console.log(`   Email: ${admin.email || 'N/A'}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Hidden Admin: ${admin.isHiddenAdmin ? 'Yes' : 'No'}`);
    console.log(`   Active: ${admin.isActive ? 'Yes' : 'No'}`);
    console.log(`   Last Login: ${admin.lastLogin ? admin.lastLogin.toLocaleString() : 'Never'}`);
    console.log(`   Login Count: ${admin.loginCount}`);
    console.log(`   Failed Attempts: ${admin.failedAttempts}`);
    console.log(`   Created: ${admin.createdAt.toLocaleString()}`);
    console.log('');
  });
};

const createAdmin = async () => {
  console.log('\n=== CREATE ADMIN ===\n');
  
  const username = await question('Enter username (or email): ');
  if (!username) {
    console.log('Username is required.\n');
    return;
  }
  
  const existingAdmin = await User.findOne({ 
    $or: [{ username }, { email: username }] 
  });
  if (existingAdmin) {
    console.log('Username/email already exists.\n');
    return;
  }
  
  const isEmail = username.includes('@');
  
  const fullName = await question('Enter full name (default: Administrator): ');
  const password = await question('Enter password: ');
  
  if (!password) {
    console.log('Password is required.\n');
    return;
  }
  
  const confirmPassword = await question('Confirm password: ');
  
  if (password !== confirmPassword) {
    console.log('Passwords do not match.\n');
    return;
  }
  
  const isHidden = await question('Is this a hidden admin? (yes/no, default: yes): ');
  
  const adminData = {
    password,
    fullName: fullName || 'Administrator',
    role: 'admin',
    isHiddenAdmin: isHidden.toLowerCase() !== 'no',
  };
  
  if (isEmail) {
    adminData.email = username;
  } else {
    adminData.username = username;
  }
  
  if (adminData.isHiddenAdmin) {
    adminData.adminHash = process.env.MASTER_ADMIN_HASH || 'default-admin-hash-2024';
  }
  
  const admin = new User(adminData);
  
  await admin.save();
  
  console.log(`\nAdmin "${username}" created successfully.\n`);
};

const manageAdmins = async () => {
  while (true) {
    console.log('\n=== MANAGE ADMINS ===\n');
    console.log('1. Toggle Active Status');
    console.log('2. Reset Password');
    console.log('3. Reset Failed Attempts');
    console.log('4. Delete Admin');
    console.log('5. Back to Main Menu');
    
    const choice = await question('\nSelect option: ');
    
    if (choice === '5') break;
    
    if (choice === '1') {
      const identifier = await question('Enter username or email: ');
      const admin = await User.findOne({ 
        $or: [{ username: identifier }, { email: identifier }] 
      });
      
      if (!admin) {
        console.log('Admin not found.\n');
        continue;
      }
      
      admin.isActive = !admin.isActive;
      await admin.save();
      console.log(`Admin "${identifier}" is now ${admin.isActive ? 'active' : 'inactive'}.\n`);
    }
    
    if (choice === '2') {
      const identifier = await question('Enter username or email: ');
      const admin = await User.findOne({ 
        $or: [{ username: identifier }, { email: identifier }] 
      });
      
      if (!admin) {
        console.log('Admin not found.\n');
        continue;
      }
      
      const password = await question('Enter new password: ');
      const confirmPassword = await question('Confirm new password: ');
      
      if (password !== confirmPassword) {
        console.log('Passwords do not match.\n');
        continue;
      }
      
      admin.password = password;
      await admin.save();
      console.log(`Password reset for "${identifier}".\n`);
    }
    
    if (choice === '3') {
      const identifier = await question('Enter username or email: ');
      const admin = await User.findOne({ 
        $or: [{ username: identifier }, { email: identifier }] 
      });
      
      if (!admin) {
        console.log('Admin not found.\n');
        continue;
      }
      
      admin.failedAttempts = 0;
      admin.lastFailedAttempt = null;
      await admin.save();
      console.log(`Failed attempts reset for "${identifier}".\n`);
    }
    
    if (choice === '4') {
      const identifier = await question('Enter username or email: ');
      const admin = await User.findOne({ 
        $or: [{ username: identifier }, { email: identifier }] 
      });
      
      if (!admin) {
        console.log('Admin not found.\n');
        continue;
      }
      
      const confirm = await question(`Are you sure you want to delete "${identifier}"? (yes/no): `);
      
      if (confirm.toLowerCase() === 'yes') {
        await User.findByIdAndDelete(admin._id);
        console.log(`Admin "${identifier}" deleted.\n`);
      } else {
        console.log('Operation cancelled.\n');
      }
    }
  }
};

const listCollections = async () => {
  console.log('\n=== DATABASE COLLECTIONS ===\n');
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  if (collections.length === 0) {
    console.log('No collections found.\n');
    return;
  }
  
  for (const collection of collections) {
    const count = await mongoose.connection.db.collection(collection.name).countDocuments();
    console.log(`${collection.name} (${count} documents)`);
  }
  
  console.log('');
};

const dropCollection = async () => {
  console.log('\n=== DROP COLLECTION ===\n');
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  if (collections.length === 0) {
    console.log('No collections found.\n');
    return;
  }
  
  collections.forEach((collection, index) => {
    console.log(`${index + 1}. ${collection.name}`);
  });
  
  const choice = await question('\nEnter collection number to drop (or 0 to cancel): ');
  const index = parseInt(choice) - 1;
  
  if (choice === '0' || isNaN(index) || index < 0 || index >= collections.length) {
    console.log('Operation cancelled.\n');
    return;
  }
  
  const collectionName = collections[index].name;
  const confirm = await question(`Are you sure you want to drop "${collectionName}"? This cannot be undone! (yes/no): `);
  
  if (confirm.toLowerCase() === 'yes') {
    await mongoose.connection.db.collection(collectionName).drop();
    console.log(`Collection "${collectionName}" dropped.\n`);
  } else {
    console.log('Operation cancelled.\n');
  }
};

const dropEntireDB = async () => {
  console.log('\n=== DROP ENTIRE DATABASE ===\n');
  
  const dbName = mongoose.connection.db.databaseName;
  
  console.log(`Database: ${dbName}`);
  
  const confirm1 = await question('This will permanently delete ALL data. Are you sure? (yes/no): ');
  
  if (confirm1.toLowerCase() !== 'yes') {
    console.log('Operation cancelled.\n');
    return;
  }
  
  const confirm2 = await question('Type "DELETE" to confirm: ');
  
  if (confirm2 !== 'DELETE') {
    console.log('Operation cancelled.\n');
    return;
  }
  
  await mongoose.connection.db.dropDatabase();
  console.log(`Database "${dbName}" dropped.\n`);
};

const showMainMenu = async () => {
  console.log('\n=== ExamPro Admin CLI ===\n');
  console.log('1. List Admins');
  console.log('2. Create Admin');
  console.log('3. Manage Admins');
  console.log('4. List DB Collections');
  console.log('5. Drop Collection');
  console.log('6. Drop Entire Database');
  console.log('7. Exit');
  
  const choice = await question('\nSelect option: ');
  
  switch (choice) {
    case '1':
      await listAdmins();
      break;
    case '2':
      await createAdmin();
      break;
    case '3':
      await manageAdmins();
      break;
    case '4':
      await listCollections();
      break;
    case '5':
      await dropCollection();
      break;
    case '6':
      await dropEntireDB();
      break;
    case '7':
      console.log('\nGoodbye!\n');
      await mongoose.connection.close();
      rl.close();
      process.exit(0);
      break;
    default:
      console.log('Invalid option. Try again.\n');
  }
  
  await showMainMenu();
};

const main = async () => {
  console.log('\n=================================');
  console.log('  ExamPro Admin CLI');
  console.log('  Author: Davix HDM');
  console.log('=================================\n');
  
  await connectDB();
  await showMainMenu();
};

main().catch((error) => {
  console.error('Error:', error);
  mongoose.connection.close();
  rl.close();
  process.exit(1);
});