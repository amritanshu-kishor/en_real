import React, { useState, useEffect, useRef } from 'react';
import {
  MicOff,
  RotateCcw,
  Play,
  AlertCircle,
  Volume2
} from 'lucide-react';
import { SpeechService } from '../services/speech';
import { AudioWaveform } from '../components/AudioWaveform';
import { ApiService } from '../services/api';

export const PresentationCoachPage: React.FC = () => {
  const [isPresenting, setIsPresenting] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [activeSlide, setActiveSlide] = useState(1);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [currentSpeechChunk, setCurrentSpeechChunk] = useState('');
  const [fillerCount, setFillerCount] = useState(0);
  const [presentationScore, setPresentationScore] = useState<any | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const slides = [
    { num: 1, title: 'The Problem Statement', target: 'Quantify customer friction and market pain.' },
    { num: 2, title: 'The Breakout Solution', target: 'Demonstrate differentiation and architectural edge.' },
    { num: 3, title: 'Unit Economics & Traction', target: 'Present CAC, LTV, revenue growth, and retention.' },
    { num: 4, title: 'Vision & Strategic Ask', target: 'Unveil 5-year roadmap and funding requirements.' }
  ];

  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isPresenting) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPresenting]);

  const startPresentation = () => {
    setPresentationScore(null);
    setEvalError(null);
    setSecondsElapsed(0);
    setActiveSlide(1);
    setSpokenTranscript('');
    setFillerCount(0);
    setIsPresenting(true);

    const handler = SpeechService.startListening({
      onResult: (transcript, isFinal) => {
        setCurrentSpeechChunk(transcript);
        if (isFinal) {
          setSpokenTranscript(prev => `${prev} ${transcript}`);
          const matches = transcript.match(/\b(um|umm|uh|uhh|like|actually|basically|you know)\b/gi);
          if (matches) {
            setFillerCount(prev => prev + matches.length);
          }
        }
      },
      onError: (err) => {
        console.warn('Presentation coach voice error:', err);
      },
      onEnd: () => {}
    });

    recognitionRef.current = handler;
  };

  const stopAndEvaluate = async () => {
    setIsPresenting(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const totalText = `${spokenTranscript} ${currentSpeechChunk}`.trim();

    setIsEvaluating(true);
    setEvalError(null);

    try {
      const result = await ApiService.evaluatePresentation({
        spokenTranscript: totalText || '(no speech detected)',
        durationSeconds: secondsElapsed || 1,
        slidesCovered: activeSlide,
        fillerCount,
        isAudioAnalyzed: Boolean(totalText)
      });
      setPresentationScore(result);
    } catch (err: any) {
      setEvalError(err.message || 'Evaluation failed — please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="content-container" style={{ maxWidth: '1040px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF5C2B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '24px', height: '1px', background: '#FF5C2B', display: 'inline-block' }} />
            Speaking Studio — Executive Cadence
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: '#F5F5F0', lineHeight: 1.05 }}>
            Presentation Coach
          </h1>
          <p style={{ color: '#8C8C8C', fontSize: '0.92rem', maxWidth: '600px', marginTop: '0.35rem', lineHeight: 1.65 }}>
            Deliver an executive keynote across structured slides. Track vocal cadence, Words-Per-Minute, and verbal filler density.
          </p>
        </div>

        {isPresenting ? (
          <button onClick={stopAndEvaluate} className="btn btn-primary btn-lg" disabled={isEvaluating}>
            <MicOff size={15} />
            <span>Conclude & Analyze</span>
          </button>
        ) : isEvaluating ? (
          <button className="btn btn-secondary btn-lg" disabled>
            <span>Analyzing...</span>
          </button>
        ) : (
          <button onClick={startPresentation} className="btn btn-primary btn-lg">
            <Play size={15} />
            <span>Start Keynote</span>
          </button>
        )}
      </div>

      {/* Telemetry Console */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        padding: '1.5rem',
        marginBottom: '1.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.2rem' }}>
              Elapsed
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#F5F5F0', lineHeight: 1 }}>
              {formatTime(secondsElapsed)}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AudioWaveform isRecording={isPresenting} width={160} height={28} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.2rem' }}>
              Fillers
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#F5F5F0', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {fillerCount}
            </div>
          </div>
        </div>

        {/* Slide Deck */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #1E1E1E' }}>
          <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.85rem' }}>
            Slide Outline
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px' }}>
            {slides.map((s) => (
              <div
                key={s.num}
                onClick={() => isPresenting && setActiveSlide(s.num)}
                style={{
                  background: activeSlide === s.num ? '#1A1A1A' : 'transparent',
                  border: '1px solid',
                  borderColor: activeSlide === s.num ? '#FF5C2B' : '#2A2A2A',
                  padding: '0.85rem',
                  cursor: isPresenting ? 'pointer' : 'default',
                  transition: 'all var(--transition-quick)'
                }}
              >
                <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: activeSlide === s.num ? '#FF5C2B' : '#555555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  0{s.num}
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#F5F5F0', margin: '0.3rem 0 0.15rem' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8C8C8C', lineHeight: 1.45 }}>
                  {s.target}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {evalError && (
        <div style={{ marginBottom: '1.5rem', padding: '0.85rem', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-xs)', color: 'var(--text-primary)', fontSize: '0.86rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={15} />
          {evalError}
        </div>
      )}

      {/* Script Input / Live Transcript Stream */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-base)',
        borderRadius: 'var(--radius-xs)',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Keynote Speech Transcript</span>
            {isPresenting && <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>● RECORDING</span>}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Microphone dictation or manual script entry
          </span>
        </div>
        <textarea
          className="input-field"
          style={{ width: '100%', minHeight: '110px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.92rem', lineHeight: 1.6 }}
          placeholder={isPresenting ? "Speaking in real-time... (or type here directly)" : "Click 'Start Live Keynote' above to speak via microphone, or type your speech here and click 'Conclude & Analyze Keynote'."}
          value={spokenTranscript || currentSpeechChunk}
          onChange={(e) => {
            const val = e.target.value;
            setSpokenTranscript(val);
            setCurrentSpeechChunk('');
            const matches = val.match(/\b(um|umm|uh|uhh|like|actually|basically|you know)\b/gi);
            setFillerCount(matches ? matches.length : 0);
          }}
        />
      </div>

      {/* Presentation Results */}
      {presentationScore && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-base)',
          borderLeft: '3px solid var(--accent-primary)',
          borderRadius: 'var(--radius-xs)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em' }}>
                Delivery Audit
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginTop: '0.2rem' }}>
                Overall Delivery Score: {presentationScore.overallScore}/100
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  SpeechService.unlockAudio();
                  SpeechService.speakText(presentationScore.cadenceVerdict || `Your overall delivery score is ${presentationScore.overallScore} out of 100 with a pacing of ${presentationScore.wpm} words per minute.`);
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
                title="Hear coach feedback spoken aloud"
              >
                <Volume2 size={13} color="var(--accent-primary)" />
                <span>Listen to Coach</span>
              </button>
              <button onClick={startPresentation} className="btn btn-secondary">
                <RotateCcw size={13} />
                <span>Deliver Again</span>
              </button>
            </div>
          </div>

          <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.75rem' }}>
            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Words Spoken</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{presentationScore.wordsSpoken}</div>
            </div>
            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cadence / Pacing</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{presentationScore.wpm} <span style={{ fontSize: '0.75rem' }}>WPM</span></div>
            </div>
            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fluency Stability</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{presentationScore.fluencyScore}%</div>
            </div>
            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-xs)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Structure Adherence</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{presentationScore.structureScore}%</div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                Key Presentation Strengths
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {presentationScore.keyStrengths.map((str: string, i: number) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '1.25rem', borderRadius: 'var(--radius-xs)' }}>
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                Delivery Optimization Targets
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {presentationScore.improvementRecommendations.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
