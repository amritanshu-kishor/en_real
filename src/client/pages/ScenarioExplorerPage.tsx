import React, { useEffect, useState } from 'react';
import { Plus, ArrowRight, Compass } from 'lucide-react';
import { ApiService } from '../services/api';
import { Scenario } from '../types';
import { ScenarioGeneratorModal } from '../components/ScenarioGeneratorModal';

interface ScenarioExplorerPageProps {
  onSelectScenario: (scenarioId: string) => void;
}

export const ScenarioExplorerPage: React.FC<ScenarioExplorerPageProps> = ({ onSelectScenario }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const categories = [
    'All',
    'Travel & Crisis',
    'Workplace & Negotiation',
    'Hospitality & Dispute',
    'College & Ethics',
    'Conflict Resolution',
    'Emergency & Triage',
    'Debate & Persuasion',
    'Presentation & Pitch'
  ];

  const difficulties = ['All', 'Foundational', 'Fluid', 'High Stakes'];

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getScenarios({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        difficulty: selectedDifficulty === 'All' ? undefined : selectedDifficulty
      });
      setScenarios(data);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenarios();
  }, [selectedCategory, selectedDifficulty]);

  const handleScenarioCreated = (newScenario: Scenario) => {
    setScenarios([newScenario, ...scenarios]);
    onSelectScenario(newScenario.id);
  };

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '24px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
            Scenario Catalogue — {scenarios.length} Arenas
          </div>
          <h1 style={{ fontSize: '2.6rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#F5F5F0', lineHeight: 1.05 }}>
            Scenario Explorer
          </h1>
          <p style={{ color: '#8C8C8C', fontSize: '0.94rem', maxWidth: '560px', marginTop: '0.5rem', lineHeight: 1.65 }}>
            High-friction conversational environments. Step into active negotiations, boardroom debates, and emergency dispatches.
          </p>
        </div>

        <button
          onClick={() => setIsGeneratorOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={14} />
          <span>New Scenario</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        borderRadius: 0,
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        {/* Category filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  color: isSelected ? '#0C0C0C' : '#555555',
                  background: isSelected ? '#FF5C2B' : 'transparent',
                  border: '1px solid',
                  borderColor: isSelected ? '#FF5C2B' : '#2A2A2A',
                  borderRadius: 0,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Difficulty filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingTop: '0.75rem', borderTop: '1px solid #1E1E1E' }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, flexShrink: 0 }}>
            Difficulty
          </span>
          {difficulties.map((diff) => {
            const isSelected = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                style={{
                  padding: '0.22rem 0.6rem',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  color: isSelected ? '#0C0C0C' : '#555555',
                  background: isSelected ? '#F5F5F0' : 'transparent',
                  border: '1px solid',
                  borderColor: isSelected ? '#F5F5F0' : '#2A2A2A',
                  borderRadius: 0,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {diff}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: '#555555', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
          <div style={{ width: '24px', height: '24px', border: '1px solid #2A2A2A', borderTopColor: '#FF5C2B', borderRadius: 0, margin: '0 auto 1rem auto', animation: 'spin 1s linear infinite' }} />
          Loading scenarios...
        </div>
      ) : scenarios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#555555', background: '#111111', border: '1px solid #2A2A2A', fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
          No scenarios match the selected filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid #2A2A2A', borderLeft: '1px solid #2A2A2A' }}>
          {scenarios.map((sc) => {
            const isHighStakes = sc.difficulty === 'High Stakes';
            return (
              <div
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.75rem',
                  borderRight: '1px solid #2A2A2A',
                  borderBottom: '1px solid #2A2A2A',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#141414'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                {/* Accent bar */}
                <div style={{ height: '2px', background: isHighStakes ? '#F5F5F0' : '#FF5C2B', width: '36px', marginBottom: '1.25rem' }} />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                      {sc.category}
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      border: `1px solid ${isHighStakes ? '#555555' : '#2A2A2A'}`,
                      color: isHighStakes ? '#F5F5F0' : '#8C8C8C',
                      letterSpacing: '0.04em'
                    }}>
                      {sc.difficulty}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: '#F5F5F0',
                    marginBottom: '0.6rem',
                    lineHeight: 1.25,
                    letterSpacing: '-0.02em'
                  }}>
                    {sc.title}
                  </h3>

                  <p style={{ fontSize: '0.84rem', color: '#8C8C8C', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    {sc.context}
                  </p>

                  {/* Counterpart */}
                  <div style={{ borderTop: '1px solid #1E1E1E', paddingTop: '0.85rem', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Counterpart</div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#F5F5F0' }}>{sc.ai_character_name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#555555', fontFamily: 'var(--font-mono)' }}>{sc.ai_character_role}</div>
                  </div>

                  {/* Objective */}
                  <div style={{ borderLeft: '2px solid #FF5C2B', paddingLeft: '0.75rem' }}>
                    <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#FF5C2B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Objective</div>
                    <div style={{ fontSize: '0.8rem', color: '#8C8C8C', lineHeight: 1.5 }}>{sc.objective}</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '0.85rem', borderTop: '1px solid #1E1E1E' }}>
                  <span style={{ color: '#555555', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {sc.complication_triggers?.length || 2} constraints
                  </span>
                  <span style={{ color: '#FF5C2B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Enter <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generator Modal */}
      <ScenarioGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onScenarioCreated={handleScenarioCreated}
      />
    </div>
  );
};
