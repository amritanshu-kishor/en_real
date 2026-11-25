import React, { useState } from 'react';
import { Copy, Check, Volume2 } from 'lucide-react';
import { SpeechService } from '../services/speech';
import { CorrectionItem } from '../types';

interface EvidenceCardProps {
  item: CorrectionItem;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ item }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.betterVersion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIssueLabel = () => {
    switch (item.issueType) {
      case 'grammar':          return 'Grammar';
      case 'unnatural_phrasing': return 'Idiomatic';
      case 'filler':           return 'Verbal Economy';
      case 'vocabulary':       return 'Lexical Choice';
      default:                 return 'Rhetoric';
    }
  };

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #2A2A2A',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '0.62rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#FF5C2B',
          padding: '0.18rem 0.5rem',
          border: '1px solid rgba(255,92,43,0.3)',
        }}>
          {getIssueLabel()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => {
              SpeechService.unlockAudio();
              SpeechService.speakText(item.betterVersion);
            }}
            style={{
              background: 'transparent',
              border: '1px solid #2A2A2A',
              padding: '0.2rem 0.55rem',
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#555555',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'color 0.12s'
            }}
            title="Listen to native pronunciation"
          >
            <Volume2 size={11} />
            <span>Hear</span>
          </button>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#FF5C2B' : 'transparent',
              border: '1px solid #2A2A2A',
              padding: '0.2rem 0.55rem',
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: copied ? '#0C0C0C' : '#555555',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.12s'
            }}
            title="Copy phrasing"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Comparison grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
        {/* Spoken */}
        <div style={{
          background: '#161616',
          borderLeft: '2px solid #3D3D3D',
          padding: '0.85rem 1rem',
        }}>
          <div style={{
            fontSize: '0.58rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            color: '#555555',
            fontWeight: 700,
            letterSpacing: '0.06em',
            marginBottom: '0.35rem'
          }}>
            Spoken
          </div>
          <div style={{ color: '#8C8C8C', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.55 }}>
            "{item.originalText}"
          </div>
        </div>

        {/* Revision */}
        <div style={{
          background: '#161616',
          borderLeft: '2px solid #FF5C2B',
          padding: '0.85rem 1rem',
        }}>
          <div style={{
            fontSize: '0.58rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            color: '#FF5C2B',
            fontWeight: 700,
            letterSpacing: '0.06em',
            marginBottom: '0.35rem'
          }}>
            Native Revision
          </div>
          <div style={{ color: '#F5F5F0', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.55 }}>
            {item.betterVersion}
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div style={{
        borderTop: '1px solid #1E1E1E',
        paddingTop: '0.75rem',
        fontSize: '0.82rem',
        lineHeight: 1.6
      }}>
        <div style={{ marginBottom: '0.3rem' }}>
          <span style={{ fontWeight: 700, color: '#F5F5F0' }}>Analysis: </span>
          <span style={{ color: '#8C8C8C' }}>{item.issueDescription}</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, color: '#555555' }}>Rationale: </span>
          <span style={{ color: '#555555' }}>{item.whyExplanation}</span>
        </div>
      </div>
    </div>
  );
};
