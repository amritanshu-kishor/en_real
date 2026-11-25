import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  size = 160,
  label = 'Proficiency Index',
  sublabel
}) => {
  const strokeWidth = 5;
  const radius = (size / 2) - strokeWidth - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let grade = 'Proficient';
  if (score >= 90) {
    grade = 'C2 Mastery';
  } else if (score >= 80) {
    grade = 'C1 Advanced';
  } else if (score >= 70) {
    grade = 'B2 Competent';
  } else {
    grade = 'B1 Intermediate';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1E1E1E"
            strokeWidth={strokeWidth}
          />
          {/* Active Arc — ELECTRIC ORANGE */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#FF5C2B"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="square"
            style={{
              transition: 'stroke-dashoffset 0.8s ease',
            }}
          />
        </svg>

        {/* Center Numbers */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{
            fontSize: size > 140 ? '2.4rem' : '1.65rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: '#F5F5F0',
            letterSpacing: '-0.04em',
            lineHeight: 1
          }}>
            {score}
          </span>
          <span style={{
            fontSize: '0.58rem',
            fontFamily: 'var(--font-mono)',
            color: '#555555',
            fontWeight: 700,
            marginTop: '0.3rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            {grade}
          </span>
        </div>
      </div>

      {label && (
        <div style={{
          marginTop: '0.75rem',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#F5F5F0',
          letterSpacing: '-0.01em',
          fontFamily: 'var(--font-body)'
        }}>
          {label}
        </div>
      )}

      {sublabel && (
        <div style={{
          fontSize: '0.7rem',
          color: '#555555',
          marginTop: '0.2rem',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
};
