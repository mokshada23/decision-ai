const pool = require('../db/db');

// Save a new decision
const createDecision = async (req, res) => {
  try {
    const { decision, audience, criteria } = req.body;
    const userId = req.user.id;

    const newDecision = await pool.query(
      'INSERT INTO decisions (user_id, decision, audience, criteria) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, decision, audience, JSON.stringify(criteria)]
    );

    res.status(201).json({
      message: 'Decision saved successfully',
      decision: newDecision.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all decisions for logged in user
const getDecisions = async (req, res) => {
  try {
    const userId = req.user.id;

    const decisions = await pool.query(
      'SELECT * FROM decisions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ decisions: decisions.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single decision by id
const getDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const decision = await pool.query(
      'SELECT * FROM decisions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (decision.rows.length === 0) {
      return res.status(404).json({ message: 'Decision not found' });
    }

    res.json({ decision: decision.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createDecision, getDecisions, getDecision };