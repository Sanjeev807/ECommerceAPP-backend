require('dotenv').config();
const { sequelize } = require('./config/database');
const User = require('./models/User');

const createAdminUser = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      console.log('👤 Admin Name:', existingAdmin.name);
      console.log('🎯 Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@eshop.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Admin user created successfully!');
    console.log('👤 Name:', adminUser.name);
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password: admin123');
    console.log('🎯 Role:', adminUser.role);
    console.log('');
    console.log('🚀 You can now login with:');
    console.log('   Email: admin@eshop.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🎯 After login, you will be redirected to Admin Dashboard');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
};

// Also check and upgrade existing users to admin if needed
const upgradeUserToAdmin = async (email) => {
  try {
    await sequelize.authenticate();
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('❌ User not found:', email);
      return;
    }

    user.role = 'admin';
    await user.save();

    console.log('✅ User upgraded to admin:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🎯 New Role:', user.role);

  } catch (error) {
    console.error('❌ Error upgrading user:', error);
  } finally {
    await sequelize.close();
  }
};

// Check command line arguments
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === 'upgrade') {
  const email = args[1];
  if (email) {
    upgradeUserToAdmin(email);
  } else {
    console.log('❌ Please provide email: node createAdmin.js upgrade user@example.com');
  }
} else {
  createAdminUser();
}