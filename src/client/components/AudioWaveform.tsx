import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  isPlaying?: boolean;
  analyser?: AnalyserNode | null;
  width?: number;
  height?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  isPlaying,
  analyser,
  width = 160,
  height = 32
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (isRecording || isPlaying) {
        if (analyser && dataArray) {
          analyser.getByteFrequencyData(dataArray);
        }

        const barCount = 22;
        const barWidth = 2;
        const gap = (width - barCount * barWidth) / (barCount - 1);

        for (let i = 0; i < barCount; i++) {
          let magnitude = 0.2;

          if (analyser && dataArray) {
            const index = Math.floor((i / barCount) * dataArray.length);
            magnitude = (dataArray[index] / 255.0);
          } else {
            magnitude = 0.2 + 0.7 * Math.abs(
              Math.sin((i * 0.32) + phase) * Math.cos((i * 0.18) - phase * 0.6)
            );
          }

          const barHeight = Math.max(2, magnitude * (height - 4));
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          // Brutalist: flat solid colors — ELECTRIC ORANGE or white
          ctx.fillStyle = isRecording ? '#FF5C2B' : '#F5F5F0';
          ctx.fillRect(x, y, barWidth, barHeight);
        }

        phase += 0.14;
      } else {
        // Idle: subtle flat dashes
        ctx.fillStyle = '#2A2A2A';
        const dotCount = 18;
        const gap = width / (dotCount + 1);
        for (let i = 1; i <= dotCount; i++) {
          ctx.fillRect(i * gap - 1, height / 2 - 1, 2, 2);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRecording, isPlaying, analyser, width, height]);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />
    </div>
  );
};
