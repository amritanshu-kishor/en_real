import React, { useEffect, useState, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { ApiService } from '../services/api';
import { SpeechService } from '../services/speech';
import { Scenario, Message } from '../types';
import { AudioWaveform } from '../components/AudioWaveform';
import { ComplicationAlert } from '../components/ComplicationAlert';

interface LiveSimulationPageProps {
  scenarioId: string;
  onEndSimulation: (sessionId: string) => void;
  onExit: () => void;
}

export const LiveSimulationPage: React.FC<LiveSimulationPageProps> = ({
  scenarioId,
  onEndSimulation,
  onExit
}) => {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeakingAi, setIsSpeakingAi] = useState(false);
  const [activeComplication, setActiveComplication] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const recordingStartTime = useRef<number>(0);

  const [isVoiceMuted, setIsVoiceMuted] = useState(SpeechService.isMuted());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  useEffect(() => {
    const unsub = SpeechService.onSpeakingStateChange((speaking) => {
      setIsSpeakingAi(speaking);
    });

    const initSession = async () => {
      try {
        setLoading(true);
        const sc = await ApiService.getScenarioById(scenarioId);
        setScenario(sc);

        const { session, initialMessage } = await ApiService.startSession(scenarioId);
        setSessionId(session.id);
        setMessages([initialMessage]);

        // Safely initiate voice playback
        SpeechService.speakText(initialMessage.content);
      } catch (err) {
        console.error('Failed to initiate live simulation session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    return () => {
      unsub();
      SpeechService.stopSpeaking();
      SpeechService.stopListening();
    };
  }, [scenarioId]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecordingAndSend();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setVoiceError(null);
    recordingStartTime.current = Date.now();

    const handler = SpeechService.startListening({
      onResult: (transcript, isFinal) => {
        setUserInput(transcript);
        if (isFinal) {
          setTimeout(() => {
            stopRecordingAndSend();
          }, 800);
        }
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setVoiceError('Microphone audio unavailable. You can type freely using text input.');
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });

    recognitionRef.current = handler;
    setIsRecording(true);
  };

  const stopRecordingAndSend = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = userInput.trim();
    if (!textToSend || isAiResponding || !sessionId) return;

    setUserInput('');
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const durationSeconds = recordingStartTime.current > 0
      ? Math.max(1.5, Math.round((Date.now() - recordingStartTime.current) / 100) / 10)
      : 3.0;
    recordingStartTime.current = 0;

    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      session_id: sessionId,
      sender: 'user',
      content: textToSend,
      audio_duration: durationSeconds,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsAiResponding(true);

    try {
      const response = await ApiService.sendTurn({
        sessionId,
        userInput: textToSend,
        audioDuration: durationSeconds
      });

      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        response.userMessage,
        response.aiMessage
      ]);

      if (response.complicationAlert) {
        setActiveComplication(response.complicationAlert);
      }

      setIsSpeakingAi(true);
      await SpeechService.speakText(response.aiMessage.content);
      setIsSpeakingAi(false);
    } catch (err: any) {
      console.error('Turn communication error:', err);
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleCompleteSimulation = async () => {
    try {
      SpeechService.stopSpeaking();
      await ApiService.endSession(sessionId);
      onEndSimulation(sessionId);
    } catch (err) {
      console.error('Failed to finalize session:', err);
      onEndSimulation(sessionId);
    }
  };

  if (loading || !scenario) {
    return (
      <div className="content-container" style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ width: '24px', height: '24px', border: '1px solid #2A2A2A', borderTopColor: '#FF5C2B', borderRadius: 0, margin: '0 auto 1rem auto', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#555555', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Initializing simulation...</p>
      </div>
    );
  }

  const userTurnsCount = messages.filter(m => m.sender === 'user').length;

  return (
    <div className="content-container" style={{ maxWidth: '980px', paddingBottom: '3rem' }}>
      {/* Simulation Header */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #1E1E1E', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                {scenario.category}
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                padding: '0.12rem 0.45rem',
                border: '1px solid #2A2A2A',
                color: '#8C8C8C'
              }}>
                {scenario.difficulty}
              </span>
              <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#FF5C2B', fontWeight: 700, textTransform: 'uppercase' }}>
                Turn {userTurnsCount}
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#F5F5F0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {scenario.title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => {
                const muted = SpeechService.toggleMute();
                setIsVoiceMuted(muted);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem' }}
              title={isVoiceMuted ? 'Voice is Muted' : 'Voice is Active'}
            >
              <Volume2 size={13} />
              <span>{isVoiceMuted ? 'Muted' : 'Voice'}</span>
            </button>
            <button onClick={onExit} className="btn btn-secondary">Exit</button>
            <button
              onClick={handleCompleteSimulation}
              disabled={userTurnsCount === 0}
              className="btn btn-primary"
            >
              <span>Conclude</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Objective + Counterpart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: '#555555', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Objective</div>
            <div style={{ fontSize: '0.9rem', color: '#F5F5F0', lineHeight: 1.6 }}>{scenario.objective}</div>
          </div>

          <div style={{
            background: isSpeakingAi ? 'rgba(255,92,43,0.05)' : 'transparent',
            border: isSpeakingAi ? '1px solid rgba(255,92,43,0.3)' : '1px solid #2A2A2A',
            padding: '0.85rem 1rem',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Counterpart</div>
              {isSpeakingAi ? (
                <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#FF5C2B', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                  <span style={{ width: '5px', height: '5px', background: '#FF5C2B', display: 'inline-block', animation: 'ping 1s infinite' }} />
                  SPEAKING
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const lastAiMsg = [...messages].reverse().find(m => m.sender === 'ai');
                    if (lastAiMsg) {
                      SpeechService.unlockAudio();
                      SpeechService.speakText(lastAiMsg.content);
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#555555', cursor: 'pointer', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Volume2 size={11} />
                  <span>Hear</span>
                </button>
              )}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F5F5F0' }}>{scenario.ai_character_name}</div>
            <div style={{ fontSize: '0.74rem', color: '#555555', fontFamily: 'var(--font-mono)' }}>{scenario.ai_character_role}</div>
          </div>
        </div>
      </div>

      {/* Complication Alert if Active */}
      {activeComplication && (
        <ComplicationAlert
          announcement={activeComplication}
          onDismiss={() => setActiveComplication(null)}
        />
      )}

      {/* Conversation Thread */}
      <div style={{
        background: '#111111',
        border: '1px solid #2A2A2A',
        padding: '1.5rem',
        marginBottom: '1.25rem',
        minHeight: '380px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="chat-container" style={{ flex: 1, minHeight: '340px' }}>
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id || idx}
                className={`message-row ${isUser ? 'message-row-user' : 'message-row-ai'}`}
              >
                <div className={isUser ? 'avatar-user' : 'avatar-ai'}>
                  {isUser ? 'ME' : 'OP'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '85%' }}>
                  <div style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: isUser ? 'flex-end' : 'flex-start'
                  }}>
                    <span>{isUser ? 'You' : scenario.ai_character_name}</span>
                    {msg.audio_duration ? <span>· {msg.audio_duration}s</span> : null}
                  </div>

                  <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-ai'}`} style={{ position: 'relative' }}>
                    {msg.content}

                    {!isUser && (
                      <button
                        onClick={() => {
                          SpeechService.unlockAudio();
                          SpeechService.speakText(msg.content);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #2A2A2A',
                          color: '#FF5C2B',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          marginLeft: '0.65rem',
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.62rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          verticalAlign: 'middle',
                        }}
                        title="Replay voice"
                      >
                        <Volume2 size={11} />
                        <span>Hear</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isAiResponding && (
            <div className="message-row message-row-ai">
              <div className="avatar-ai">OP</div>
              <div className="message-bubble bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', border: '1px solid #2A2A2A', borderTopColor: '#FF5C2B', borderRadius: 0, animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                <span style={{ fontSize: '0.8rem', color: '#555555', fontFamily: 'var(--font-mono)' }}>
                  {scenario.ai_character_name} is formulating...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {voiceError && (
        <div style={{
          background: '#111111',
          border: '1px solid #2A2A2A',
          padding: '0.65rem 0.85rem',
          fontSize: '0.78rem',
          color: '#8C8C8C',
          marginBottom: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontFamily: 'var(--font-mono)'
        }}>
          <AlertCircle size={14} />
          {voiceError}
        </div>
      )}

      {/* Input Console */}
      <form onSubmit={handleSendMessage} className="audio-bar-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={toggleRecording}
            className={`audio-record-btn ${isRecording ? 'recording' : ''}`}
            title={isRecording ? 'Stop Recording' : 'Voice Input (Speech-to-Text)'}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <AudioWaveform isRecording={isRecording} isPlaying={isSpeakingAi} width={120} height={30} />
        </div>

        <input
          type="text"
          className="input-field"
          style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.6rem 0.5rem' }}
          placeholder={isRecording ? 'Listening in real-time...' : 'Type your spoken response or use microphone...'}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isAiResponding}
        />

        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.15rem' }}
          disabled={!userInput.trim() || isAiResponding}
        >
          <Send size={13} />
          <span>Respond</span>
        </button>
      </form>

      {/* Conversation Starters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
          Starters
        </span>
        {[
          "I understand your position, but specifically...",
          "Let's look at the documented benchmark...",
          "I propose a constructive compromise where...",
          "Given the urgent constraints, what if we..."
        ].map((starter, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setUserInput(starter)}
            style={{
              background: 'transparent',
              border: '1px solid #2A2A2A',
              padding: '0.2rem 0.6rem',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-body)',
              color: '#555555',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'border-color 0.12s, color 0.12s'
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#FF5C2B'; b.style.color = '#FF5C2B'; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.borderColor = '#2A2A2A'; b.style.color = '#555555'; }}
          >
            {starter}
          </button>
        ))}
      </div>
    </div>
  );
};
