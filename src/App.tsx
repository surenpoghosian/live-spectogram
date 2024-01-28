import React, { useRef, useState, useEffect } from 'react';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const Spectrogram: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support getUserMedia API");
      return;
    }

    const initAudioContext = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const newAudioContext = new AudioContext();
        const newAnalyser = newAudioContext.createAnalyser();

        // Adjustable
        newAnalyser.fftSize = 2048; 

        const source = newAudioContext.createMediaStreamSource(stream);
        source.connect(newAnalyser);

        setAudioContext(newAudioContext);
        setAnalyser(newAnalyser);
      } catch (error) {
        console.error('Error accessing the microphone', error);
      }
    };

    initAudioContext();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  useEffect(() => {
    if (analyser && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const renderFrame = () => {
        const width = canvas.width;
        const height = canvas.height;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] * 2;
          ctx.fillStyle = `rgb(${barHeight + 100},50,50)`;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }

        const newAnimationFrameId = requestAnimationFrame(renderFrame);
        setAnimationFrameId(newAnimationFrameId);
      };

      renderFrame();
    }
  }, [analyser]);

  return (
    <div>
      <h1 style={{position:'absolute', color:'white', left:"40px", top:"40px"}}>Spectrogram</h1>
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />
    </div>
  );
};

export default Spectrogram;
