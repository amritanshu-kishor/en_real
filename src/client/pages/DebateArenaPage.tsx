import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Send,
  Loader2,
  AlertCircle,
  Volume2,
  VolumeX,
  Mic,
  MicOff
} from 'lucide-react';
import { SpeechService } from '../services/speech';
import { ApiService } from '../services/api';

export const DebateArenaPage: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [userInput, setUserInput] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [debateError, setDebateError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isSpeakingHarrington, setIsSpeakingHarrington] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const [stageHistory, setStageHistory] = useState<Array<{ stage: string; user?: string; ai?: string; assessment?: string }>>([
    {
      stage: 'House Motion',
      ai: 'Lord Harrington: "This House Would Extend Legal Personhood to Autonomous AI." The Proposition dares to argue silicon algorithms possess moral culpability. I call upon the Proposition to deliver their Opening Argument!'
    }
  ]);
  const [debateScore, setDebateScore] = useState<any | null>(null);

  useEffect(() => {
    const unsub = SpeechService.onSpeakingStateChange((speaking) => {
      setIsSpeakingHarrington(speaking);
    });
    return () => {
      unsub();
      SpeechService.stopSpeaking();
      SpeechService.stopListening();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsRecording(false);
    } else {
      setDebateError(null);
      const handler = SpeechService.startListening({
        onResult: (transcript, isFinal) => {
          setUserInput(transcript);
        },
        onError: (err) => {
          setIsRecording(false);
          setDebateError('Microphone input unavailable. You can type freely into the argument box.');
        },
        onEnd: () => {
          setIsRecording(false);
        }
      });
      recognitionRef.current = handler;
      setIsRecording(true);
    }
  };

  const stages = [
    { number: 1, name: 'Opening Argument', desc: 'Establish legal/ethical foundation.' },
    { number: 3, name: 'Rebuttal', desc: 'Dismantle opposition assumptions.' },
    { number: 4, name: 'Point of Information', desc: 'Rapid challenge under timer.' },
    { number: 5, name: 'Final Argument', desc: 'Deliver conclusive oratorical finish.' }
  ];

  const stageDisplay = [
    { number: 1, name: 'Opening Argument' },
    { number: 2, name: 'Opposition Counter' },
    { number: 3, name: 'Rebuttal' },
    { number: 4, name: 'POI Response' },
    { number: 5, name: 'Closing Summation' }
  ];

  const handleNextStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isDebating) return;

    const userText = userInput.trim();
    setUserInput('');
    setIsDebating(true);
    setDebateError(null);

    try {
      if (currentStage < 5) {
        const result = await ApiService.sendDebateTurn({
          sessionId,
          stage: currentStage,
          userArgument: userText
        });

        if (!sessionId) setSessionId(result.sessionId);

        const userStageName = stages.find(s => s.number === currentStage)?.name || `Stage ${currentStage}`;

        setStageHistory(prev => [
          ...prev,
          { stage: userStageName, user: userText, assessment: result.strengthAssessment },
          { stage: result.stageName, ai: result.aiRebuttal }
        ]);

        SpeechService.speakText(result.aiRebuttal, { accent: 'british' });
        setCurrentStage(result.nextStage);
      } else {
        setStageHistory(prev => [
          ...prev,
          { stage: 'Final Argument', user: userText }
        ]);

        const sid = sessionId || 'unknown';
        const evaluation = await ApiService.evaluateDebate(sid);
        setDebateScore(evaluation);
      }
    } catch (err: any) {
      setDebateError(err.message || 'Debate processing failed — please try again.');
    } finally {
      setIsDebating(false);
    }
  };

  const resetDebate = () => {
    setCurrentStage(1);
    setDebateScore(null);
    setDebateError(null);
    setSessionId(undefined);
    setStageHistory([
      {
        stage: 'House Motion',
        ai: 'Lord Harrington: "This House Would Extend Legal Personhood to Autonomous AI." The Proposition dares to argue silicon algorithms possess moral culpability. I call upon the Proposition to deliver their Opening Argument!'
      }
    ]);
  };

  return (
    <div className="content-container" style={{ maxWidth: '1040px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '24px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
            Parliamentary Arena — Oxford Union Rules
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#F5F5F0', lineHeight: 1.05 }}>
            The Oxford Debate Floor
          </h1>
          <p style={{ color: '#8C8C8C', fontSize: '0.92rem', maxWidth: '640px', marginTop: '0.35rem', lineHeight: 1.65 }}>
            Motion: "This House Would Extend Legal Personhood to Autonomous AI" vs Opposition Leader Lord Harrington.
          </p>
        </div>

        <button onClick={resetDebate} className="btn btn-secondary">
          <RefreshCw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* Stage Tracker */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        borderRadius: 0,
        padding: '1rem 1.25rem',
        marginBottom: '1.75rem',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '2px' }}>
          {stageDisplay.map((st) => {
            const isCompleted = currentStage > st.number;
            const isCurrent = currentStage === st.number;

            return (
              <div
                key={st.number}
                style={{
                  padding: '0.75rem',
                  background: isCurrent ? '#1A1A1A' : 'transparent',
                  borderBottom: isCurrent ? '2px solid #FF5C2B' : '2px solid transparent',
                  transition: 'all var(--transition-quick)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    background: isCompleted ? '#FF5C2B' : isCurrent ? '#F5F5F0' : '#2A2A2A',
                    color: '#0C0C0C',
                    fontSize: '0.58rem',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {isCompleted ? '✓' : st.number}
                  </span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isCurrent ? '#F5F5F0' : '#555555', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    S{st.number}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: isCurrent ? '#8C8C8C' : '#3A3A3A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {st.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Debate History Stream */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        padding: '1.75rem',
        marginBottom: '1.5rem',
        minHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {stageHistory.map((entry, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: '#555555', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
              {entry.stage}
            </span>

            {entry.ai && (
              <div style={{
                background: '#161616',
                border: '1px solid #2A2A2A',
                borderLeft: '2px solid #FF5C2B',
                padding: '1rem 1.25rem',
              }}>
                <div style={{ fontSize: '0.92rem', color: '#F5F5F0', lineHeight: 1.6, marginBottom: '0.65rem' }}>{entry.ai}</div>
                <button
                  type="button"
                  onClick={() => {
                    SpeechService.unlockAudio();
                    SpeechService.speakText(entry.ai!, { accent: 'british' });
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #2A2A2A',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#FF5C2B',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  title="Speak in British accent"
                >
                  <Volume2 size={11} />
                  <span>Hear Harrington</span>
                </button>
              </div>
            )}

            {entry.user && (
              <div style={{
                background: '#1A1A1A',
                border: '1px solid #2A2A2A',
                padding: '1rem 1.25rem',
                fontSize: '0.92rem',
                color: '#F5F5F0',
                lineHeight: 1.6
              }}>
                <span style={{ color: '#F5F5F0', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.4rem' }}>Your Argument</span>
                {entry.user}
              </div>
            )}
          </div>
        ))}

        {isDebating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#555555', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: '10px', height: '10px', border: '1px solid #2A2A2A', borderTopColor: '#FF5C2B', borderRadius: 0, animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            Harrington is formulating his counter-argument...
          </div>
        )}
      </div>

      {/* Error Display */}
      {debateError && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-xs)', color: 'var(--text-primary)', fontSize: '0.88rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={14} />
          {debateError}
        </div>
      )}

      {/* Adjudication Score Banner if completed */}
      {debateScore ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-base)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: 'var(--radius-xs)',
          padding: '2rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
                Adjudication Verdict
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginTop: '0.2rem' }}>
                {debateScore.motionResult}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-base)' }}>
                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Score</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{debateScore.overallScore}</div>
              </div>
              <button onClick={resetDebate} className="btn btn-primary">
                Debate Again
              </button>
            </div>
          </div>

          <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Oratory Score</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{debateScore.oratoryRating}%</div>
            </div>
            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Logic Consistency</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{debateScore.logicConsistency}%</div>
            </div>
            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rebuttal Agility</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{debateScore.rebuttalAgility}%</div>
            </div>
            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Persuasive Leverage</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{debateScore.persuasivePower}%</div>
            </div>
          </div>

          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Adjudicator Review: </strong>
            {debateScore.verdict}
          </div>

          {debateScore.keyStrengths && debateScore.keyStrengths.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Key Rhetorical Strengths</div>
                {debateScore.keyStrengths.map((s: string, i: number) => (
                  <div key={i} style={{ fontSize: '0.84rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>• {s}</div>
                ))}
              </div>
              <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)' }}>
                <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Optimization Targets</div>
                {(debateScore.improvementRecommendations || []).map((r: string, i: number) => (
                  <div key={i} style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>• {r}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleNextStage} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
            <button
              type="button"
              onClick={toggleRecording}
              className={`btn ${isRecording ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                width: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isRecording ? 'var(--accent-secondary)' : 'var(--bg-surface)',
                borderColor: isRecording ? 'var(--accent-secondary)' : 'var(--border-base)',
                color: isRecording ? '#ffffff' : 'var(--text-primary)',
                transition: 'all 0.15s ease'
              }}
              title={isRecording ? 'Stop Recording Voice' : 'Record Argument by Voice (Speech-to-Text)'}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <textarea
              className="input-field"
              rows={3}
              style={{ flex: 1, resize: 'vertical' }}
              placeholder={isRecording ? 'Listening live... speak your argument clearly...' : `Deliver your ${stages.find(s => s.number === currentStage)?.name || 'argument'}...`}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isDebating}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0 1.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
              disabled={!userInput.trim() || isDebating}
            >
              {isDebating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
              <span>{isDebating ? 'Evaluating...' : 'Submit Argument'}</span>
            </button>
          </div>
          {isRecording && (
            <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="animate-ping" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-secondary)' }} />
              Recording live microphone input... Transcribing automatically.
            </div>
          )}
        </form>
      )}
    </div>
  );
};
