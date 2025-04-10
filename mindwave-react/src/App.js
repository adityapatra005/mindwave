import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [baseFreq, setBaseFreq] = useState(200);
  const [beatFreq, setBeatFreq] = useState(7);
  const [volume, setVolume] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentState, setCurrentState] = useState('Theta waves (4-7 Hz) - Meditation, deep relaxation');
  const audioContextRef = useRef(null);
  const oscillatorLeftRef = useRef(null);
  const oscillatorRightRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Initialize audio
    const initAudio = async () => {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = (volume / 100) * 0.5;  // Initial volume
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      oscillatorLeftRef.current = audioContextRef.current.createOscillator();
      oscillatorRightRef.current = audioContextRef.current.createOscillator();
      
      // Set initial frequencies
      oscillatorLeftRef.current.frequency.setValueAtTime(baseFreq, audioContextRef.current.currentTime);
      oscillatorRightRef.current.frequency.setValueAtTime(baseFreq + beatFreq, audioContextRef.current.currentTime);
      
      const merger = audioContextRef.current.createChannelMerger(2);

      oscillatorLeftRef.current.connect(merger, 0, 0);
      oscillatorRightRef.current.connect(merger, 0, 1);
      merger.connect(gainNodeRef.current);
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      oscillatorLeftRef.current.start();
      oscillatorRightRef.current.start();
    };

    initAudio();

    return () => {
      // Cleanup
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);  // Empty dependency array for one-time init

  const updateFrequencies = () => {
    if (oscillatorLeftRef.current && oscillatorRightRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      // Left ear gets the base frequency
      oscillatorLeftRef.current.frequency.setValueAtTime(parseFloat(baseFreq), now);
      // Right ear gets base frequency plus beat frequency
      oscillatorRightRef.current.frequency.setValueAtTime(parseFloat(baseFreq) + parseFloat(beatFreq), now);
    }
  };

  const updateVolumeState = (newVolume) => {
    if (gainNodeRef.current) {
      const volumeValue = Math.min((newVolume / 100) * 0.5, 0.5);
      gainNodeRef.current.gain.setValueAtTime(volumeValue, audioContextRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      audioContextRef.current.suspend();
    } else {
      audioContextRef.current.resume();
    }
  };

  useEffect(() => {
    if (analyserRef.current && canvasRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvasCtx = canvasRef.current.getContext('2d');
      
      const draw = () => {
        requestAnimationFrame(draw);
        analyserRef.current.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = 'rgba(26, 26, 26, 0.2)';
        canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 255, 204)';
        canvasCtx.beginPath();
        const sliceWidth = canvasRef.current.width * 1.0 / bufferLength;
        let x = 0;
        for(let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * canvasRef.current.height / 2;
          if(i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        canvasCtx.lineTo(canvasRef.current.width, canvasRef.current.height / 2);
        canvasCtx.stroke();
      };
      if (isPlaying) draw();
    }
  }, [isPlaying]);

  // Render UI
  return (
    <div className="App">
      <h1>MindWave</h1>
      <div className="controls">
        <div className="frequency-control">
          <label>Base Frequency: {baseFreq} Hz</label>
          <input type="range" min="100" max="500" value={baseFreq} onChange={(e) => {setBaseFreq(e.target.value); updateFrequencies();}} />
        </div>
        <div className="frequency-control">
          <label>Beat Frequency: {beatFreq} Hz</label>
          <input type="range" min="1" max="40" value={beatFreq} onChange={(e) => {setBeatFreq(e.target.value); updateFrequencies();}} />
        </div>
        <div className="frequency-control">
          <label>Volume: {volume}%</label>
          <input type="range" min="0" max="100" value={volume} onChange={(e) => {setVolume(e.target.value); updateVolumeState(e.target.value);}} />
        </div>
        <button className="play-button" onClick={togglePlay}>{isPlaying ? 'Stop' : 'Start'}</button>
        <div className="preset-buttons">
          <button onClick={() => {setBeatFreq(2); updateFrequencies(); setCurrentState('Delta waves (1-4 Hz) - Deep sleep, healing');}}>Delta (1-4 Hz)</button>
          <button onClick={() => {setBeatFreq(6); updateFrequencies(); setCurrentState('Theta waves (4-7 Hz) - Meditation, deep relaxation');}}>Theta (4-7 Hz)</button>
          <button onClick={() => {setBeatFreq(10); updateFrequencies(); setCurrentState('Alpha waves (8-12 Hz) - Relaxed focus, stress reduction');}}>Alpha (8-12 Hz)</button>
          <button onClick={() => {setBeatFreq(20); updateFrequencies(); setCurrentState('Beta waves (13-30 Hz) - Active thinking, focus');}}>Beta (13-30 Hz)</button>
          <button onClick={() => {setBeatFreq(35); updateFrequencies(); setCurrentState('Gamma waves (30-100 Hz) - Higher mental activity, perception');}}>Gamma (30-100 Hz)</button>
        </div>
      </div>
      <div className="visualization">
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="info">
        <p>Current State: {currentState}</p>
      </div>
    </div>
  );
}

export default App;
