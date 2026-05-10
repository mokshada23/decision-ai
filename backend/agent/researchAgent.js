const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const runResearchAgent = async (decision, audience, criteria, onStep) => {
  try {

    // ─── STEP 1: UNDERSTAND & PLAN ───
    onStep({ step: 1, title: 'Understanding your decision...', status: 'running' });

    const planPrompt = `You are a research planning expert. A user wants help making this decision:

Decision: "${decision}"
This is for: ${audience}
Criteria that matter to them (with weights 1-5):
${criteria.map(c => `- ${c.name} (weight: ${c.weight}/5)`).join('\n')}

Your job is to create a research plan. Generate 3 specific search queries that would find the best information to help with this decision.

Respond ONLY with a JSON object in this exact format, no other text:
{
  "summary": "one sentence summary of what needs to be researched",
  "queries": ["query 1", "query 2", "query 3"]
}`;

    const planResponse = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [{ role: 'user', content: planPrompt }],
      temperature: 0.3,
    });

    let plan;
    try {
      const planText = planResponse.choices[0].message.content;
      const clean = planText.replace(/```json|```/g, '').trim();
      plan = JSON.parse(clean);
    } catch {
      plan = {
        summary: 'Researching your decision',
        queries: [decision, `best options for ${decision}`, `comparison ${decision}`]
      };
    }

    onStep({ step: 1, title: 'Research plan created', status: 'done', data: plan });

    // ─── STEP 2: RESEARCH EACH QUERY ───
    onStep({ step: 2, title: 'Researching sources...', status: 'running' });

    const researchResults = [];

    for (const query of plan.queries) {
      const researchPrompt = `You are a research expert. Based on your knowledge, provide detailed and accurate information about this topic:

Query: "${query}"

Context: This is to help someone decide: "${decision}"

Provide factual, balanced information. Include specific details, numbers, and comparisons where relevant.

Respond ONLY with a JSON object in this exact format:
{
  "query": "${query}",
  "source": "Knowledge Base",
  "findings": "detailed findings here in 3-4 sentences",
  "keyPoints": ["point 1", "point 2", "point 3"]
}`;

      const researchResponse = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL,
        messages: [{ role: 'user', content: researchPrompt }],
        temperature: 0.3,
      });

      try {
        const researchText = researchResponse.choices[0].message.content;
        const clean = researchText.replace(/```json|```/g, '').trim();
        const result = JSON.parse(clean);
        researchResults.push(result);
      } catch {
        researchResults.push({
          query,
          source: 'Knowledge Base',
          findings: researchResponse.choices[0].message.content,
          keyPoints: []
        });
      }
    }

    onStep({ step: 2, title: 'Sources researched', status: 'done', data: researchResults });

    // ─── STEP 3: DETECT CONFLICTS ───
    onStep({ step: 3, title: 'Detecting conflicts between sources...', status: 'running' });

    const conflictPrompt = `You are an expert at analyzing research findings and detecting conflicts.

Here are research findings from multiple queries about: "${decision}"

${researchResults.map((r, i) => `Source ${i + 1} (${r.query}):
${r.findings}`).join('\n\n')}

Analyze these findings and identify:
1. Where the sources agree
2. Where the sources conflict or contradict each other

Respond ONLY with a JSON object in this exact format:
{
  "agreements": ["agreement 1", "agreement 2"],
  "conflicts": ["conflict 1 if any", "conflict 2 if any"],
  "hasConflicts": true or false
}`;

    const conflictResponse = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [{ role: 'user', content: conflictPrompt }],
      temperature: 0.3,
    });

    let conflicts;
    try {
      const conflictText = conflictResponse.choices[0].message.content;
      const clean = conflictText.replace(/```json|```/g, '').trim();
      conflicts = JSON.parse(clean);
    } catch {
      conflicts = { agreements: [], conflicts: [], hasConflicts: false };
    }

    onStep({ step: 3, title: 'Conflict analysis complete', status: 'done', data: conflicts });

    // ─── STEP 4: SCORE CONFIDENCE ───
    onStep({ step: 4, title: 'Scoring confidence...', status: 'running' });

    const scorePrompt = `You are an expert at evaluating research quality and confidence.

Decision being made: "${decision}"
Criteria: ${criteria.map(c => `${c.name} (weight: ${c.weight}/5)`).join(', ')}

Research findings:
${researchResults.map((r, i) => `${i + 1}. ${r.findings}`).join('\n')}

For each criterion, score the confidence of the research findings from 0-100.

Respond ONLY with a JSON object in this exact format:
{
  "scores": [
    {"criterion": "criterion name", "score": 85, "reason": "why this score"}
  ],
  "overallConfidence": 80
}`;

    const scoreResponse = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [{ role: 'user', content: scorePrompt }],
      temperature: 0.3,
    });

    let scores;
    try {
      const scoreText = scoreResponse.choices[0].message.content;
      const clean = scoreText.replace(/```json|```/g, '').trim();
      scores = JSON.parse(clean);
    } catch {
      scores = {
        scores: criteria.map(c => ({ criterion: c.name, score: 75, reason: 'Based on available information' })),
        overallConfidence: 75
      };
    }

    onStep({ step: 4, title: 'Confidence scores calculated', status: 'done', data: scores });

    // ─── STEP 5: GENERATE FINAL REPORT ───
    onStep({ step: 5, title: 'Generating your decision report...', status: 'running' });

    const reportPrompt = `You are an expert decision analyst. Generate a comprehensive decision report.

Decision: "${decision}"
For: ${audience}
Criteria: ${criteria.map(c => `${c.name} (weight: ${c.weight}/5)`).join(', ')}

Research findings:
${researchResults.map((r, i) => `${i + 1}. ${r.findings}`).join('\n')}

Agreements found: ${conflicts.agreements.join(', ')}
Conflicts found: ${conflicts.conflicts.join(', ')}
Overall confidence: ${scores.overallConfidence}%

Generate a clear, structured decision report that helps the user make a confident decision.

Respond ONLY with a JSON object in this exact format:
{
  "recommendation": "Clear recommendation in 1-2 sentences",
  "reasoning": "Why this recommendation in 2-3 sentences",
  "options": [
    {
      "name": "Option name",
      "pros": ["pro 1", "pro 2"],
      "cons": ["con 1", "con 2"],
      "score": 85
    }
  ],
  "nextSteps": ["step 1", "step 2", "step 3"]
}`;

    const reportResponse = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [{ role: 'user', content: reportPrompt }],
      temperature: 0.3,
    });

    let report;
    try {
      const reportText = reportResponse.choices[0].message.content;
      const clean = reportText.replace(/```json|```/g, '').trim();
      report = JSON.parse(clean);
    } catch {
      report = {
        recommendation: 'Based on research findings',
        reasoning: reportResponse.choices[0].message.content,
        options: [],
        nextSteps: []
      };
    }

    onStep({ step: 5, title: 'Report ready!', status: 'done', data: report });

    // ─── RETURN FULL RESULT ───
    // ─── STEP 6: RESOURCE FINDER ───
    onStep({ step: 6, title: 'Finding resources to go deeper...', status: 'running' });

    const resourcePrompt = `You are an expert research assistant. A user has made this decision:

Decision: "${decision}"
Recommendation: "${report.recommendation}"

Your job is to suggest the best resources for them to go deeper and verify this decision themselves.

Respond ONLY with a JSON object in this exact format:
{
  "startHere": {
    "name": "Single best resource name",
    "url": "https://actualurl.com",
    "type": "website or youtube or book",
    "description": "Why this is the single best place to start learning about this decision"
  },
  "websites": [
    {
      "name": "Website name",
      "url": "https://actualurl.com",
      "description": "What they will find here and why it's useful"
    }
  ],
  "youtube": [
    {
      "searchQuery": "exact search query to type on YouTube",
      "description": "What this will help them learn"
    }
  ],
  "communities": [
    {
      "name": "Community name",
      "url": "https://actualurl.com",
      "description": "Why this community is useful for this decision"
    }
  ]
}

Provide 1 startHere resource, 4 websites, 4 YouTube search queries, and 3 communities. Make them specific and highly relevant to the decision.`;

    const resourceResponse = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL,
      messages: [{ role: 'user', content: resourcePrompt }],
      temperature: 0.3,
    });

    let resources;
    try {
      const resourceText = resourceResponse.choices[0].message.content;
      const clean = resourceText.replace(/```json|```/g, '').trim();
      resources = JSON.parse(clean);
    } catch {
      resources = { websites: [], youtube: [], communities: [] };
    }

    console.log('Resources generated:', JSON.stringify(resources, null, 2));

    onStep({ step: 6, title: 'Resources found!', status: 'done', data: resources });

    return {
      success: true,
      plan,
      researchResults,
      conflicts,
      scores,
      report,
      resources
    };

  } catch (err) {
    console.error('Agent error:', err);
    onStep({ step: 0, title: 'Something went wrong', status: 'error' });
    throw err;
  }
};

module.exports = { runResearchAgent };