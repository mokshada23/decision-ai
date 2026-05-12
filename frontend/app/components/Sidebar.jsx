'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await fetch('http://localhost:5000/api/decisions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDecisions(data.decisions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewResearch = () => {
    router.push('/');
  };

  const handleDecisionClick = (id) => {
    router.push(`/dashboard/research?id=${id}`);
  };

  const truncate = (text, length = 40) => {
    return text.length > length ? text.slice(0, length) + '...' : text;
  };

  return (
    <div className="w-64 h-screen bg-gray-900 border-r border-gray-800 flex flex-col fixed left-0 top-0">

      {/* Logo */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-white font-semibold text-lg">TrueCompare</h1>
        <p className="text-gray-500 text-xs mt-0.5">AI Decision Research</p>
      </div>

      {/* New Research Button */}
      <div className="p-3">
        <button
          onClick={handleNewResearch}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition flex items-center gap-2"
        >
          <span>+</span>
          <span>New Research</span>
        </button>
      </div>

      {/* Past Decisions */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-2 px-2">
          Recent decisions
        </p>

        {loading && (
          <p className="text-gray-600 text-xs px-2">Loading...</p>
        )}

        {!loading && decisions.length === 0 && (
          <p className="text-gray-600 text-xs px-2">No decisions yet</p>
        )}

        <div className="space-y-1">
          {decisions.map((decision) => (
            <button
              key={decision.id}
              onClick={() => handleDecisionClick(decision.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition
                ${pathname.includes(decision.id)
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <p className="text-xs leading-relaxed">
                {truncate(decision.decision)}
              </p>
              <p className="text-gray-600 text-xs mt-0.5">
                {new Date(decision.created_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom links */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <button
          onClick={() => router.push('/dashboard/evals')}
          className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition"
        >
          📊 Eval Dashboard
        </button>
        <button
          onClick={() => router.push('/dashboard/profile')}
          className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition"
        >
          👤 Profile
        </button>
      </div>

    </div>
  );
}