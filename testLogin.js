require('dotenv').config();
const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('🧪 Testing login API...');
    console.log('🎯 Endpoint: http://localhost:5000/api/auth/login');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'sharana123@gmail.com',
      password: 'password123',
      fcmToken: null
    });

    console.log('✅ Login successful!');
    console.log('👤 User:', response.data.name);
    console.log('📧 Email:', response.data.email);
    console.log('🎯 Role:', response.data.role);
    console.log('🔑 Token received:', !!response.data.token);

  } catch (error) {
    console.error('❌ Login failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.data?.message || error.message);
    console.error('   Full error:', error.response?.data || error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔧 Backend server is not running! Start it with: npm start');
    }
  }
};

testLogin();