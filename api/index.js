// Vercel Serverless Function entry point
// This wraps the existing Express app for Vercel's serverless runtime.

require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });

const app = require('../backend/src/app');
const connectDB = require('../backend/src/config/database');
const { initializeFirebase } = require('../backend/src/config/firebase');

// Initialize once (Vercel reuses warm instances)
let isInitialized = false;

const initialize = async () => {
  if (isInitialized) return;
  initializeFirebase();
  await connectDB();
  isInitialized = true;
};

// Export the handler
module.exports = async (req, res) => {
  await initialize();
  return app(req, res);
};
