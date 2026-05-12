'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const steps = [
  { id: 1, label: 'Understanding your decision' },
  { id: 2, label: 'Researching sources' },
  { id: 3, label: 'Detecting conflicts' },
  { id: 4, label: 'Scoring confidence' },
  { id: 5, label: 'Generating report' },
  { id: 6, label: 'Finding resources to go deeper' },
];

export default function ResearchPage() {
  const searchParams = useSearchParams();
  const decisionId = searchParams.get('id');

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const runAgent = async () => {
    setIsRunning(true);
    setCurrentStep(1);
    setCompletedSteps([]);
    setResult(null);
    setError(null);

    const token = localStorage.getItem('token');

    try {
      let guestData = null;

      if (decisionId === 'guest') {
        guestData = JSON.parse(localStorage.getItem('guestDecision'));
        if (!guestData) {
          setError('No decision found. Please start again.');
          setIsRunning(false);
          return;
        }
      }

      const url = decisionId === 'guest'
        ? 'http://localhost:5000/api/agent/run-guest'
        : `http://localhost:5000/api/agent/run/${decisionId}`;

      const body = decisionId === 'guest'
        ? JSON.stringify(guestData)
        : JSON.stringify({});

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.step === 'complete') {
                setResult(data.result);
                setCurrentStep(0);
                setIsRunning(false);
              } else if (data.step === 'error') {
                setError(data.message);
                setIsRunning(false);
              } else if (data.status === 'done') {
                setCompletedSteps((prev) => [...prev, data.step]);
                setCurrentStep(data.step + 1);
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setIsRunning(false);
    }
  };
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage = { role: 'user', content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/agent/chat', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatInput,
          decisionId,
          report: result.report,
          recommendation: result.report.recommendation,
          messages: chatMessages,
        }),
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (decisionId) runAgent();
  }, [decisionId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">AI Research Agent</h1>
        <p className="text-sm text-gray-500 mb-8">Analyzing your decision in real time</p>

        {/* Steps progress */}
        {isRunning && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Agent progress</h2>
            <div className="space-y-3">
              {steps.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${completedSteps.includes(s.id) ? 'bg-green-500 text-white' : currentStep === s.id ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                    {completedSteps.includes(s.id) ? '✓' : s.id}
                  </div>
                  <span className={`text-sm ${currentStep === s.id ? 'text-gray-900 font-medium' : completedSteps.includes(s.id) ? 'text-gray-500' : 'text-gray-300'}`}>
                    {s.label}
                  </span>
                  {currentStep === s.id && (
                    <span className="text-xs text-blue-500 animate-pulse">running...</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6">

            {/* Recommendation */}
            <div className="bg-blue-600 rounded-2xl p-6 text-white">
              <p className="text-xs font-medium uppercase tracking-wider mb-2 opacity-75">Final verdict</p>
              {result.report.options.length > 0 && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-white text-blue-600 text-sm font-bold px-4 py-1.5 rounded-full">
                    🏆 {result.report.options.sort((a, b) => b.score - a.score)[0].name}
                  </span>
                  <span className="text-white text-sm opacity-75">
                    scored {result.report.options.sort((a, b) => b.score - a.score)[0].score}/100
                  </span>
                </div>
              )}
              <p className="text-lg font-semibold mb-2">{result.report.recommendation}</p>
              <p className="text-sm opacity-80">{result.report.reasoning}</p>
            </div>

            {/* Options */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Options compared</h2>
              <div className="grid grid-cols-1 gap-4">
                {result.report.options.map((option, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-gray-900">{option.name}</span>
                      <span className="text-sm font-semibold text-blue-600">{option.score}/100</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-green-600 font-medium mb-1">Pros</p>
                        {option.pros.map((p, j) => (
                          <p key={j} className="text-xs text-gray-600 mb-0.5">✓ {p}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs text-red-500 font-medium mb-1">Cons</p>
                        {option.cons.map((c, j) => (
                          <p key={j} className="text-xs text-gray-600 mb-0.5">✗ {c}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence scores */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Confidence scores</h2>
              <div className="space-y-3">
                {result.scores.scores.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{s.criterion}</span>
                      <span className="font-medium text-gray-900">{s.score}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${s.score}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{s.reason}</p>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Overall confidence</span>
                    <span className="font-semibold text-blue-600">{result.scores.overallConfidence}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Conflicts */}
            {result.conflicts.hasConflicts && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-amber-700 mb-3">⚠ Conflicts detected</h2>
                <div className="space-y-2">
                  {result.conflicts.conflicts.map((c, i) => (
                    <p key={i} className="text-xs text-amber-700">• {c}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Next steps */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Next steps</h2>
              <div className="space-y-2">
                {result.report.nextSteps.map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="font-semibold text-blue-600 flex-shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            {result.resources && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-medium text-gray-700 mb-6">Go deeper</h2>

                {result.resources.startHere && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-3">Start here</p>
                    <a href={result.resources.startHere.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition group">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg">⭐</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition">{result.resources.startHere.name}</p>
                          <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">{result.resources.startHere.type}</span>
                        </div>
                        <p className="text-xs text-gray-600">{result.resources.startHere.description}</p>
                      </div>
                    </a>
                  </div>
                )}

                {result.resources.websites?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-3">Websites</p>
                    <div className="space-y-3">
                      {result.resources.websites.map((site, i) => (
                        <a key={i} href={site.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition group">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 text-xs font-bold">W</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition">{site.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{site.description}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {result.resources.youtube?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-red-500 uppercase tracking-wider mb-3">YouTube searches</p>
                    <div className="space-y-2">
                      {result.resources.youtube.map((yt, i) => (
                        <a key={i} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(yt.searchQuery)}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50 transition group">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-red-500 text-xs font-bold">YT</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-red-500 transition">"{yt.searchQuery}"</p>
                            <p className="text-xs text-gray-500 mt-0.5">{yt.description}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {result.resources.communities?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-3">Communities</p>
                    <div className="space-y-2">
                      {result.resources.communities.map((com, i) => (
                        <a key={i} href={com.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition group">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-purple-600 text-xs font-bold">C</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-purple-600 transition">{com.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{com.description}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Continue Chat */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Continue the conversation</h2>
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Ask any follow up question about your decision</p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2.5 rounded-2xl">
                      <span className="text-xs text-gray-400 animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask a follow up question..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}