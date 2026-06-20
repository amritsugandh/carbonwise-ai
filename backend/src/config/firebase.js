const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId || projectId.startsWith('YOUR_')) {
    logger.warn('Firebase credentials not configured. Auth will be disabled.');
    logger.warn('Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL in backend/.env');
    return null;
  }

  try {
    const serviceAccount = {
      projectId,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/\r/g, '').trim(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim(),
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logger.info('Firebase Admin initialized');
    return firebaseApp;
  } catch (error) {
    logger.error(`Firebase initialization error: ${error.message}`);
    return null;
  }
};

const getFirebaseAdmin = () => {
  if (!firebaseApp) {
    const app = initializeFirebase();
    if (!app) return null;
  }
  return admin;
};

module.exports = { initializeFirebase, getFirebaseAdmin };
