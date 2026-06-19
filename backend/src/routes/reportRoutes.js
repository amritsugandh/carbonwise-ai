const express = require('express');
const router = express.Router();
const { generateReport, downloadReport, getReports } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.post('/generate', authenticate, generateReport);
router.get('/', authenticate, getReports);
router.get('/download/:id', authenticate, downloadReport);

module.exports = router;
