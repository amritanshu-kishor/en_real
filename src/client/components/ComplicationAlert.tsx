import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ComplicationAlertProps {
  announcement: string;
  onDismiss?: () => void;
}

export const ComplicationAlert: React.FC<ComplicationAlertProps> = ({ announcement, onDismiss }) => {
  return (
    <div
      style={{
        background: '#141414',
        border: '1px solid #FF5C2B',
        borderLeft: '4px solid #FF5C2B',
        padding: '0.85rem 1.15rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.85rem',
        margin: '1rem 0',
        position: 'relative'
      }}
    >
      <AlertCircle size={18} color="#FF5C2B" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: '#FF5C2B',
          letterSpacing: '0.08em',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase'
        }}>
          Dynamic Constraint Injected
        </div>
        <div style={{ fontSize: '0.88rem', color: '#F5F5F0', marginTop: '0.2rem', lineHeight: 1.5 }}>
          {announcement}
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.2rem',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Dismiss"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};
