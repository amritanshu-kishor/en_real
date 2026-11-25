import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Headphones,
  Mic2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react';
import { ApiService } from '../services/api';
import { DashboardAnalytics } from '../types';

interface DashboardPageProps {
  onStartScenario: (scenarioId: string) => void;
  onViewDebrief: (sessionId: string) => void;
  onExploreScenarios: () => void;
  onOpenDna: () => void;
  onSelectMode: (mode: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onStartScenario,
  onViewDebrief,
  onExploreScenarios,
  onOpenDna,
  onSelectMode
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
      <div className="content-container dashboard-loading">
        <div className="dashboard-loading-spinner" />
        <p>Getting your learning studio ready...</p>
      </div>
    );
  }

  const recommendation = analytics.adaptiveRecommendation;
  const skills = [
    { label: 'Grammar', value: analytics.radarScores.grammar, color: 'violet' },
    { label: 'Vocabulary', value: analytics.radarScores.vocabulary, color: 'orange' },
    { label: 'Fluency', value: analytics.radarScores.fluency, color: 'lime' },
    { label: 'Naturalness', value: analytics.radarScores.naturalness, color: 'violet' },
    { label: 'Confidence', value: analytics.radarScores.confidence, color: 'orange' },
    { label: 'Persuasion', value: analytics.radarScores.persuasion, color: 'lime' }
  ];

  const trainingPaths = [
    {
      title: 'Real-life scenarios',
      description: 'Build confidence in conversations that matter.',
      icon: Headphones,
      color: 'violet',
      action: onExploreScenarios
    },
    {
      title: 'Think in English',
      description: 'Make your everyday phrasing sound more natural.',
      icon: Brain,
      color: 'orange',
      action: () => onSelectMode('think_in_english')
    },
    {
      title: 'Speaking practice',
      description: 'Find your voice in a live, high-stakes moment.',
      icon: Mic2,
      color: 'lime',
      action: () => onStartScenario(recommendation?.recommendedScenarioId || 'scen_airport_crisis')
    }
  ];

  return (
    <div className="content-container dashboard-page">
      <header className="dashboard-heading">
        <div>
          <div className="dashboard-eyebrow"><Sparkles size={14} /> YOUR LEARNING STUDIO</div>
          <h1>Your English, in motion.</h1>
          <p>Small steps, real conversations, and progress you can feel.</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="btn btn-secondary dashboard-sync"
          disabled={refreshing}
          aria-label="Refresh dashboard"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      <section className="dashboard-hero-grid">
        <div className="dashboard-welcome-card">
          <div className="dashboard-orb dashboard-orb-one" />
          <div className="dashboard-orb dashboard-orb-two" />
          <div className="dashboard-hero-content">
            <span className="dashboard-pill"><span className="dashboard-live-dot" /> YOUR NEXT CHAPTER</span>
            <h2>Make room for<br /><span>better conversations.</span></h2>
            <p>{recommendation?.rationale || 'Practice speaking naturally, think clearly under pressure, and build a voice that feels like your own.'}</p>
            <div className="dashboard-actions">
              <button
                onClick={() => onStartScenario(recommendation?.recommendedScenarioId || 'scen_airport_crisis')}
                className="btn btn-primary dashboard-cta"
              >
                Start practicing <ArrowRight size={16} />
              </button>
              <button onClick={onExploreScenarios} className="dashboard-text-link">
                Explore scenarios
              </button>
            </div>
          </div>
          <div className="dashboard-hero-art" aria-hidden="true">
            <div className="dashboard-art-ring dashboard-art-ring-back" />
            <div className="dashboard-art-ring dashboard-art-ring-front" />
            <div className="dashboard-chat-bubble bubble-top">You’ve got this!</div>
            <div className="dashboard-chat-bubble bubble-bottom"><span /> Let's talk</div>
            <div className="dashboard-art-center"><Mic2 size={32} /></div>
          </div>
        </div>

        <div className="dashboard-score-card">
          <div className="dashboard-card-heading">
            <div>
              <span className="dashboard-overline">YOUR SNAPSHOT</span>
              <h2>Communication</h2>
            </div>
            <span className="dashboard-score-icon"><TrendingUp size={18} /></span>
          </div>
          <div className="dashboard-score-content">
            <div
              className="dashboard-score-ring"
              style={{ background: `conic-gradient(var(--accent-primary) ${analytics.overallScore}%, rgba(255,255,255,.09) 0)` }}
              aria-label={`Communication score ${analytics.overallScore} out of 100`}
            >
              <div className="dashboard-score-ring-inner">
                <strong>{analytics.overallScore}</strong>
                <span>OUT OF 100</span>
              </div>
            </div>
            <div className="dashboard-score-detail">
              <span className="dashboard-level-badge">{analytics.cefrLevel} LEVEL</span>
              <h3>Keep your momentum.</h3>
              <p>Your practice is building into something real.</p>
            </div>
          </div>
          <div className="dashboard-score-stats">
            <div><strong>{analytics.sessionsCompleted}</strong><span>Sessions</span></div>
            <div><strong>{analytics.wordsSpoken.toLocaleString()}</strong><span>Words spoken</span></div>
            <button onClick={onOpenDna}><span>View your DNA</span><ArrowRight size={14} /></button>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-overline">A LITTLE PRACTICE GOES A LONG WAY</span>
            <h2>Your training paths</h2>
          </div>
          <button onClick={onExploreScenarios} className="dashboard-section-link">See all <ArrowRight size={15} /></button>
        </div>
        <div className="dashboard-training-grid">
          {trainingPaths.map(({ title, description, icon: Icon, color, action }) => (
            <button key={title} className={`dashboard-training-card ${color}`} onClick={action}>
              <span className="dashboard-training-icon"><Icon size={20} /></span>
              <span className="dashboard-training-copy">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <span className="dashboard-training-arrow"><ArrowRight size={17} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-insights-grid">
        <div className="dashboard-panel dashboard-skills-panel">
          <div className="dashboard-section-heading compact">
            <div>
              <span className="dashboard-overline">YOUR GROWTH</span>
              <h2>Skills in focus</h2>
            </div>
            <span className="dashboard-panel-icon"><Target size={18} /></span>
          </div>
          <div className="dashboard-skill-list">
            {skills.map((skill) => (
              <div className="dashboard-skill-row" key={skill.label}>
                <div className="dashboard-skill-label"><span>{skill.label}</span><strong>{skill.value}%</strong></div>
                <div className="dashboard-skill-track">
                  <span className={`dashboard-skill-fill ${skill.color}`} style={{ width: `${Math.min(100, Math.max(0, skill.value))}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="dashboard-insight-note">
            <Sparkles size={15} />
            <span><strong>Today’s focus:</strong> {analytics.dnaSummary.primaryWeakness || 'Spontaneous speaking'}</span>
          </div>
        </div>

        <div className="dashboard-panel dashboard-recommendation-panel">
          <div className="dashboard-recommendation-top">
            <span className="dashboard-overline"><Zap size={13} /> MADE FOR YOU</span>
            <span className="dashboard-recommendation-badge"><Trophy size={13} /> YOUR NEXT CHALLENGE</span>
          </div>
          <h2>{recommendation?.recommendedScenarioTitle || 'Your next conversation is waiting'}</h2>
          <p>{recommendation?.rationale || 'Choose a scenario and put your English into practice.'}</p>
          <div className="dashboard-recommendation-footer">
            <span><BookOpen size={15} /> {recommendation?.targetWeakness || 'Adaptive practice'}</span>
            <button
              onClick={() => onStartScenario(recommendation?.recommendedScenarioId || 'scen_airport_crisis')}
              className="btn btn-primary"
            >
              Take the challenge <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-panel dashboard-activity-panel">
        <div className="dashboard-section-heading">
          <div>
            <span className="dashboard-overline">YOUR JOURNEY SO FAR</span>
            <h2>Recent practice</h2>
          </div>
          <button onClick={onExploreScenarios} className="dashboard-section-link">Find your next session <ArrowRight size={15} /></button>
        </div>
        {analytics.recentSessions.length === 0 ? (
          <div className="dashboard-empty-state">
            <span className="dashboard-empty-icon"><BookOpen size={20} /></span>
            <div><strong>Your story starts here</strong><p>Complete a speaking scenario and your practice will show up here.</p></div>
            <button onClick={onExploreScenarios} className="btn btn-primary">Explore scenarios <ArrowRight size={15} /></button>
          </div>
        ) : (
          <div className="dashboard-session-list">
            {analytics.recentSessions.map((session) => (
              <button className="dashboard-session-row" key={session.id} onClick={() => onViewDebrief(session.id)}>
                <span className="dashboard-session-mark"><BookOpen size={17} /></span>
                <span className="dashboard-session-copy">
                  <strong>{session.scenarioTitle}</strong>
                  <span>{session.category} <i /> {session.date}</span>
                </span>
                <span className="dashboard-session-score">{session.score}<small>/100</small></span>
                <ArrowRight className="dashboard-session-arrow" size={16} />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
