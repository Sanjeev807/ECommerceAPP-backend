require('dotenv').config();
const { sequelize } = require('./config/database');
const User = require('./models/User');

const resetUserPassword = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check all users first
    const allUsers = await User.findAll({
      attributes: ['id', 'name', 'email', 'role']
    });
    
    console.log('📋 Available users:');
    allUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.name}) - ${u.role}`);
    });

    // Look for the user trying to login (shivu1234@gmail.com)
    let user = await User.findOne({
      where: { email: 'shivu1234@gmail.com' }
    });

    if (!user) {
      // Try similar emails
      user = await User.findOne({
        where: { email: 'shivu123@gmail.com' }
      });
    }

    if (!user) {
      // Try the other email
      user = await User.findOne({
        where: { email: 'sharana123@gmail.com' }
      });
    }

    if (!user) {
      console.log('❌ User not found, creating shivu1234@gmail.com...');
      
      user = await User.create({
        name: 'Shivu',
        email: 'shivu1234@gmail.com',
        password: 'shivu1234',
        phone: '1234567890',
        role: 'admin'
      });
      
      console.log('✅ User created successfully!');
    } else {
      console.log(`👤 Found existing user: ${user.email}`);
      
      // Update email to match what user is trying if it's close
      if (user.email === 'shivu123@gmail.com') {
        user.email = 'shivu1234@gmail.com';
        console.log('📧 Updated email to shivu1234@gmail.com');
      }
    }

    console.log('👤 User found/created:', user.name);
    
    // Update password to match what user is trying
    user.password = 'shivu1234'; // This will be hashed automatically by the beforeUpdate hook
    await user.save();

    console.log('✅ Password reset successfully!');
    console.log('📧 Email: shivu1234@gmail.com');
    console.log('🔑 Password: shivu1234');
    console.log('👑 Role:', user.role);
    console.log('');
    console.log('🚀 You can now login with these exact credentials');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await sequelize.close();
  }
};

resetUserPassword();