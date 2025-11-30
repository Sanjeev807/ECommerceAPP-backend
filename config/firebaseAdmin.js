const admin = require('firebase-admin');

const initializeFirebase = () => {
  try {
    console.log('🔧 Initializing Firebase Admin SDK...');
    
    // Check if Firebase Admin is already initialized
    if (admin.apps.length === 0) {
      
      // For development - create a mock service account or use environment variables
      let serviceAccount;
      
      try {
        // Try to load the service account key file
        serviceAccount = require('./serviceAccountKey.json');
        console.log('📄 Service account key loaded successfully');
        
        // Check if it has real values (not placeholder)
        if (serviceAccount.private_key === 'YOUR_PRIVATE_KEY' || 
            serviceAccount.project_id === 'YOUR_PROJECT_ID' ||
            !serviceAccount.project_id ||
            !serviceAccount.private_key ||
            !serviceAccount.client_email) {
          throw new Error('Service account key contains placeholder or missing values');
        }
        
        // Verify project_id
        console.log(`🎯 Firebase Project ID: ${serviceAccount.project_id}`);
        
      } catch (error) {
        // If no valid service account, use development mode
        console.log('⚠️ Firebase service account not properly configured');
        return false;
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      console.log('✅ Firebase Admin SDK initialized with project:', serviceAccount.project_id);
      return true;
    }
    
    // Already initialized
    console.log('✅ Firebase Admin SDK already initialized');
    return true;
    
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error.message);
    return false;
  }
};

module.exports = initializeFirebase;
