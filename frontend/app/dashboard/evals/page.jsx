'use client';

import { useState, useEffect } from 'react';

export default function EvalsPage() {
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvals();
  }, []);

  const fetchEvals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/agent/evals/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setEvals(data.evals || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getBarColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const averageScore = evals.length > 0
    ? Math.round(evals.reduce((sum, e) => sum + e.overall_score, 0) / evals.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">AI Eval Dashboard</h1>
        <p className="text-sm text-gray-500 mb-8">Measuring the quality of your AI research outputs over time</p>

        {loading && (
          <div className="text-center py-12 text-gray-400">Loading evals...</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && evals.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No evals yet. Run a research session first.
          </div>
        )}

        {!loading && evals.length > 0 && (
          <div className="space-y-6">

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-500 mb-1">Total sessions</p>
                <p className="text-3xl font-semibold text-gray-900">{evals.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-500 mb-1">Average quality score</p>
                <p className={`text-3xl font-semibold ${getScoreColor(averageScore)}`}>{averageScore}%</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs text-gray-500 mb-1">Best score</p>
                <p className="text-3xl font-semibold text-green-600">
                  {Math.max(...evals.map(e => e.overall_score))}%
                </p>
              </div>
            </div>

            {/* Eval list */}
            <div className="space-y-4">
              {evals.map((evalItem) => (
                <div key={evalItem.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">{evalItem.decision}</p>
                      <p className="text-xs text-gray-400">{new Date(evalItem.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Overall score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(evalItem.overall_score)}`}>
                        {evalItem.overall_score}%
                      </p>
                    </div>
                  </div>

                  {/* Score bars */}
                  <div className="space-y-2 mb-4">
                    {[
                      { label: 'Recommendation', score: evalItem.recommendation_score },
                      { label: 'Options compared', score: evalItem.options_score },
                      { label: 'Confidence scoring', score: evalItem.confidence_score },
                      { label: 'Conflict detection', score: evalItem.conflicts_score },
                      { label: 'Next steps', score: evalItem.next_steps_score },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">{metric.label}</span>
                          <span className={`font-medium ${getScoreColor(metric.score)}`}>{metric.score}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${getBarColor(metric.score)}`}
                            style={{ width: `${metric.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Feedback */}
                  {evalItem.feedback && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                      <div>
                        <p className="text-xs font-medium text-green-600 mb-2">Strengths</p>
                        {evalItem.feedback.strengths?.map((s, i) => (
                          <p key={i} className="text-xs text-gray-500 mb-1">✓ {s}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-amber-500 mb-2">Improvements</p>
                        {evalItem.feedback.improvements?.map((imp, i) => (
                          <p key={i} className="text-xs text-gray-500 mb-1">→ {imp}</p>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}