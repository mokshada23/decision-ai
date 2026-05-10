const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const pool = require('./db/db');
const authRoutes = require('./routes/authRoutes');
const decisionRoutes = require('./routes/decisionRoutes');
const agentRoutes = require('./routes/agentRoutes');
const protect = require('./middleware/authMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/agent', agentRoutes);

// Protected test route
app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'You are inside a protected route!', userId: req.user.id });
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'TrueCompare backend is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});