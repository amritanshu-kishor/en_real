import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ShieldCheck, Cpu, Mic, CheckCircle2, Sparkles, Terminal, X } from 'lucide-react';
import { ApiService } from '../services/api';
import { SpeechService } from '../services/speech';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeySaved }) => {
  const [testingSpeech, setTestingSpeech] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [serverConfig, setServerConfig] = useState<{
    hasGeminiKey: boolean;
    engine: string;
    voiceEngine: string;
  } | null>(null);
  const [testSpeechStatus, setTestSpeechStatus] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setIsMuted(SpeechService.isMuted());
      setSelectedVoice(SpeechService.getPreferredVoiceURI());

      // Fetch server environment configuration
      ApiService.getServerConfig()
        .then(cfg => setServerConfig(cfg))
        .catch(() => {
          setServerConfig({
            hasGeminiKey: false,
            engine: 'High-Fidelity Adaptive Simulation Engine',
            voiceEngine: 'Web Speech Neural Synthesis'
          });
        });

      // Load available voices
      SpeechService.getVoicesAsync().then(vList => {
        setVoices(vList.filter(v => v.lang.startsWith('en')));
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const nextMuted = SpeechService.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uri = e.target.value;
    setSelectedVoice(uri);
    SpeechService.setPreferredVoiceURI(uri);
  };

  const handleTestVoice = async () => {
    setTestingSpeech(true);
    setTestSpeechStatus('Synthesizing studio audio...');
    try {
      SpeechService.unlockAudio();
      SpeechService.playAcousticCue('response');
      await SpeechService.speakText("Welcome to English Reality Communication Studio. Audio engine is active and clear.");
      setTestSpeechStatus('Speech synthesis operational!');
      setTimeout(() => setTestSpeechStatus(''), 2500);
    } catch (e) {
      setTestSpeechStatus('Audio active.');
    } finally {
      setTestingSpeech(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(20, 24, 33, 0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-modal" style={{
        maxWidth: '540px',
        width: '100%',
        padding: '2rem',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-base)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.18)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-accent" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                ENVIRONMENT & ENGINE
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                SECURE ARCHITECTURE
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              AI Intelligence & Audio Studio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.4rem', minWidth: 'auto', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Security & Env Status Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.15rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#FF5C2B" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Server Environment (.env) Security
                </span>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-base)',
                background: serverConfig?.hasGeminiKey ? 'rgba(255, 92, 43, 0.1)' : 'var(--bg-tertiary)',
                color: serverConfig?.hasGeminiKey ? '#FF5C2B' : 'var(--text-muted)',
                fontWeight: 700
              }}>
                {serverConfig?.hasGeminiKey ? 'GEMINI CLOUD ACTIVE' : 'LOCAL ENGINE ACTIVE'}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              API keys are safely loaded from the server's <code style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>.env</code> file. They are never entered in or exposed to the client browser.
            </p>

            <div style={{
              background: '#070707',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-xs)',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <Terminal size={14} color="var(--text-muted)" />
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                Set in <span style={{ color: '#FFFFFF', fontWeight: 600 }}>.env</span>: GEMINI_API_KEY=your_key
              </div>
            </div>
          </div>

          {/* AI Voice & Audio Synthesizer */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-sm)',
            padding: '1.15rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Volume2 size={18} color="#FF5C2B" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  AI Spoken Voice & Audio Engine
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleMute}
                className={`btn ${isMuted ? 'btn-secondary' : 'btn-primary'}`}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{isMuted ? 'Voice Muted' : 'Voice Active'}</span>
              </button>
            </div>

            {voices.length > 0 && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                  Character Speech Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={handleVoiceChange}
                  className="input-field"
                  style={{ fontSize: '0.82rem', padding: '0.5rem', width: '100%', cursor: 'pointer' }}
                >
                  <option value="">Default (Natural High-Definition English)</option>
                  {voices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={handleTestVoice}
                disabled={testingSpeech}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem' }}
              >
                <Sparkles size={13} />
                <span>{testingSpeech ? 'Speaking Audio...' : 'Test AI Voice'}</span>
              </button>

              {testSpeechStatus && (
                <span style={{ fontSize: '0.76rem', color: '#FF5C2B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  <CheckCircle2 size={13} />
                  {testSpeechStatus}
                </span>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
              style={{ minWidth: '100px' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
