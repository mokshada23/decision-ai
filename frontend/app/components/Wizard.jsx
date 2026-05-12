'use client';
import { createDecision } from '../lib/api';
import { useState } from 'react';

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [decision, setDecision] = useState('');
  const [audience, setAudience] = useState('Just me');
  const [criteria, setCriteria] = useState([
    { name: 'Cost', weight: 3 },
    { name: 'Performance', weight: 4 },
    { name: 'Ease of use', weight: 2 },
  ]);
  const [newCriteria, setNewCriteria] = useState('');

  const audiences = ['Just me', 'My team', 'My startup', 'A client'];
  const examples = [
    'Which cloud provider should my startup use?',
    'Which laptop should I buy for video editing under ₹1,50,000?',
    'Which CRM is best for a 10-person sales team?',
    'PostgreSQL vs MongoDB for a real-time analytics app?',
  ];
  const quickCriteria = ['Cost', 'Performance', 'Ease of use', 'Scalability', 'Support quality', 'Security'];

  const addCriteria = (name) => {
    if (!name.trim()) return;
    if (criteria.find(c => c.name.toLowerCase() === name.toLowerCase())) return;
    setCriteria([...criteria, { name, weight: 3 }]);
    setNewCriteria('');
  };

  const removeCriteria = (index) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateWeight = (index, weight) => {
    setCriteria(criteria.map((c, i) => i === index ? { ...c, weight } : c));
  };

  const handleSubmit = async () => {
    try {
      const data = { decision, audience, criteria };
      const token = localStorage.getItem('token');

      if (token) {
        // Logged in — save to database
        const response = await createDecision(data);
        const decisionId = response.data.decision.id;
        window.location.href = `/dashboard/research?id=${decisionId}`;
      } else {
        // Guest — save to localStorage and redirect
        const guestDecision = {
          id: 'guest',
          decision: data.decision,
          audience: data.audience,
          criteria: data.criteria,
        };
        localStorage.setItem('guestDecision', JSON.stringify(guestDecision));
        window.location.href = `/dashboard/research?id=guest`;
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-xl p-8">

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8">
          {['Your decision', 'What matters', 'Review & launch'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                ${step > i + 1 ? 'bg-green-500 text-white' :
                  step === i + 1 ? 'bg-blue-600 text-white' :
                  'bg-gray-100 text-gray-400'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === i + 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">What decision are you making?</h2>
            <p className="text-sm text-gray-500 mb-6">Be specific — the more context, the better the research.</p>

            <label className="text-sm text-gray-600 mb-2 block">Describe your decision</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-900 resize-none focus:outline-none focus:border-blue-400 mb-4"
              rows={3}
              placeholder="e.g. Which cloud provider should my startup use for a Node.js backend?"
              value={decision}
              onChange={e => setDecision(e.target.value)}
            />

            <label className="text-sm text-gray-600 mb-2 block">Try an example</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {examples.map(ex => (
                <button
                  key={ex}
                  onClick={() => setDecision(ex)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                >
                  {ex.length > 40 ? ex.slice(0, 40) + '...' : ex}
                </button>
              ))}
            </div>

            <label className="text-sm text-gray-600 mb-2 block">Who is this for?</label>
            <div className="flex flex-wrap gap-2 mb-8">
              {audiences.map(a => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition
                    ${audience === a ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  {a}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={decision.trim().length < 5}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">What matters most to you?</h2>
            <p className="text-sm text-gray-500 mb-6">Set how much each criterion matters. The AI weights its research accordingly.</p>

            <div className="space-y-2 mb-4">
              {criteria.map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <span className="flex-1 text-sm text-gray-800">{c.name}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(w => (
                      <button
                        key={w}
                        onClick={() => updateWeight(i, w)}
                        className={`w-3 h-3 rounded-full transition ${w <= c.weight ? 'bg-blue-600' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                  <button onClick={() => removeCriteria(i)} className="text-gray-300 hover:text-red-400 text-lg leading-none ml-1">×</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Add a criterion e.g. Cost, Scalability"
                value={newCriteria}
                onChange={e => setNewCriteria(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCriteria(newCriteria)}
              />
              <button
                onClick={() => addCriteria(newCriteria)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
              >
                + Add
              </button>
            </div>

            <label className="text-sm text-gray-600 mb-2 block">Quick add</label>
            <div className="flex flex-wrap gap-2 mb-8">
              {quickCriteria.map(qc => (
                <button
                  key={qc}
                  onClick={() => addCriteria(qc)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                >
                  {qc}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={criteria.length === 0}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Review & launch</h2>
            <p className="text-sm text-gray-500 mb-6">The AI agent will research, compare sources, detect conflicts, and score confidence.</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Decision</span>
                <span className="text-gray-900 font-medium text-right max-w-xs">{decision}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">For</span>
                <span className="text-blue-600 font-medium">{audience}</span>
              </div>
              <div className="flex justify-between text-sm items-start">
                <span className="text-gray-500">Criteria</span>
                <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                  {criteria.map(c => (
                    <span key={c.name} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {c.name} {'●'.repeat(c.weight)}{'○'.repeat(5 - c.weight)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-8">
              <p className="text-xs font-medium text-blue-700 mb-2">What the agent will do</p>
              {[
                'Extract your criteria and plan research steps',
                'Search and read multiple sources in parallel',
                'Detect conflicts between sources',
                'Score confidence and deliver a decision brief',
              ].map((step, i) => (
                <div key={i} className="flex gap-2 text-xs text-blue-600 mb-1">
                  <span className="font-bold">{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                Start research ↗
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}