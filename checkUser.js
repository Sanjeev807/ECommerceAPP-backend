require('dotenv').config();
const { sequelize } = require('./config/database');
const User = require('./models/User');

const checkUser = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if user exists
    const user = await User.findOne({
      where: { email: 'sharana123@gmail.com' }
    });

    if (user) {
      console.log('✅ User found:');
      console.log('👤 Name:', user.name);
      console.log('📧 Email:', user.email);
      console.log('🎯 Role:', user.role);
      console.log('📅 Created:', user.createdAt);
    } else {
      console.log('❌ User not found with email: sharana123@gmail.com');
      console.log('🔧 Creating user...');
      
      const newUser = await User.create({
        name: 'Sharana',
        email: 'sharana123@gmail.com',
        password: 'password123',
        role: 'user'
      });
      
      console.log('✅ User created successfully!');
      console.log('👤 Name:', newUser.name);
      console.log('📧 Email:', newUser.email);
      console.log('🔑 Password: password123');
      console.log('🎯 Role:', newUser.role);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
};

checkUser();