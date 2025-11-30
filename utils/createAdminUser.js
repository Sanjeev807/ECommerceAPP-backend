require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User');

async function createAdminUser() {
  try {
    await sequelize.sync();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@eshop.com' } });
    
    if (existingAdmin) {
      return;
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@eshop.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1234567890',
      address: {
        street: '123 Admin Street',
        city: 'Admin City',
        state: 'Admin State',
        zipCode: '12345',
        country: 'USA'
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
