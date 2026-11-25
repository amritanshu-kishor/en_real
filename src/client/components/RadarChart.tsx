import React from 'react';

interface RadarChartProps {
  scores: {
    grammar: number;
    vocabulary: number;
    fluency: number;
    naturalness: number;
    confidence: number;
    persuasion: number;
  };
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ scores, size = 300 }) => {
  const center = size / 2;
  const radius = (size / 2) - 44;

  const axes = [
    { key: 'grammar',     label: 'Grammar',    score: scores.grammar },
    { key: 'vocabulary',  label: 'Lexicon',    score: scores.vocabulary },
    { key: 'fluency',     label: 'Fluency',    score: scores.fluency },
    { key: 'naturalness', label: 'Natural',    score: scores.naturalness },
    { key: 'confidence',  label: 'Confidence', score: scores.confidence },
    { key: 'persuasion',  label: 'Persuasion', score: scores.persuasion }
  ];

  const totalAxes = axes.length;
  const angleStep = (Math.PI * 2) / totalAxes;
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getCoordinates = (value: number, index: number) => {
    const angle = (index * angleStep) - (Math.PI / 2);
    const r = radius * (value / 100);
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  const points = axes.map((axis, i) => {
    const coords = getCoordinates(axis.score, i);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid webs */}
        {levels.map((level, lvlIdx) => {
          const gridPoints = axes.map((_, i) => {
            const coords = getCoordinates(level * 100, i);
            return `${coords.x},${coords.y}`;
          }).join(' ');

          return (
            <polygon
              key={`grid-${lvlIdx}`}
              points={gridPoints}
              fill="none"
              stroke="#1E1E1E"
              strokeWidth="1"
            />
          );
        })}

        {/* Spokes */}
        {axes.map((axis, i) => {
          const outer = getCoordinates(100, i);
          return (
            <line
              key={`spoke-${axis.key}`}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="#2A2A2A"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon — ELECTRIC ORANGE fill + stroke */}
        <polygon
          points={points}
          fill="rgba(255,92,43,0.08)"
          stroke="#FF5C2B"
          strokeWidth="1.5"
          style={{ transition: 'all 0.4s ease' }}
        />

        {/* Vertices + Labels */}
        {axes.map((axis, i) => {
          const coords = getCoordinates(axis.score, i);
          const outerCoords = getCoordinates(122, i);

          return (
            <g key={`point-${axis.key}`}>
              <rect
                x={coords.x - 2.5}
                y={coords.y - 2.5}
                width="5"
                height="5"
                fill="#FF5C2B"
              />
              <text
                x={outerCoords.x}
                y={outerCoords.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fontWeight="700"
                fill="#555555"
                textDecoration="none"
                letterSpacing="0.06em"
              >
                {axis.label.toUpperCase()}
              </text>
              <text
                x={outerCoords.x}
                y={outerCoords.y + 11}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fontFamily="var(--font-mono)"
                fontWeight="700"
                fill="#FF5C2B"
              >
                {axis.score}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
