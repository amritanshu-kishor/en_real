import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { EvaluationResult } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { EvidenceCard } from '../components/EvidenceCard';
import { TimelineHeatmap } from '../components/TimelineHeatmap';

interface DebriefPageProps {
  sessionId: string;
  onNextChallenge: (scenarioId: string) => void;
  onReturnDashboard: () => void;
}

export const DebriefPage: React.FC<DebriefPageProps> = ({
  sessionId,
  onNextChallenge,
  onReturnDashboard
}) => {
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebrief = async () => {
      try {
        setLoading(true);
        const evalData = await ApiService.getEvaluation(sessionId);
        setEvaluation(evalData);

        const dnaData = await ApiService.getDna();
        if (dnaData.recommendation) {
          setRecommendation(dnaData.recommendation);
        }
      } catch (err) {
        console.error('Failed to load debrief:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDebrief();
  }, [sessionId]);

  if (loading || !evaluation) {
    return (
      <div className="content-container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ width: '24px', height: '24px', border: '1px solid #2A2A2A', borderTopColor: '#FF5C2B', borderRadius: 0, margin: '0 auto 1rem auto', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555555', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Synthesizing Debrief...</p>
      </div>
    );
  }

  const skills = [
    { label: 'Fluency & Speech Rhythm', score: evaluation.fluencyScore },
    { label: 'Grammar & Syntactic Precision', score: evaluation.grammarScore },
    { label: 'Lexical Sophistication (Vocabulary)', score: evaluation.vocabularyScore },
    { label: 'Naturalness / Native Phrasing', score: evaluation.naturalnessScore },
    { label: 'Executive Confidence & Poise', score: evaluation.confidenceScore },
    { label: 'Persuasive Leverage & Assertiveness', score: evaluation.persuasionScore },
    { label: 'Coherence & Structural Logic', score: evaluation.coherenceScore }
  ];

  return (
    <div className="content-container" style={{ maxWidth: '1040px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '24px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
            Audit Record — Session {sessionId.slice(0, 10)}
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#F5F5F0', lineHeight: 1.05 }}>
            Communication Debrief
          </h1>
          <p style={{ color: '#8C8C8C', fontSize: '0.92rem', maxWidth: '640px', marginTop: '0.4rem', lineHeight: 1.65 }}>
            {evaluation.summary}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onReturnDashboard} className="btn btn-secondary">
            Dashboard
          </button>
          {recommendation && (
            <button
              onClick={() => onNextChallenge(recommendation.recommendedScenarioId)}
              className="btn btn-primary"
            >
              <span>Next Challenge</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid #2A2A2A', borderLeft: '1px solid #2A2A2A', marginBottom: '2rem' }}>
        {/* Overall Score */}
        <div style={{
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid #2A2A2A',
          borderBottom: '1px solid #2A2A2A',
        }}>
          <ScoreGauge
            score={evaluation.overallScore}
            size={165}
            label="Proficiency Rating"
            sublabel="Evidence-backed"
          />
        </div>

        {/* Strongest Moment */}
        <div style={{
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #2A2A2A',
          borderBottom: '1px solid #2A2A2A',
          borderTop: '2px solid #FF5C2B'
        }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#FF5C2B', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Strongest Moment
            </div>
            <p style={{ fontSize: '0.94rem', color: '#F5F5F0', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{evaluation.strongestMoment}"
            </p>
          </div>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#555555', fontWeight: 700, marginTop: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Peak Persuasive Stance
          </span>
        </div>

        {/* Biggest Opportunity */}
        <div style={{
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #2A2A2A',
          borderBottom: '1px solid #2A2A2A',
          borderTop: '2px solid #F5F5F0'
        }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#F5F5F0', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Primary Opportunity
            </div>
            <p style={{ fontSize: '0.94rem', color: '#8C8C8C', lineHeight: 1.6 }}>
              {evaluation.biggestOpportunity}
            </p>
          </div>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: '#555555', fontWeight: 700, marginTop: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Target for Next Session
          </span>
        </div>
      </div>

      {/* Skill Breakdown */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        padding: '1.75rem',
        marginBottom: '2rem'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '20px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
            Competency Vectors
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#F5F5F0', letterSpacing: '-0.02em' }}>
            Skill Breakdown
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {skills.map((s, idx) => (
            <div key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 500, color: '#F5F5F0' }}>
                  {s.label}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FF5C2B', fontFamily: 'var(--font-mono)' }}>
                  {s.score}
                </span>
              </div>
              <div style={{ width: '100%', height: '3px', background: '#1E1E1E', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${s.score}%`,
                    height: '100%',
                    background: '#FF5C2B',
                    transition: 'width 0.8s ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Heatmap */}
      <div style={{ marginBottom: '2.5rem' }}>
        <TimelineHeatmap timeline={evaluation.timelineHeatmap} />
      </div>

      {/* Linguistic Evidence */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '20px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
            Empirical Telemetry
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#F5F5F0', letterSpacing: '-0.02em' }}>
            Corrections & Native Upgrades ({evaluation.corrections.length})
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {evaluation.corrections.map((corr) => (
            <EvidenceCard key={corr.id} item={corr} />
          ))}
        </div>
      </div>

      {/* Next Challenge Card */}
      {recommendation && (
        <div style={{
          background: '#111111',
          border: '1px solid #2A2A2A',
          borderTop: '2px solid #FF5C2B',
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555555', marginBottom: '0.35rem' }}>
              Next Assignment — Focus: {recommendation.targetWeakness}
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F5F5F0', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
              {recommendation.recommendedScenarioTitle}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#8C8C8C', maxWidth: '720px', lineHeight: 1.55 }}>
              {recommendation.rationale}
            </p>
          </div>

          <button
            onClick={() => onNextChallenge(recommendation.recommendedScenarioId)}
            className="btn btn-primary btn-lg"
          >
            <span>Proceed</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
