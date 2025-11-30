// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5RY4sAvzez8XevNlhUcNiCLUcrZKxI-k",
  authDomain: "e-shopeasy.firebaseapp.com",
  projectId: "e-shopeasy",
  storageBucket: "e-shopeasy.firebasestorage.app",
  messagingSenderId: "605116703017",
  appId: "1:605116703017:web:1deeb57e99a67522309738",
  measurementId: "G-JT88GF3SF1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  // Handle click action
  event.waitUntil(
    clients.openWindow('http://localhost:5000')
  );
});