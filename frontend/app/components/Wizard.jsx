'use client';

import { useState } from 'react';
import { createDecision } from '../lib/api';

const examples = [
  'Which cloud provider should my startup use?',
  'PostgreSQL vs MongoDB for a real-time app?',
  'Which laptop for video editing under ₹1,50,000?',
  'Which CRM for a 10-person sales team?',
];

const quickCriteria = ['Cost', 'Performance', 'Ease of use', 'Scalability', 'Support', 'Security'];

export default function Wizard() {
  const [step, setStep] = useState(1);
  const [decision, setDecision] = useState('');
  const [criteria, setCriteria] = useState([
    { name: 'Cost', weight: 3 },
    { name: 'Performance', weight: 4 },
  ]);
  const [newCriteria, setNewCriteria] = useState('');
  const [loading, setLoading] = useState(false);

  const addCriteria = (name) => {
    if (!name.trim()) return;
    if (criteria.find(c => c.name.toLowerCase() === name.toLowerCase())) return;
    setCriteria([...criteria, { name, weight: 3 }]);
    setNewCriteria('');
  };

  const updateWeight = (index, weight) => {
    setCriteria(criteria.map((c, i) => i === index ? { ...c, weight } : c));
  };

  const removeCriteria = (index) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = { decision, audience: 'Just me', criteria };
      const token = localStorage.getItem('token');
      if (token) {
        const response = await createDecision(data);
        const decisionId = response.data.decision.id;
        window.location.href = `/dashboard/research?id=${decisionId}`;
      } else {
        localStorage.setItem('guestDecision', JSON.stringify({ id: 'guest', ...data }));
        window.location.href = `/dashboard/research?id=guest`;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{width: '100%', maxWidth: '580px'}}>

      {step === 1 && (
        <div>
          <div style={{position: 'relative', marginBottom: '16px'}}>
            <textarea
              style={{
                width: '100%',
                minHeight: '120px',
                background: '#111111',
                border: '1px solid #2A2A2A',
                borderRadius: '16px',
                padding: '20px',
                fontSize: '15px',
                color: '#F5F5F5',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: '1.6',
                fontFamily: 'inherit',
              }}
              placeholder="What decision are you trying to make?"
              value={decision}
              onChange={e => setDecision(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && decision.trim().length >= 5) {
                  e.preventDefault();
                  setStep(2);
                }
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#38BDF8'}
              onBlur={e => e.currentTarget.style.borderColor = '#2A2A2A'}
            />
          </div>

          <button
  onClick={() => decision.trim().length >= 5 && setStep(2)}
  style={{
    width: '100%',
    padding: '14px',
    background: decision.trim().length >= 5 ? '#38BDF8' : '#1A1A1A',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: decision.trim().length >= 5 ? '#000' : '#444',
    cursor: decision.trim().length >= 5 ? 'pointer' : 'not-allowed',
    fontFamily: 'inherit',
    marginBottom: '16px',
    transition: 'all 0.2s',
  }}
>
  Set criteria →
</button>

          <p style={{fontSize: '12px', color: '#444', marginBottom: '10px'}}>Try an example:</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
            {examples.map(ex => (
              <button
                key={ex}
                onClick={() => { setDecision(ex); setStep(2); }}
                style={{
                  fontSize: '12px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'transparent',
                  border: '1px solid #222222',
                  color: '#666666',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.color = '#38BDF8'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#666666'; }}
              >
                {ex.length > 38 ? ex.slice(0, 38) + '...' : ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{background: '#111111', border: '1px solid #222222', borderRadius: '20px', padding: '28px'}}>
          <p style={{fontSize: '13px', color: '#555', marginBottom: '6px'}}>Deciding:</p>
          <p style={{fontSize: '14px', color: '#CCCCCC', marginBottom: '24px', lineHeight: '1.5'}}>"{decision}"</p>
          <p style={{fontSize: '14px', fontWeight: '500', color: '#F5F5F5', marginBottom: '16px'}}>What matters most?</p>

          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px'}}>
            {criteria.map((c, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#1A1A1A', borderRadius: '12px'}}>
                <span style={{flex: 1, fontSize: '14px', color: '#F5F5F5'}}>{c.name}</span>
                <div style={{display: 'flex', gap: '5px'}}>
                  {[1,2,3,4,5].map(w => (
                    <button key={w} onClick={() => updateWeight(i, w)}
                      style={{width: '10px', height: '10px', borderRadius: '50%', border: 'none', background: w <= c.weight ? '#38BDF8' : '#333333', cursor: 'pointer', padding: 0}}
                    />
                  ))}
                </div>
                <button onClick={() => removeCriteria(i)}
                  style={{background: 'none', border: 'none', color: '#444444', fontSize: '18px', cursor: 'pointer', padding: '0 4px', lineHeight: 1}}
                >×</button>
              </div>
            ))}
          </div>

          <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
            <input type="text" value={newCriteria}
              onChange={e => setNewCriteria(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCriteria(newCriteria)}
              placeholder="Add a criterion..."
              style={{flex: 1, padding: '10px 14px', background: '#1A1A1A', border: '1px solid #222222', borderRadius: '10px', fontSize: '13px', color: '#F5F5F5', outline: 'none', fontFamily: 'inherit'}}
            />
            <button onClick={() => addCriteria(newCriteria)}
              style={{padding: '10px 16px', background: '#1A1A1A', border: '1px solid #222222', borderRadius: '10px', fontSize: '13px', color: '#888888', cursor: 'pointer', fontFamily: 'inherit'}}
            >+ Add</button>
          </div>

          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px'}}>
            {quickCriteria.map(qc => (
              <button key={qc} onClick={() => addCriteria(qc)}
                style={{fontSize: '12px', padding: '5px 12px', borderRadius: '20px', background: 'transparent', border: '1px solid #222222', color: '#666666', cursor: 'pointer', fontFamily: 'inherit'}}
              >{qc}</button>
            ))}
          </div>

          <div style={{display: 'flex', gap: '10px'}}>
            <button onClick={() => setStep(1)}
              style={{flex: 1, padding: '12px', background: 'transparent', border: '1px solid #222222', borderRadius: '12px', fontSize: '14px', color: '#888888', cursor: 'pointer', fontFamily: 'inherit'}}
            >← Back</button>
            <button onClick={handleSubmit} disabled={loading || criteria.length === 0}
              style={{flex: 1, padding: '12px', background: '#38BDF8', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '500', color: '#000000', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1}}
            >{loading ? 'Starting...' : 'Start research ↗'}</button>
          </div>
        </div>
      )}
    </div>
  );
}