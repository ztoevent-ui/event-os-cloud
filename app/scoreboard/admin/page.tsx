"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Predefined scores logic
const SCORE_RULES = {
  'A': [100, 75, 50, 25],
  'B_team': [60, 40, 20, 10],
  'B_ind': [30, 20, 10, 5],
  'C': [200, 0, 0, 0]
};

export default function AdminScoreboard() {
  const [teams, setTeams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedRank, setSelectedRank] = useState('0'); // index 0 = 1st

  useEffect(() => {
    supabase.from('teams').select('*').then(res => res.data && setTeams(res.data));
    supabase.from('event_categories').select('*').then(res => res.data && setCategories(res.data));
  }, []);

  const currentCat = categories.find(c => c.id === selectedCat);
  const possibleScores = currentCat ? SCORE_RULES[currentCat.event_type as keyof typeof SCORE_RULES] : [];

  const handleScoreSubmit = async () => {
    if (!selectedCat || !selectedTeam || !currentCat) return;
    setLoading(true);
    
    const scoreToAward = possibleScores[parseInt(selectedRank)];
    
    const { error } = await supabase.from('game_scores').insert([{
      team_id: selectedTeam,
      category_id: selectedCat,
      score: scoreToAward
    }]);

    setLoading(false);
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Score added successfully!");
    }
  };

  const handleResetScores = async () => {
    if (confirm("Reset ALL scores? This cannot be undone.")) {
      const { error } = await supabase.from('game_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!error) alert("Scores reset!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black mb-8 text-gray-900">Score Entry Admin</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">1. Select Event Category</label>
            <select 
              value={selectedCat} 
              onChange={e => setSelectedCat(e.target.value)}
              className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-black outline-none"
            >
              <option value="">-- Choose Category --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.event_name} (Type {c.event_type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">2. Select Team</label>
            <div className="grid grid-cols-2 gap-3">
              {teams.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeam(t.id)}
                  className={`p-4 rounded-lg font-bold border-2 transition-all ${selectedTeam === t.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`}
                  style={selectedTeam === t.id ? { backgroundColor: t.color_hex, borderColor: t.color_hex } : {}}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {currentCat && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">3. Rank/Position Awarded</label>
              <div className="grid grid-cols-4 gap-2">
                {possibleScores.map((score, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedRank(idx.toString())}
                    className={`p-3 rounded-lg font-bold border-2 transition-all ${selectedRank === idx.toString() ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-700'}`}
                  >
                    {idx + 1}{['st','nd','rd','th'][idx]} <br/>
                    <span className="text-sm opacity-80">+{score} pts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6 border-t mt-8">
            <button
              onClick={handleScoreSubmit}
              disabled={loading || !selectedCat || !selectedTeam}
              className="w-full py-4 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xl transition-all"
            >
              {loading ? 'Submitting...' : 'AWARD SCORE'}
            </button>
          </div>

          <div className="pt-12 text-center">
            <button onClick={handleResetScores} className="text-sm text-red-500 hover:underline">
              Danger: Reset All Scores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
