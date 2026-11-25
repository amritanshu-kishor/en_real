import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Zap, Brain, Gavel, Presentation, Volume2 } from 'lucide-react';

interface LandingPageProps {
  onEnterReality: () => void;
  onExploreScenarios: () => void;
  onSelectMode: (mode: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterReality,
  onExploreScenarios,
  onSelectMode
}) => {
  const [demoStep, setDemoStep] = useState(0);

  const demoConversation = [
    {
      sender: 'ai',
      name: 'Supervisor Zhang',
      role: 'Operations Lead',
      text: 'Flight 812 is grounded due to runway icing. The next transatlantic seat is tomorrow at 4 PM. Take a voucher or step aside.',
      complication: null
    },
    {
      sender: 'user',
      name: 'Executive Speaker',
      role: 'VP Strategic Accounts',
      text: 'Supervisor Zhang, I understand runway safety. However, my team is leading an arbitration hearing in New York tomorrow morning. Re-route me via Paris or Frankfurt tonight on any partner airline.',
      complication: null
    },
    {
      sender: 'ai',
      name: 'Supervisor Zhang',
      role: 'Operations Lead',
      text: 'Paris is fully booked in Business. I can hold the last economy seat on the 21:40 feeder, but you will have to sprint across Terminal 2E with only 35 minutes.',
      complication: 'Complication: Time pressure and cabin downgrade'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % demoConversation.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const modes = [
    {
      id: 'think_in_english',
      label: 'Think in English',
      tag: 'Cognitive Rewiring',
      desc: 'Isolate and eradicate subconscious translation traps. Adopt natural idiomatic phrasing under pressure.',
      cta: 'Open Studio',
      accent: '#FF5C2B'
    },
    {
      id: 'debate',
      label: 'Oxford Debate Arena',
      tag: 'Parliamentary Rules',
      desc: 'Face Opposition Leader Lord Harrington across 5 structured debate stages with real-time rhetorical adjudication.',
      cta: 'Enter Arena',
      accent: '#F5F5F0'
    },
    {
      id: 'presentation',
      label: 'Keynote Coach',
      tag: 'Executive Cadence',
      desc: 'Deliver structured pitch decks with live WPM telemetry, filler density analysis, and comprehensive critique.',
      cta: 'Start Coach',
      accent: '#FF5C2B'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1.75rem 6rem 1.75rem' }}>

      {/* ── Hero ── */}
      <section style={{ marginBottom: '5rem' }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#FF5C2B',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ width: '32px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
          Executive Reality Simulator
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
          gap: '4rem',
          alignItems: 'start'
        }}>
          {/* Left */}
          <div>
            <h1 style={{
              fontSize: 'clamp(3rem, 5.5vw, 5rem)',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              color: '#F5F5F0',
              marginBottom: '1.75rem'
            }}>
              Fluency tested<br />
              under{' '}
              <span style={{ color: '#FF5C2B' }}>pressure.</span>
            </h1>

            <p style={{
              fontSize: '1.05rem',
              color: '#8C8C8C',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: '480px'
            }}>
              High-pressure conversational simulations where AI counterparts challenge arguments, expose native translation habits, and evaluate performance across 7 linguistic axes.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
              <button onClick={onEnterReality} className="btn btn-primary btn-lg">
                <span>Launch Simulator</span>
                <ArrowRight size={15} />
              </button>
              <button onClick={onExploreScenarios} className="btn btn-secondary btn-lg">
                <span>Browse Scenarios</span>
              </button>
            </div>

            {/* Stat row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, auto)',
              gap: '0',
              borderTop: '1px solid #2A2A2A',
              paddingTop: '2rem',
              width: 'fit-content'
            }}>
              {[
                { val: '12+', label: 'Simulation Arenas' },
                { val: '7',   label: 'Linguistic Axes' },
                { val: 'AI',  label: 'Neural Voice' },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: '0 2.5rem 0 0',
                  marginRight: i < 2 ? '2.5rem' : 0,
                  borderRight: i < 2 ? '1px solid #2A2A2A' : 'none',
                }}>
                  <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#F5F5F0', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    {stat.val}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#555555', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.3rem' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Live simulation preview */}
          <div style={{
            background: '#111111',
            border: '1px solid #2A2A2A',
            overflow: 'hidden'
          }}>
            {/* Window bar */}
            <div style={{
              background: '#141414',
              borderBottom: '1px solid #2A2A2A',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, color: '#555555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Live Simulation — Heathrow Crisis
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: '#FF5C2B', fontWeight: 700 }}>
                TURN {demoStep + 1} / 3
              </div>
            </div>

            {/* Dialogue */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', minHeight: '260px' }}>
              {demoConversation.slice(0, demoStep + 1).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.85rem' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    background: item.sender === 'ai' ? '#FF5C2B' : '#F5F5F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.58rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: '#0C0C0C',
                    flexShrink: 0,
                  }}>
                    {item.sender === 'ai' ? 'OP' : 'ME'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F5F5F0', fontFamily: 'var(--font-body)' }}>{item.name}</span>
                      <span style={{ fontSize: '0.66rem', color: '#555555', fontFamily: 'var(--font-mono)' }}>{item.role}</span>
                    </div>
                    <div style={{
                      padding: '0.9rem 1.1rem',
                      background: item.sender === 'ai' ? '#161616' : '#1A1A1A',
                      border: '1px solid #2A2A2A',
                      borderLeft: item.sender === 'ai' ? '2px solid #FF5C2B' : '2px solid #3D3D3D',
                      color: '#F5F5F0',
                      fontSize: '0.88rem',
                      lineHeight: 1.55
                    }}>
                      {item.text}
                    </div>
                    {item.complication && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 0.85rem',
                        background: 'rgba(255,92,43,0.06)',
                        border: '1px solid rgba(255,92,43,0.25)',
                        fontSize: '0.72rem',
                        color: '#FF5C2B',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {item.complication}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Status bar */}
            <div style={{
              background: '#0C0C0C',
              borderTop: '1px solid #2A2A2A',
              padding: '0.55rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              color: '#555555'
            }}>
              <span style={{ color: '#FF5C2B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '5px', height: '5px', background: '#FF5C2B', display: 'inline-block' }} />
                ADAPTIVE ENGINE
              </span>
              <span>LATENCY 140ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Bar ── */}
      <section style={{ marginBottom: '5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid #2A2A2A',
          borderLeft: '1px solid #2A2A2A',
        }}>
          {[
            { icon: Zap,         label: 'Real-Time Complications',  sub: 'Adaptive mid-argument pressure' },
            { icon: ShieldCheck, label: 'CEFR Rigor',               sub: '7-vector speech debriefs' },
            { icon: Volume2,     label: 'Neural Voice',             sub: 'Multi-dialect synthesis' },
            { icon: Brain,       label: 'Translation Eradication',  sub: 'Target subconscious L1 traps' },
          ].map(({ icon: Icon, label, sub }, i) => (
            <div key={i} style={{
              padding: '1.5rem 1.25rem',
              borderRight: '1px solid #2A2A2A',
              borderBottom: '1px solid #2A2A2A',
            }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <Icon size={18} color="#FF5C2B" />
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#F5F5F0', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ fontSize: '0.74rem', color: '#555555', fontFamily: 'var(--font-mono)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Disciplines ── */}
      <section>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555555', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: '24px', height: '1px', background: '#2A2A2A', display: 'inline-block' }} />
            Specialized Arenas
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#F5F5F0', lineHeight: 1.05 }}>
            Simulation Disciplines
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderTop: '1px solid #2A2A2A',
          borderLeft: '1px solid #2A2A2A',
        }}>
          {modes.map((mode, i) => (
            <div
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              style={{
                padding: '2rem',
                borderRight: '1px solid #2A2A2A',
                borderBottom: '1px solid #2A2A2A',
                cursor: 'pointer',
                transition: 'background 0.12s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                position: 'relative',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#141414'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              {/* Top accent line */}
              <div style={{ height: '2px', background: mode.accent, width: '40px' }} />

              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#555555',
                  marginBottom: '0.5rem'
                }}>
                  {mode.tag}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F5F5F0', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {mode.label}
                </h3>
              </div>

              <p style={{ color: '#8C8C8C', fontSize: '0.875rem', lineHeight: 1.65, flex: 1 }}>
                {mode.desc}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: mode.accent,
                fontWeight: 700,
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <span>{mode.cta}</span>
                <ArrowRight size={13} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
