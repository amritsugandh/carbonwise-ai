require('dotenv').config();
const { onRequest } = require('firebase-functions/v2/https');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { initializeFirebase } = require('./src/config/firebase');

// Initialize Firebase Admin globally so it is reused across function invocations
initializeFirebase();

// Connect to MongoDB globally
connectDB();

// Expose Express API as a single Cloud Function
exports.api = onRequest({
  region: 'us-central1',
  timeoutSeconds: 120,
  memory: '512MiB',
  maxInstances: 10,
}, app);
