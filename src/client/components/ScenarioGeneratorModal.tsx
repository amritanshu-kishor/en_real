import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { ApiService } from '../services/api';
import { Scenario } from '../types';

interface ScenarioGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioCreated: (scenario: Scenario) => void;
}

export const ScenarioGeneratorModal: React.FC<ScenarioGeneratorModalProps> = ({
  isOpen,
  onClose,
  onScenarioCreated
}) => {
  const [situation, setSituation] = useState('');
  const [difficulty, setDifficulty] = useState<'Foundational' | 'Fluid' | 'High Stakes'>('Fluid');
  const [characterRole, setCharacterRole] = useState('Senior Operations Director');
  const [objective, setObjective] = useState('');
  const [weaknessTarget, setWeaknessTarget] = useState('Persuasive Negotiation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation.trim()) {
      setError('Please provide a realistic situation or challenge.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const scenario = await ApiService.generateCustomScenario({
        situation: situation.trim(),
        difficulty,
        character_role: characterRole.trim(),
        objective: objective.trim() || undefined,
        weakness_target: weaknessTarget
      });

      onScenarioCreated(scenario);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to generate scenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(33, 37, 41, 0.45)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      <div className="glass-modal" style={{ maxWidth: '540px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              [ Scenario Authoring ]
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
              Custom Simulation
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--bg-surface-muted)',
            border: '1px solid var(--border-base)',
            color: 'var(--text-primary)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-xs)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.84rem'
          }}>
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Situation & Stakes
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="e.g., You rented a vehicle in Zurich and returned it with a pre-existing scratch. The branch manager is charging a 2,400 CHF surcharge without reviewing intake logs."
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              required
            />
          </div>

          <div className="grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Difficulty Tier
              </label>
              <select
                className="input-field select-field"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
              >
                <option value="Foundational">Foundational</option>
                <option value="Fluid">Fluid (Standard Pressure)</option>
                <option value="High Stakes">High Stakes</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Counterpart Role
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Branch Manager Keller"
                value={characterRole}
                onChange={(e) => setCharacterRole(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Rhetorical Target
            </label>
            <select
              className="input-field select-field"
              value={weaknessTarget}
              onChange={(e) => setWeaknessTarget(e.target.value)}
            >
              <option value="Persuasive Negotiation">Persuasive Leverage & Stance</option>
              <option value="Spontaneous Complications">Composure under Sudden Constraints</option>
              <option value="Diplomatic Conflict Resolution">Diplomatic De-escalation</option>
              <option value="Think in English Collocations">Natural Native Collocations</option>
              <option value="High-Register Vocabulary">High-Register Executive Vocabulary</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Your Objective (Optional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., Audit intake photos and obtain immediate fee reversal."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating...
                </>
              ) : (
                'Generate Simulation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
