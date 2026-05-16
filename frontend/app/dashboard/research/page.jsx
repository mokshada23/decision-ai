'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const steps = [
  { id: 1, label: 'Understanding your decision' },
  { id: 2, label: 'Researching sources' },
  { id: 3, label: 'Detecting conflicts' },
  { id: 4, label: 'Scoring confidence' },
  { id: 5, label: 'Generating report' },
  { id: 6, label: 'Finding resources' },
];

function ResearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
        ? 'https://decision-ai-production-89e7.up.railway.app/api/agent/run-guest'
        : `https://decision-ai-production-89e7.up.railway.app/api/agent/run/${decisionId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: decisionId === 'guest' ? JSON.stringify(guestData) : JSON.stringify({}),
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
                setCompletedSteps(prev => [...prev, data.step]);
                setCurrentStep(data.step + 1);
              }
            } catch { }
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
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://decision-ai-production-89e7.up.railway.app/api/agent/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, decisionId, report: result.report, recommendation: result.report.recommendation, messages: chatMessages }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (decisionId) runAgent();
  }, [decisionId]);

  return (
    <div style={{minHeight: '100vh', background: '#0A0A0A', fontFamily: '-apple-system, sans-serif'}}>

      {/* Header */}
      <div style={{padding: '16px 32px', borderBottom: '1px solid #1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0A0A0A', zIndex: 10}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: '24px', height: '24px', borderRadius: '6px', background: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{fontSize: '12px', fontWeight: '700', color: '#000'}}>d</span>
          </div>
          <span style={{fontSize: '14px', fontWeight: '500', color: '#F5F5F5'}}>decision-ai</span>
        </div>
        <button
          onClick={() => router.push('/')}
          style={{fontSize: '13px', color: '#888', background: 'transparent', border: '1px solid #222', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit'}}
        >
          ← New research
        </button>
      </div>

      {/* Content */}
      <div style={{maxWidth: '680px', margin: '0 auto', padding: '40px 24px 120px'}}>

        {/* Running state */}
{isRunning && (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 0'}}>
    <p style={{fontSize: '15px', color: '#555', marginBottom: '48px', textAlign: 'center'}}>Researching your decision...</p>
    <div style={{display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '400px'}}>
      {steps.map(s => (
        <div key={s.id} style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '500', flexShrink: 0,
            background: completedSteps.includes(s.id) ? '#38BDF8' : currentStep === s.id ? '#0A1F2E' : '#111111',
            color: completedSteps.includes(s.id) ? '#000' : currentStep === s.id ? '#38BDF8' : '#333',
            border: currentStep === s.id ? '1px solid #38BDF8' : '1px solid #1C1C1C',
            transition: 'all 0.3s',
          }}>
            {completedSteps.includes(s.id) ? '✓' : s.id}
          </div>
          <div style={{flex: 1}}>
            <span style={{fontSize: '15px', color: currentStep === s.id ? '#F5F5F5' : completedSteps.includes(s.id) ? '#555' : '#2A2A2A', transition: 'color 0.3s'}}>
              {s.label}
            </span>
            {currentStep === s.id && (
              <span style={{fontSize: '12px', color: '#38BDF8', marginLeft: '10px'}}>running...</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {/* Error */}
        {error && (
          <div style={{background: '#1A0A0A', border: '1px solid #3A1A1A', borderRadius: '12px', padding: '16px', marginBottom: '24px'}}>
            <p style={{fontSize: '13px', color: '#FF6B6B'}}>{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>

            {/* Winner card */}
            <div style={{background: '#0A1F2E', border: '1px solid #38BDF8', borderRadius: '16px', padding: '24px', textAlign: 'center'}}>
              <p style={{fontSize: '11px', color: '#38BDF8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Final verdict</p>
              {result.report.options.length > 0 && (
                <div style={{marginBottom: '12px'}}>
                  <span style={{fontSize: '28px', fontWeight: '600', color: '#F5F5F5'}}>
                    🏆 {result.report.options.sort((a, b) => b.score - a.score)[0].name}
                  </span>
                  <p style={{fontSize: '12px', color: '#38BDF8', marginTop: '4px'}}>
                    scored {result.report.options.sort((a, b) => b.score - a.score)[0].score}/100
                  </p>
                </div>
              )}
              <p style={{fontSize: '14px', color: '#CCCCCC', lineHeight: '1.6', marginBottom: '8px'}}>{result.report.recommendation}</p>
              <p style={{fontSize: '13px', color: '#666', lineHeight: '1.6'}}>{result.report.reasoning}</p>
            </div>

            {/* Options */}
            <div style={{background: '#111111', border: '1px solid #1C1C1C', borderRadius: '16px', padding: '20px'}}>
              <p style={{fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px'}}>Options compared</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {result.report.options.map((option, i) => (
                  <div key={i} style={{background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: '12px', padding: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                      <span style={{fontSize: '14px', fontWeight: '500', color: '#F5F5F5'}}>{option.name}</span>
                      <span style={{fontSize: '13px', color: '#38BDF8', fontWeight: '500'}}>{option.score}/100</span>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                      <div>
                        <p style={{fontSize: '11px', color: '#3D9E6B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Pros</p>
                        {option.pros.map((p, j) => (
                          <p key={j} style={{fontSize: '12px', color: '#888', marginBottom: '4px'}}>✓ {p}</p>
                        ))}
                      </div>
                      <div>
                        <p style={{fontSize: '11px', color: '#9E3D3D', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Cons</p>
                        {option.cons.map((c, j) => (
                          <p key={j} style={{fontSize: '12px', color: '#888', marginBottom: '4px'}}>✗ {c}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence scores */}
            <div style={{background: '#111111', border: '1px solid #1C1C1C', borderRadius: '16px', padding: '20px'}}>
              <p style={{fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px'}}>Confidence scores</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
                {result.scores.scores.map((s, i) => (
                  <div key={i}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                      <span style={{fontSize: '13px', color: '#CCCCCC'}}>{s.criterion}</span>
                      <span style={{fontSize: '13px', color: '#38BDF8', fontWeight: '500'}}>{s.score}%</span>
                    </div>
                    <div style={{background: '#1A1A1A', borderRadius: '4px', height: '3px', overflow: 'hidden'}}>
                      <div style={{background: '#38BDF8', height: '100%', width: `${s.score}%`, borderRadius: '4px'}} />
                    </div>
                    <p style={{fontSize: '11px', color: '#444', marginTop: '4px'}}>{s.reason}</p>
                  </div>
                ))}
                <div style={{borderTop: '1px solid #1C1C1C', paddingTop: '12px', display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{fontSize: '13px', color: '#888'}}>Overall confidence</span>
                  <span style={{fontSize: '14px', color: '#38BDF8', fontWeight: '600'}}>{result.scores.overallConfidence}%</span>
                </div>
              </div>
            </div>

            {/* Conflicts */}
            {result.conflicts.hasConflicts && (
              <div style={{background: '#1A1500', border: '1px solid #3A3000', borderRadius: '16px', padding: '20px'}}>
                <p style={{fontSize: '12px', color: '#C8A800', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px'}}>⚠ Conflicts detected</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {result.conflicts.conflicts.map((c, i) => (
                    <p key={i} style={{fontSize: '12px', color: '#888', lineHeight: '1.5'}}>• {c}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Next steps */}
            <div style={{background: '#111111', border: '1px solid #1C1C1C', borderRadius: '16px', padding: '20px'}}>
              <p style={{fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px'}}>Next steps</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {result.report.nextSteps.map((step, i) => (
                  <div key={i} style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
                    <span style={{fontSize: '12px', color: '#38BDF8', fontWeight: '600', flexShrink: 0, marginTop: '1px'}}>{i + 1}.</span>
                    <span style={{fontSize: '13px', color: '#888', lineHeight: '1.5'}}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            {result.resources && (
              <div style={{background: '#111111', border: '1px solid #1C1C1C', borderRadius: '16px', padding: '20px'}}>
                <p style={{fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px'}}>Go deeper</p>

                {result.resources.startHere && (
                  <div style={{marginBottom: '20px'}}>
                    <p style={{fontSize: '11px', color: '#3D9E6B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px'}}>Start here</p>
                    <a href={result.resources.startHere.url} target="_blank" rel="noopener noreferrer"
                      style={{display: 'flex', gap: '12px', padding: '14px', background: '#0D1A0D', border: '1px solid #1C3A1C', borderRadius: '12px', textDecoration: 'none'}}>
                      <div style={{width: '36px', height: '36px', background: '#1C4A1C', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                        <span>⭐</span>
                      </div>
                      <div>
                        <p style={{fontSize: '13px', fontWeight: '500', color: '#F5F5F5', marginBottom: '4px'}}>{result.resources.startHere.name}</p>
                        <p style={{fontSize: '12px', color: '#666', lineHeight: '1.4'}}>{result.resources.startHere.description}</p>
                      </div>
                    </a>
                  </div>
                )}

                {result.resources.websites?.length > 0 && (
                  <div style={{marginBottom: '20px'}}>
                    <p style={{fontSize: '11px', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px'}}>Websites</p>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      {result.resources.websites.map((site, i) => (
                        <a key={i} href={site.url} target="_blank" rel="noopener noreferrer"
                          style={{display: 'flex', gap: '12px', padding: '12px 14px', background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: '10px', textDecoration: 'none'}}>
                          <div style={{width: '28px', height: '28px', background: '#0A1F2E', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                            <span style={{fontSize: '11px', fontWeight: '600', color: '#38BDF8'}}>W</span>
                          </div>
                          <div>
                            <p style={{fontSize: '13px', color: '#CCCCCC', marginBottom: '2px'}}>{site.name}</p>
                            <p style={{fontSize: '11px', color: '#555'}}>{site.description}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {result.resources.youtube?.length > 0 && (
                  <div style={{marginBottom: '20px'}}>
                    <p style={{fontSize: '11px', color: '#E05555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px'}}>YouTube</p>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      {result.resources.youtube.map((yt, i) => (
                        <a key={i} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(yt.searchQuery)}`} target="_blank" rel="noopener noreferrer"
                          style={{display: 'flex', gap: '12px', padding: '12px 14px', background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: '10px', textDecoration: 'none'}}>
                          <div style={{width: '28px', height: '28px', background: '#2A0A0A', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                            <span style={{fontSize: '11px', fontWeight: '600', color: '#E05555'}}>YT</span>
                          </div>
                          <div>
                            <p style={{fontSize: '13px', color: '#CCCCCC', marginBottom: '2px'}}>"{yt.searchQuery}"</p>
                            <p style={{fontSize: '11px', color: '#555'}}>{yt.description}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {result.resources.communities?.length > 0 && (
                  <div>
                    <p style={{fontSize: '11px', color: '#9B6BDF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px'}}>Communities</p>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      {result.resources.communities.map((com, i) => (
                        <a key={i} href={com.url} target="_blank" rel="noopener noreferrer"
                          style={{display: 'flex', gap: '12px', padding: '12px 14px', background: '#0D0D0D', border: '1px solid #1C1C1C', borderRadius: '10px', textDecoration: 'none'}}>
                          <div style={{width: '28px', height: '28px', background: '#1A0D2A', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                            <span style={{fontSize: '11px', fontWeight: '600', color: '#9B6BDF'}}>C</span>
                          </div>
                          <div>
                            <p style={{fontSize: '13px', color: '#CCCCCC', marginBottom: '2px'}}>{com.name}</p>
                            <p style={{fontSize: '11px', color: '#555'}}>{com.description}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Continue Chat */}
            <div style={{background: '#111111', border: '1px solid #1C1C1C', borderRadius: '16px', padding: '20px'}}>
              <p style={{fontSize: '12px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px'}}>Continue the conversation</p>
              <div style={{maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px'}}>
                {chatMessages.length === 0 && (
                  <p style={{fontSize: '13px', color: '#333', textAlign: 'center', padding: '20px 0'}}>Ask any follow up question about your decision</p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
                    <div style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.5',
                      background: msg.role === 'user' ? '#38BDF8' : '#1A1A1A',
                      color: msg.role === 'user' ? '#000' : '#CCCCCC',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                    <div style={{background: '#1A1A1A', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', color: '#555'}}>
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
              <div style={{display: 'flex', gap: '8px'}}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask a follow up question..."
                  style={{
                    flex: 1, padding: '10px 14px', background: '#0D0D0D',
                    border: '1px solid #222', borderRadius: '10px', fontSize: '13px',
                    color: '#F5F5F5', outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    padding: '10px 16px', background: '#38BDF8', border: 'none',
                    borderRadius: '10px', fontSize: '13px', fontWeight: '500',
                    color: '#000', cursor: 'pointer', fontFamily: 'inherit',
                    opacity: chatLoading ? 0.5 : 1,
                  }}
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

export default function ResearchPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <p style={{color: '#555', fontSize: '14px'}}>Loading...</p>
      </div>
    }>
      <ResearchPageContent />
    </Suspense>
  );
}
