import React, { useState } from 'react';
import { Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { SpeechService } from '../services/speech';
import { ApiService } from '../services/api';

export const ThinkInEnglishPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'collocations' | 'detector'>('collocations');
  const [customText, setCustomText] = useState('');
  const [detectedIssue, setDetectedIssue] = useState<any | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const collocations = [
    {
      translated: 'I am giving an exam tomorrow.',
      unnatural: 'Direct literal translation of "giving" an examination.',
      native: 'I am taking / sitting for an exam tomorrow.',
      category: 'Academic',
      why: 'In English, students take or sit for exams; only examiners give exams.'
    },
    {
      translated: 'Please open the light before entering.',
      unnatural: 'Physical door metaphor applied to an electric circuit.',
      native: 'Please turn on / switch on the light.',
      category: 'Everyday Idiom',
      why: 'Electrical appliances are turned or switched on, not opened like physical doors.'
    },
    {
      translated: 'I am agree with your proposal.',
      unnatural: 'Part-of-speech error: treating an action verb as an adjective.',
      native: 'I agree with your proposal.',
      category: 'Grammar & Syntax',
      why: '"Agree" is an action verb in English, never preceded by "am".'
    },
    {
      translated: 'We are planning to do a party on Friday.',
      unnatural: 'Collocation mismatch with social events.',
      native: 'We are planning to throw / host a party on Friday.',
      category: 'Social',
      why: 'Native English collocations use "throw", "host", or "have" a party, never "do".'
    },
    {
      translated: 'He was playing with his phone during the meeting.',
      unnatural: 'Toy manipulation metaphor applied to adult smartphone usage.',
      native: 'He was checking / browsing his phone during the meeting.',
      category: 'Workplace',
      why: '"Playing with" implies toy manipulation. For devices, use "checking" or "on his phone".'
    },
    {
      translated: 'Kindly revert back to me with the contract.',
      unnatural: 'Redundant pleonasm (revert already means return).',
      native: 'Kindly reply / get back to me with the contract.',
      category: 'Business English',
      why: '"Revert back" is redundant. In international executive English, use "reply" or "respond".'
    },
    {
      translated: 'I passed out from Oxford in 2022.',
      unnatural: 'Severe idiom confusion ("pass out" means fainting).',
      native: 'I graduated from Oxford in 2022.',
      category: 'Education',
      why: 'Saying "I passed out from college" implies losing consciousness on campus.'
    },
    {
      translated: 'We need to discuss about the budget.',
      unnatural: 'Preposition redundancy after transitive verb.',
      native: 'We need to discuss the budget.',
      category: 'Grammar',
      why: '"Discuss" is transitive and directly takes the direct object without "about".'
    }
  ];

  const handleAuditText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || isAuditing) return;

    setIsAuditing(true);
    setAuditError(null);
    setDetectedIssue(null);

    try {
      const result = await ApiService.auditThinkInEnglish(customText.trim());
      setDetectedIssue(result);
    } catch (err: any) {
      setAuditError(err.message || 'Audit failed — please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="content-container" style={{ maxWidth: '1040px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.35rem', fontWeight: 600 }}>
          Cognitive Workshop // Maternal-Tongue Interference
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
          Think in English
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', maxWidth: '680px', marginTop: '0.25rem' }}>
          Eliminate literal translation traps in your head. Isolate maternal-tongue interference and master instinctive native collocations.
        </p>
      </div>

      {/* Understated Mode Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('collocations')}
          style={{
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'collocations' ? 600 : 500,
            borderRadius: 'var(--radius-xs)',
            border: '1px solid',
            borderColor: activeTab === 'collocations' ? 'var(--border-dark)' : 'var(--border-base)',
            background: activeTab === 'collocations' ? 'var(--bg-secondary)' : 'var(--bg-surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all var(--transition-quick)'
          }}
        >
          Reference Translation Traps
        </button>

        <button
          onClick={() => setActiveTab('detector')}
          style={{
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: activeTab === 'detector' ? 600 : 500,
            borderRadius: 'var(--radius-xs)',
            border: '1px solid',
            borderColor: activeTab === 'detector' ? 'var(--border-dark)' : 'var(--border-base)',
            background: activeTab === 'detector' ? 'var(--bg-secondary)' : 'var(--bg-surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all var(--transition-quick)'
          }}
        >
          Interactive Interference Auditor
        </button>
      </div>

      {/* Tab 1: Collocations List */}
      {activeTab === 'collocations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {collocations.map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-base)',
              borderRadius: 'var(--radius-xs)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  [ {item.category} ]
                </span>
                <button
                  onClick={() => SpeechService.speakText(item.native)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}
                >
                  <Volume2 size={13} color="var(--text-secondary)" />
                  <span>Pronounce</span>
                </button>
              </div>

              <div className="grid-2" style={{ gap: '1.25rem' }}>
                {/* Literal Translation */}
                <div style={{
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '1rem'
                }}>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Literal Mother-Tongue Translation
                  </div>
                  <div style={{ fontSize: '0.96rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    "{item.translated}"
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <strong>Friction: </strong>{item.unnatural}
                  </div>
                </div>

                {/* Native Phrasing */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-base)',
                  borderLeft: '3px solid var(--text-primary)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '1rem'
                }}>
                  <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Native Executive Phrasing
                  </div>
                  <div style={{ fontSize: '0.96rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    "{item.native}"
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    <strong>Why: </strong>{item.why}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Live Detector */}
      {activeTab === 'detector' && (
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-base)',
            borderRadius: 'var(--radius-xs)',
            padding: '2.25rem',
            boxShadow: 'var(--shadow-subtle)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '0.35rem' }}>
              Mother-Tongue Interference Auditor
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Enter any written or spoken phrase to audit for translation traps, false friends, and redundancy.
            </p>

            <form onSubmit={handleAuditText} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea
                className="input-field"
                rows={3}
                placeholder="e.g. 'I am agree with your proposal, so please revert back to me and open the light.'"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setCustomText('I am agree with you and tomorrow I will give an exam, so kindly revert back to me.')}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Load Sample
                </button>
                <button type="submit" className="btn btn-primary" disabled={isAuditing}>
                  {isAuditing ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  <span>{isAuditing ? 'Auditing...' : 'Run Linguistic Audit'}</span>
                </button>
              </div>
            </form>

            {auditError && (
              <div style={{ marginTop: '1.5rem', padding: '0.85rem', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-xs)', color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                <AlertCircle size={14} style={{ display: 'inline', marginRight: '0.35rem' }} />
                {auditError}
              </div>
            )}

            {detectedIssue && (
              <div style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-base)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    [ Diagnostic Audit ]
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {detectedIssue.matched}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                  }}>
                    Naturalness Index: {detectedIssue.naturalnessScore}/100
                  </span>
                </div>

                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-xs)' }}>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      What's Unnatural
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {detectedIssue.unnatural}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-base)', borderLeft: '3px solid var(--text-primary)', padding: '1rem', borderRadius: 'var(--radius-xs)' }}>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-primary)', fontWeight: 700 }}>
                      How A Natural Speaker Says It
                    </div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                      {detectedIssue.better}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Why: </strong>
                  {detectedIssue.why}
                </div>

                {detectedIssue.detectedMistakes && detectedIssue.detectedMistakes.length > 1 && (
                  <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
                      All {detectedIssue.detectedMistakes.length} Detected Issues
                    </div>
                    {detectedIssue.detectedMistakes.map((m: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.82rem', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>"{m.phrase}"</span>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>→ {m.correction}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
