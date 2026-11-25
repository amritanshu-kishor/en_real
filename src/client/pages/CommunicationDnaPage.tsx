import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { CommunicationDna } from '../types';

interface CommunicationDnaPageProps {
  onStartScenario: (scenarioId: string) => void;
  onExploreScenarios: () => void;
}

export const CommunicationDnaPage: React.FC<CommunicationDnaPageProps> = ({
  onStartScenario,
  onExploreScenarios
}) => {
  const [dna, setDna] = useState<CommunicationDna | null>(null);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDna = async () => {
      try {
        setLoading(true);
        const data = await ApiService.getDna();
        setDna(data.dna);
        setRecommendation(data.recommendation);
      } catch (err) {
        console.error('Failed to load communication DNA:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDna();
  }, []);

  if (loading || !dna) {
    return (
      <div className="content-container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ width: '24px', height: '24px', border: '1px solid #2A2A2A', borderTopColor: '#FF5C2B', margin: '0 auto 1rem auto', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555555', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Decoding Persistent Linguistic Dossier...</p>
      </div>
    );
  }

  return (
    <div className="content-container" style={{ maxWidth: '1040px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '24px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
            Persistent Telemetry Dossier // {dna.totalSessions} Sessions ({dna.totalWordsSpoken} Spoken Words)
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#F5F5F0', lineHeight: 1.05 }}>
            Communication DNA Dossier
          </h1>
          <p style={{ color: '#8C8C8C', fontSize: '0.94rem', maxWidth: '650px', marginTop: '0.4rem', lineHeight: 1.6 }}>
            A persistent cognitive profile tracking naturalness, recurring syntactic habits, and spontaneous fluency under stress.
          </p>
        </div>

        <button onClick={onExploreScenarios} className="btn btn-secondary">
          Browse Scenarios
        </button>
      </div>

      {/* Profile Statement */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        borderTop: '2px solid #FF5C2B',
        padding: '2.5rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#FF5C2B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.08em' }}>
          Diagnostic Overview
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <p style={{
            fontSize: 'clamp(1.2rem, 2vw, 1.6rem)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            color: '#F5F5F0',
            lineHeight: 1.35
          }}>
            {dna.strengths?.[0] ? `Confirmed strength: ${dna.strengths[0]}.` : 'You communicate with structured analytical clarity.'}
          </p>
          <p style={{
            fontSize: 'clamp(1.2rem, 2vw, 1.6rem)',
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            color: '#8C8C8C',
            lineHeight: 1.35
          }}>
            {dna.weaknesses?.[0] ? `Primary leverage area: ${dna.weaknesses[0]}.` : 'Speech fluidity slows during abrupt counter-arguments.'}
          </p>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #2A2A2A', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase' }}>Overall Rating</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#FF5C2B', marginTop: '0.2rem' }}>
              {dna.overallRating} <span style={{ fontSize: '0.82rem', color: '#555555' }}>/ 100</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase' }}>Think in English Index</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#F5F5F0', marginTop: '0.2rem' }}>
              {dna.thinkInEnglishScore}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase' }}>Naturalness Index</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#FF5C2B', marginTop: '0.2rem' }}>
              {dna.naturalnessIndex}%
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses Split */}
      <div className="grid-2" style={{ marginBottom: '2.5rem', gap: '1.5rem' }}>
        {/* Strengths */}
        <div style={{
          background: '#111111',
          border: '1px solid #2A2A2A',
          borderLeft: '2px solid #F5F5F0',
          padding: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <ShieldCheck size={17} color="#F5F5F0" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#F5F5F0' }}>
              Confirmed Linguistic Strengths
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {dna.strengths.map((st, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: '#0E0E0E', border: '1px solid #2A2A2A', padding: '0.75rem 1rem' }}>
                <span style={{ color: '#F5F5F0', fontWeight: 700 }}>•</span>
                <span style={{ fontSize: '0.88rem', color: '#F5F5F0', fontWeight: 500 }}>{st}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div style={{
          background: '#111111',
          border: '1px solid #2A2A2A',
          borderLeft: '2px solid #FF5C2B',
          padding: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <AlertCircle size={17} color="#FF5C2B" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#F5F5F0' }}>
              Recurring Friction Points
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {dna.weaknesses.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: '#0E0E0E', border: '1px solid #2A2A2A', padding: '0.75rem 1rem' }}>
                <span style={{ color: '#FF5C2B', fontWeight: 700 }}>•</span>
                <span style={{ fontSize: '0.88rem', color: '#8C8C8C', fontWeight: 500 }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recurring Syntactic Patterns */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        padding: '2rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: '20px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
              Grammar Audit
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#F5F5F0' }}>
              Recurring Syntactic Slips Across History
            </h3>
          </div>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#8C8C8C', fontWeight: 700, letterSpacing: '0.06em' }}>
            PERSISTENT SQL RECORD
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {dna.recurringGrammar.map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              background: '#0E0E0E',
              border: '1px solid #2A2A2A',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#F5F5F0' }}>
                  {item.mistake}
                </div>
                {item.example && (
                  <div style={{ fontSize: '0.8rem', color: '#555555', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                    Session quote: "{item.example}"
                  </div>
                )}
              </div>

              <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#FF5C2B', fontWeight: 700 }}>
                {item.count} OCCURRENCES
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filler Words & Repeated Lexicon */}
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        <div style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '1rem', color: '#F5F5F0' }}>
            Verbal Filler & Hesitation Patterns
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {dna.fillerWords.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#0E0E0E', border: '1px solid #2A2A2A' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F5F5F0' }}>
                  "{f.filler}"
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#555555', fontFamily: 'var(--font-mono)' }}>{f.count} TIMES</span>
                  <span style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#FF5C2B',
                    padding: '0.15rem 0.5rem',
                    border: '1px solid rgba(255, 92, 43, 0.3)',
                    background: 'rgba(255, 92, 43, 0.08)',
                    fontWeight: 700
                  }}>
                    {f.impact.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '1rem', color: '#F5F5F0' }}>
            Overused Vocabulary & Alternatives
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {dna.repeatedVocabulary.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#0E0E0E', border: '1px solid #2A2A2A' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F5F5F0' }}>
                    "{v.word}"
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#555555', marginLeft: '0.45rem', fontFamily: 'var(--font-mono)' }}>
                    ({v.count}x)
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#FF5C2B', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  → {v.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
