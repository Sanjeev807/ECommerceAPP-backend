const fcmService = require('./services/fcmService');
const logger = require('./utils/logger');

/**
 * Test script to verify FCM error handling fixes
 * This script tests various FCM scenarios to ensure errors don't crash the server
 */

async function testFCMErrorHandling() {
  console.log('🧪 Testing FCM Error Handling...\n');

  // Test 1: Invalid token handling
  console.log('Test 1: Testing invalid FCM token handling...');
  try {
    const invalidToken = 'invalid-fcm-token-12345';
    const result = await fcmService.sendNotification(
      invalidToken,
      'Test Notification',
      'This should handle errors gracefully'
    );
    
    if (result && result.success === false) {
      console.log('✅ PASS: Invalid token handled gracefully');
      console.log(`   Response: ${JSON.stringify(result)}`);
    } else {
      console.log('❌ FAIL: Invalid token not handled properly');
    }
  } catch (error) {
    console.log('❌ FAIL: Exception thrown for invalid token:', error.message);
  }

  console.log();

  // Test 2: Send to non-existent user
  console.log('Test 2: Testing sendToUser with non-existent user...');
  try {
    const result = await fcmService.sendToUser(
      999999,
      'Test Notification',
      'This should handle non-existent users gracefully'
    );
    
    if (result && result.success === false) {
      console.log('✅ PASS: Non-existent user handled gracefully');
      console.log(`   Response: ${JSON.stringify(result)}`);
    } else {
      console.log('❌ FAIL: Non-existent user not handled properly');
    }
  } catch (error) {
    console.log('❌ FAIL: Exception thrown for non-existent user:', error.message);
  }

  console.log();

  // Test 3: Empty token array for multicast
  console.log('Test 3: Testing multicast with empty tokens...');
  try {
    const result = await fcmService.sendMulticastNotification(
      [],
      'Test Notification',
      'This should handle empty token arrays gracefully'
    );
    
    if (result && result.success === false) {
      console.log('✅ PASS: Empty token array handled gracefully');
      console.log(`   Response: ${JSON.stringify(result)}`);
    } else {
      console.log('❌ FAIL: Empty token array not handled properly');
    }
  } catch (error) {
    console.log('❌ FAIL: Exception thrown for empty token array:', error.message);
  }

  console.log();

  // Test 4: sendToAllUsers when no users have FCM tokens
  console.log('Test 4: Testing sendToAllUsers...');
  try {
    const result = await fcmService.sendToAllUsers(
      'Test Notification',
      'This should handle cases where no users have tokens'
    );
    
    console.log('✅ PASS: sendToAllUsers completed');
    console.log(`   Response: ${JSON.stringify(result)}`);
  } catch (error) {
    console.log('❌ FAIL: Exception thrown in sendToAllUsers:', error.message);
  }

  console.log('\n🔍 FCM Error Handling Tests Complete!');
  console.log('If all tests show "PASS", the FCM service should no longer crash the server.');
}

// Run the tests
if (require.main === module) {
  testFCMErrorHandling()
    .then(() => {
      console.log('\n✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testFCMErrorHandling };