import React, { useState } from 'react';
import { HeatmapPoint } from '../types';

interface TimelineHeatmapProps {
  timeline: HeatmapPoint[];
}

export const TimelineHeatmap: React.FC<TimelineHeatmapProps> = ({ timeline }) => {
  const [selectedTurn, setSelectedTurn] = useState<number>(timeline[0]?.turn || 1);

  if (!timeline || timeline.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No communication turns recorded.</div>;
  }

  const current = timeline.find(t => t.turn === selectedTurn) || timeline[0];

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #2A2A2A',
      padding: '1.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '20px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
            Turn-by-Turn Stream
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#F5F5F0' }}>
            Turn-by-Turn Telemetry Stream
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#8C8C8C', marginTop: '0.15rem' }}>
            Rhetorical and fluency trajectory across the simulation.
          </p>
        </div>
        <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase' }}>
          CLICK TURN TO INSPECT
        </span>
      </div>

      {/* Heatmap Bar Cells */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${timeline.length}, minmax(0, 1fr))`,
        gap: '0.35rem',
        background: '#0E0E0E',
        border: '1px solid #2A2A2A',
        padding: '0.75rem'
      }}>
        {timeline.map((point) => {
          const avg = Math.round((point.clarityScore + point.confidenceScore + point.persuasionScore + point.fluencyScore) / 4);
          const isSelected = point.turn === selectedTurn;
          const barHeight = Math.max(8, Math.round((avg / 100) * 32));

          return (
            <div
              key={`turn-${point.turn}`}
              onClick={() => setSelectedTurn(point.turn)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                padding: '0.35rem 0.2rem',
                background: isSelected ? 'rgba(255, 92, 43, 0.12)' : 'transparent',
                border: isSelected ? '1px solid #FF5C2B' : '1px solid transparent',
                transition: 'all 0.12s ease'
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${barHeight}px`,
                  background: isSelected ? '#FF5C2B' : '#2A2A2A'
                }}
              />
              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                color: isSelected ? '#FF5C2B' : '#555555',
                fontWeight: 700
              }}>
                T{point.turn}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Turn Detail */}
      {current && (
        <div style={{
          background: '#0E0E0E',
          border: '1px solid #2A2A2A',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#FF5C2B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Turn {current.turn} Inspection
            </span>
            <span style={{ fontSize: '0.88rem', color: '#8C8C8C', fontStyle: 'italic' }}>
              "{current.userSnippet}"
            </span>
          </div>

          <div className="grid-4" style={{ gap: '0.75rem' }}>
            <div style={{ background: '#111111', padding: '0.75rem', border: '1px solid #2A2A2A', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#555555', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Clarity</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F5F5F0', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>{current.clarityScore}%</div>
            </div>
            <div style={{ background: '#111111', padding: '0.75rem', border: '1px solid #2A2A2A', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#555555', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Confidence</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FF5C2B', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>{current.confidenceScore}%</div>
            </div>
            <div style={{ background: '#111111', padding: '0.75rem', border: '1px solid #2A2A2A', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#555555', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Persuasion</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F5F5F0', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>{current.persuasionScore}%</div>
            </div>
            <div style={{ background: '#111111', padding: '0.75rem', border: '1px solid #2A2A2A', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#555555', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Fluency</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FF5C2B', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>{current.fluencyScore}%</div>
            </div>
          </div>

          <div style={{ fontSize: '0.84rem', color: '#8C8C8C', borderTop: '1px solid #222222', paddingTop: '0.75rem' }}>
            <strong style={{ color: '#F5F5F0' }}>Linguistic Context: </strong>
            {current.highlightNote}
          </div>
        </div>
      )}
    </div>
  );
};
