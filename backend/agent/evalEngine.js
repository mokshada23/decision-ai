const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const runEval = async (decision, criteria, result) => {
  try {

    const evalPrompt = `You are an expert AI output evaluator. Your job is to score the quality of an AI research report.

The user's decision: "${decision}"
The user's criteria: ${criteria.map(c => `${c.name} (weight: ${c.weight}/5)`).join(', ')}

The AI generated this report:
Recommendation: "${result.report.recommendation}"
Reasoning: "${result.report.reasoning}"
Options compared: ${result.report.options.map(o => o.name).join(', ')}
Next steps: ${result.report.nextSteps.join(', ')}
Overall confidence: ${result.scores.overallConfidence}%
Conflicts detected: ${result.conflicts.hasConflicts ? result.conflicts.conflicts.join(', ') : 'None'}

Score each of these dimensions from 0 to 100:

1. Recommendation score — Is the recommendation clear, specific, and directly addresses the decision?
2. Options score — Are the options well compared with meaningful pros and cons?
3. Confidence score — Are the confidence scores reasonable and well explained?
4. Conflicts score — Were conflicts properly identified and explained?
5. Next steps score — Are the next steps actionable and relevant?
6. Overall score — Overall quality of the research report

Respond ONLY with a JSON object in this exact format:
{
  "recommendation_score": 85,
  "options_score": 90,
  "confidence_score": 80,
  "conflicts_score": 75,
  "next_steps_score": 85,
  "overall_score": 83,
  "feedback": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "improvements": ["improvement 1", "improvement 2"]
  }
}`;

    const evalResponse = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [{ role: 'user', content: evalPrompt }],
      temperature: 0.2,
    });

    const evalText = evalResponse.choices[0].message.content;
    const clean = evalText.replace(/```json|```/g, '').trim();
    const evalResult = JSON.parse(clean);

    return evalResult;

  } catch (err) {
    console.error('Eval error:', err);
    return {
      recommendation_score: 0,
      options_score: 0,
      confidence_score: 0,
      conflicts_score: 0,
      next_steps_score: 0,
      overall_score: 0,
      feedback: {
        strengths: [],
        weaknesses: ['Eval failed'],
        improvements: []
      }
    };
  }
};

module.exports = { runEval };