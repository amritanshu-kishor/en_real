import React, { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw, Sparkles, Target, TrendingUp, Quote, Zap, Award, Activity, Flame } from 'lucide-react';
import { ApiService } from '../services/api';
import { DashboardAnalytics } from '../types';
import { RadarChart } from '../components/RadarChart';
import { ScoreGauge } from '../components/ScoreGauge';

interface DashboardPageProps {
  onStartScenario: (scenarioId: string) => void;
  onViewDebrief: (sessionId: string) => void;
  onExploreScenarios: () => void;
  onOpenDna: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onStartScenario,
  onViewDebrief,
  onExploreScenarios,
  onOpenDna
}) => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const data = await ApiService.getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load dashboard analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="content-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '28px', height: '28px', border: '2px solid var(--border-base)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>Loading telemetry data...</p>
        </div>
      </div>
    );
  }

  const rec = analytics.adaptiveRecommendation;

  return (
    <div className="content-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '24px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
            Telemetry Console // CEFR {analytics.cefrLevel}
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#F5F5F0', lineHeight: 1.05 }}>
            Communication Command Center
          </h1>
          <p style={{ color: '#8C8C8C', fontSize: '0.94rem', maxWidth: '640px', marginTop: '0.4rem', lineHeight: 1.6 }}>
            Continuous linguistic diagnostics, real-time speech telemetry, and calibrated adaptive simulation targets.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem' }}
          disabled={refreshing}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          <span>Sync Telemetry</span>
        </button>
      </div>

      {/* Primary Area: Split Hero (Score Pod & Adaptive Assignment) */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        marginBottom: '2.5rem',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)'
        }}>
          {/* Left: Score Pod */}
          <div style={{
            padding: '2.5rem 2rem',
            background: '#0E0E0E',
            borderRight: '1px solid #2A2A2A',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <ScoreGauge
              score={analytics.overallScore}
              size={170}
              label="Communication Index"
              sublabel="Live performance calibration"
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid #2A2A2A',
              fontSize: '0.74rem',
              color: '#555555',
              fontFamily: 'var(--font-mono)'
            }}>
              <div>
                <span>SESSIONS: </span>
                <strong style={{ color: '#F5F5F0' }}>{analytics.sessionsCompleted}</strong>
              </div>
              <div>
                <span>WORDS: </span>
                <strong style={{ color: '#F5F5F0' }}>{analytics.wordsSpoken}</strong>
              </div>
            </div>
          </div>

          {/* Right: Recommended Adaptive Assignment */}
          <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FF5C2B',
                  background: 'rgba(255, 92, 43, 0.08)',
                  border: '1px solid rgba(255, 92, 43, 0.3)',
                  padding: '0.2rem 0.55rem'
                }}>
                  Adaptive Assignment
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#8C8C8C',
                  padding: '0.2rem 0.55rem',
                  border: '1px solid #2A2A2A'
                }}>
                  TARGET: {rec?.targetWeakness?.toUpperCase() || 'SPONTANEOUS CRISIS AGILITY'}
                </span>
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '0.75rem', color: '#F5F5F0', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                {rec?.recommendedScenarioTitle || 'Airport Gate Chaos & The Last Flight'}
              </h2>

              <p style={{ color: '#8C8C8C', fontSize: '0.94rem', lineHeight: 1.65, maxWidth: '640px' }}>
                {rec?.rationale || 'Speech rhythm shows hesitation during unexpected conversational obstacles. This high-pressure negotiation requires structured leverage and spontaneous composure under friction.'}
              </p>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => onStartScenario(rec?.recommendedScenarioId || 'scen_airport_crisis')}
                className="btn btn-primary btn-lg"
              >
                <span>Launch Scenario</span>
                <ArrowRight size={15} />
              </button>

              <button onClick={onExploreScenarios} className="btn btn-secondary">
                <span>Browse Catalogue</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Areas: Asymmetric 2-Column Split */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)',
        gap: '2rem',
        marginBottom: '2.5rem'
      }}>
        {/* Radar Chart */}
        <div style={{
          background: '#111111',
          border: '1px solid #2A2A2A',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#F5F5F0' }}>
              Competency Vectors
            </h3>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#FF5C2B', fontWeight: 700, letterSpacing: '0.06em' }}>
              6 AXES RADAR
            </span>
          </div>

          <RadarChart scores={analytics.radarScores} size={280} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            width: '100%',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid #2A2A2A',
            textAlign: 'center'
          }}>
            <div style={{ background: '#0E0E0E', padding: '0.65rem 0.5rem', border: '1px solid #2A2A2A' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase' }}>Grammar</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F5F5F0', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>{analytics.radarScores.grammar}%</div>
            </div>
            <div style={{ background: '#0E0E0E', padding: '0.65rem 0.5rem', border: '1px solid #2A2A2A' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase' }}>Lexicon</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FF5C2B', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>{analytics.radarScores.vocabulary}%</div>
            </div>
            <div style={{ background: '#0E0E0E', padding: '0.65rem 0.5rem', border: '1px solid #2A2A2A' }}>
              <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase' }}>Fluency</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F5F5F0', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>{analytics.radarScores.fluency}%</div>
            </div>
          </div>
        </div>

        {/* Intelligence Diagnostic & DNA Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Linguistic Observation */}
          <div style={{
            background: '#111111',
            border: '1px solid #2A2A2A',
            borderTop: '2px solid #FF5C2B',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#FF5C2B', fontWeight: 700, letterSpacing: '0.08em' }}>
                Diagnostic Observation
              </span>
              <Quote size={15} color="#FF5C2B" />
            </div>

            <div style={{
              background: '#0E0E0E',
              borderLeft: '2px solid #FF5C2B',
              padding: '1rem 1.25rem',
              fontSize: '0.94rem',
              lineHeight: 1.6,
              color: '#F5F5F0',
              fontStyle: 'italic'
            }}>
              "{analytics.aiInsight}"
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem', letterSpacing: '0.06em' }}>
                Primary Focus Area
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#FF5C2B' }}>
                {analytics.dnaSummary.primaryWeakness}
              </div>
            </div>
          </div>

          {/* Persistent Habits */}
          <div style={{
            background: '#111111',
            border: '1px solid #2A2A2A',
            borderTop: '2px solid #F5F5F0',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#8C8C8C', fontWeight: 700, letterSpacing: '0.08em' }}>
                Persistent Habit Telemetry
              </div>
              <button onClick={onOpenDna} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}>
                Inspect DNA Dossier
              </button>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div style={{ background: '#0E0E0E', border: '1px solid #2A2A2A', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase' }}>Recurring Slips</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F5F5F0', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  {analytics.dnaSummary.recurringMistakeCount}
                </div>
              </div>
              <div style={{ background: '#0E0E0E', border: '1px solid #2A2A2A', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase' }}>Filler Density</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FF5C2B', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                  {analytics.dnaSummary.fillerWordDensity}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: '#8C8C8C' }}>
                Primary Strength: <strong style={{ color: '#F5F5F0' }}>{analytics.dnaSummary.strengths[0] || 'Structured clarity'}</strong>
              </span>
              <button onClick={onOpenDna} style={{ background: 'transparent', border: 'none', color: '#FF5C2B', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                Full Linguistic Record <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Performance Trajectory & Session Records */}
      <div style={{ background: '#111111', border: '1px solid #2A2A2A', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ width: '20px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
              Performance Record
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#F5F5F0' }}>
              Historical Performance Trajectory
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#8C8C8C', marginTop: '0.2rem' }}>
              Persistent SQLite evaluation trends across completed simulations.
            </p>
          </div>
          <button onClick={onExploreScenarios} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
            Explore Scenarios
          </button>
        </div>

        {/* Real Progress Trajectory Graph */}
        {analytics.progressHistory && analytics.progressHistory.length > 1 && (
          <div style={{
            background: '#0E0E0E',
            border: '1px solid #2A2A2A',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#8C8C8C', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                SCORE PROGRESSION ({analytics.progressHistory.length} SESSIONS RECORDED)
              </span>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#FF5C2B', fontWeight: 700 }}>
                LATEST: {analytics.progressHistory[analytics.progressHistory.length - 1].score}/100
              </span>
            </div>

            <div style={{ width: '100%', height: '80px', position: 'relative' }}>
              <svg width="100%" height="80" viewBox="0 0 600 80" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="scoreAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF5C2B" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FF5C2B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Guidelines */}
                <line x1="0" y1="20" x2="600" y2="20" stroke="#222222" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="600" y2="50" stroke="#222222" strokeDasharray="3 3" />

                {(() => {
                  const data = analytics.progressHistory;
                  const minScore = 60;
                  const maxScore = 100;
                  const stepX = 600 / (data.length - 1);
                  const getY = (val: number) => 70 - ((val - minScore) / (maxScore - minScore)) * 55;

                  const points = data.map((d, i) => `${i * stepX},${getY(d.score)}`).join(' ');
                  const areaPoints = `0,75 ${points} ${(data.length - 1) * stepX},75`;

                  return (
                    <>
                      <polygon points={areaPoints} fill="url(#scoreAreaGrad)" />
                      <polyline points={points} fill="none" stroke="#FF5C2B" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                      {data.map((d, i) => (
                        <g key={i}>
                          <rect x={i * stepX - 3.5} y={getY(d.score) - 3.5} width="7" height="7" fill="#FF5C2B" stroke="#0C0C0C" strokeWidth="1.5" />
                          <text x={i * stepX} y={getY(d.score) - 9} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="#F5F5F0" fontWeight="700">
                            {d.score}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#555555' }}>
              <span>{analytics.progressHistory[0]?.date}</span>
              <span>{analytics.progressHistory[analytics.progressHistory.length - 1]?.date}</span>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {analytics.recentSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#555555', fontSize: '0.88rem', fontFamily: 'var(--font-mono)' }}>
              NO COMPLETED SESSIONS RECORDED.
            </div>
          ) : (
            analytics.recentSessions.map((session, sIdx) => {
              return (
                <div
                  key={session.id}
                  onClick={() => onViewDebrief(session.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.15rem 1rem',
                    borderBottom: sIdx < analytics.recentSessions.length - 1 ? '1px solid #222222' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#161616'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#F5F5F0' }}>
                      {session.scenarioTitle}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#555555' }}>
                        {session.date}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#333333' }}>·</span>
                      <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#8C8C8C' }}>
                        {session.category}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        border: '1px solid #2A2A2A',
                        background: '#0E0E0E',
                        color: session.difficulty === 'High Stakes' ? '#FF5C2B' : '#8C8C8C'
                      }}>
                        {session.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#F5F5F0' }}>
                        {session.score}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#555555', display: 'block', fontFamily: 'var(--font-mono)' }}>
                        /100
                      </span>
                    </div>
                    <ArrowRight size={15} color="#555555" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
