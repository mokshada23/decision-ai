const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createDecision, getDecisions, getDecision } = require('../controllers/decisionController');

// All routes here are protected — user must be logged in
router.post('/', protect, createDecision);
router.get('/', protect, getDecisions);
router.get('/:id', protect, getDecision);

module.exports = router;