/* Firebase Configuration - Production Ready */

// Firebase configuration - PRODUCTION READY
const FIREBASE_CONFIG = {
  // PRODUCTION: Replace these with your actual Firebase project credentials
  // Get them from: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789000",
  appId: "1:123456789000:web:your-app-id"
  
  // DEMO MODE: Uncomment these for offline testing
  // apiKey: "demo-key-fallback-mode",
  // authDomain: "demo-project.firebaseapp.com", 
  // projectId: "demo-project",
  // storageBucket: "demo-project.appspot.com",
  // messagingSenderId: "000000000000",
  // appId: "1:000000000000:web:demo"
};

// Fallback authentication system for testing
const AUTH_FALLBACK = {
  enabled: true,
  users: new Map([
    ['test@demo.com', { 
      password: 'test123', 
      uid: 'test-user-1', 
      email: 'test@demo.com',
      isApproved: true,
      isFirstUser: true
    }],
    ['admin@demo.com', { 
      password: 'admin123', 
      uid: 'admin-user-1', 
      email: 'admin@demo.com',
      isApproved: true,
      isFirstUser: false
    }]
  ])
};

// Configuration notice
if (FIREBASE_CONFIG.apiKey === "demo-key-fallback-mode") {
  console.info("🔧 Firebase demo mode active. Demo users: test@demo.com (test123), admin@demo.com (admin123)");
  console.info("📋 To use production: Update firebase-config.js with real Firebase credentials");
} else if (FIREBASE_CONFIG.apiKey === "your-actual-api-key") {
  console.warn("⚠️ Please update firebase-config.js with your real Firebase project credentials!");
  console.info("📋 Get them from: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general");
} else {
  console.info("🚀 Firebase production configuration loaded");
}

// Export configuration and auth fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FIREBASE_CONFIG, AUTH_FALLBACK };
} else {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.AUTH_FALLBACK = AUTH_FALLBACK;
}