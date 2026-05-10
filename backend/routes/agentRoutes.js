const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const pool = require('../db/db');
const { runResearchAgent } = require('../agent/researchAgent');
const { runEval } = require('../agent/evalEngine');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
router.post('/run/:decisionId', protect, async (req, res) => {
  const { decisionId } = req.params;
  const userId = req.user.id;

  try {
    // Get the decision from database
    const decisionResult = await pool.query(
      'SELECT * FROM decisions WHERE id = $1 AND user_id = $2',
      [decisionId, userId]
    );

    if (decisionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Decision not found' });
    }

    const decision = decisionResult.rows[0];

    // Set up streaming headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream each step to frontend
    const onStep = (stepData) => {
      res.write(`data: ${JSON.stringify(stepData)}\n\n`);
    };

    // Run the agent
    const result = await runResearchAgent(
      decision.decision,
      decision.audience,
      decision.criteria,
      onStep
    );

    // Run eval automatically after agent completes
    onStep({ step: 'eval', title: 'Evaluating output quality...', status: 'running' });

    const evalResult = await runEval(
      decision.decision,
      decision.criteria,
      result
    );

    // Save eval to database
    await pool.query(
      `INSERT INTO evals 
        (decision_id, user_id, recommendation_score, options_score, confidence_score, conflicts_score, next_steps_score, overall_score, feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        decisionId,
        userId,
        evalResult.recommendation_score,
        evalResult.options_score,
        evalResult.confidence_score,
        evalResult.conflicts_score,
        evalResult.next_steps_score,
        evalResult.overall_score,
        JSON.stringify(evalResult.feedback)
      ]
    );

    // Update decision status
    await pool.query(
      'UPDATE decisions SET status = $1 WHERE id = $2',
      ['completed', decisionId]
    );

    onStep({ step: 'eval', title: 'Eval complete', status: 'done', data: evalResult });

    // Send final result
    res.write(`data: ${JSON.stringify({ step: 'complete', result, evalResult })}\n\n`);
    res.end();

  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ step: 'error', message: err.message })}\n\n`);
    res.end();
  }
});

// Get eval results for a decision
router.get('/eval/:decisionId', protect, async (req, res) => {
  try {
    const { decisionId } = req.params;
    const userId = req.user.id;

    const evalResult = await pool.query(
      'SELECT * FROM evals WHERE decision_id = $1 AND user_id = $2',
      [decisionId, userId]
    );

    res.json({ eval: evalResult.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all evals for dashboard
router.get('/evals/all', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const evals = await pool.query(
      `SELECT e.*, d.decision 
       FROM evals e 
       JOIN decisions d ON e.decision_id = d.id 
       WHERE e.user_id = $1 
       ORDER BY e.created_at DESC`,
      [userId]
    );

    res.json({ evals: evals.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Continue chat route
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, report, recommendation, messages } = req.body;

    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const systemPrompt = `You are a helpful AI research assistant. The user has just completed a decision research session.

Their recommendation was: "${recommendation}"

Report summary:
- Options compared: ${report.options.map(o => o.name).join(', ')}
- Next steps: ${report.nextSteps.join(', ')}

Answer their follow up questions helpfully and concisely based on this research context. Keep answers under 150 words.`;

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.5,
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Chat error', reply: 'Something went wrong. Try again.' });
  }
});
module.exports = router;