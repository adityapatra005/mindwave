import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';

function App() {
  const [baseFreq, setBaseFreq] = useState(200);
  const [beatFreq, setBeatFreq] = useState(10);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentState, setCurrentState] = useState('Alpha waves (8-12 Hz) - Relaxed focus, stress reduction');
  const [waveform, setWaveform] = useState('sine');
  const [ambientSound, setAmbientSound] = useState('none');
  const [ambientVolume, setAmbientVolume] = useState(50);
  const [favorites, setFavorites] = useState([]);

  const audioContextRef = useRef(null);
  const oscillatorLeftRef = useRef(null);
  const oscillatorRightRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const ambientSourceRef = useRef(null);
  const ambientGainRef = useRef(null);

  const initAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    oscillatorLeftRef.current = audioContextRef.current.createOscillator();
    oscillatorRightRef.current = audioContextRef.current.createOscillator();
    gainNodeRef.current = audioContextRef.current.createGain();
    analyserRef.current = audioContextRef.current.createAnalyser();

    oscillatorLeftRef.current.type = waveform;
    oscillatorRightRef.current.type = waveform;

    gainNodeRef.current.gain.value = (volume / 100) * 0.5;

    const merger = audioContextRef.current.createChannelMerger(2);
    oscillatorLeftRef.current.connect(merger, 0, 0);
    oscillatorRightRef.current.connect(merger, 0, 1);
    merger.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    oscillatorLeftRef.current.frequency.setValueAtTime(baseFreq, audioContextRef.current.currentTime);
    oscillatorRightRef.current.frequency.setValueAtTime(baseFreq + Number(beatFreq), audioContextRef.current.currentTime);

    if (ambientSound !== 'none') {
      const response = await fetch(`/sounds/${ambientSound}.mp3`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      ambientSourceRef.current = audioContextRef.current.createBufferSource();
      ambientGainRef.current = audioContextRef.current.createGain();

      ambientSourceRef.current.buffer = audioBuffer;
      ambientSourceRef.current.loop = true;
      ambientGainRef.current.gain.value = ambientVolume * 0.003;

      ambientSourceRef.current.connect(ambientGainRef.current);
      ambientGainRef.current.connect(audioContextRef.current.destination);

      ambientSourceRef.current.start();
    }

    oscillatorLeftRef.current.start();
    oscillatorRightRef.current.start();
  }, [baseFreq, beatFreq, volume, waveform, ambientSound, ambientVolume]);

  const stopAudio = useCallback(() => {
    if (oscillatorLeftRef.current) {
      oscillatorLeftRef.current.stop();
      oscillatorLeftRef.current.disconnect();
      oscillatorLeftRef.current = null;
    }
    if (oscillatorRightRef.current) {
      oscillatorRightRef.current.stop();
      oscillatorRightRef.current.disconnect();
      oscillatorRightRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
    if (ambientSourceRef.current) {
      ambientSourceRef.current.stop();
      ambientSourceRef.current.disconnect();
      ambientSourceRef.current = null;
    }
    if (ambientGainRef.current) {
      ambientGainRef.current.disconnect();
      ambientGainRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      initAudio().catch(console.error);
    } else {
      stopAudio();
    }
  }, [isPlaying, initAudio, stopAudio]);

  const saveFavorite = () => {
    const newFavorite = {
      baseFreq,
      beatFreq,
      volume,
      waveform,
      ambientSound,
      ambientVolume
    };
    setFavorites([...favorites, newFavorite]);
  };

  const loadFavorite = (favorite) => {
    setBaseFreq(favorite.baseFreq);
    setBeatFreq(favorite.beatFreq);
    setVolume(favorite.volume);
    setWaveform(favorite.waveform);
    setAmbientSound(favorite.ambientSound);
    setAmbientVolume(favorite.ambientVolume);
    updateFrequencies();
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const updateVolumeState = (newVolume) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (newVolume / 100) * 0.5;
    }
  };

  const updateFrequencies = () => {
    if (oscillatorLeftRef.current && oscillatorRightRef.current && audioContextRef.current) {
      oscillatorLeftRef.current.frequency.setValueAtTime(baseFreq, audioContextRef.current.currentTime);
      oscillatorRightRef.current.frequency.setValueAtTime(baseFreq + Number(beatFreq), audioContextRef.current.currentTime);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const draw = () => {
      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteTimeDomainData(dataArray);

      ctx.fillStyle = 'rgb(0, 0, 0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(0, 255, 204)';
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (isPlaying) {
      draw();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  return (
    <Routes>
      <Route path="/" element={
        <HomePage
          baseFreq={baseFreq}
          setBaseFreq={setBaseFreq}
          beatFreq={beatFreq}
          setBeatFreq={setBeatFreq}
          volume={volume}
          setVolume={setVolume}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          currentState={currentState}
          setCurrentState={setCurrentState}
          waveform={waveform}
          setWaveform={setWaveform}
          ambientSound={ambientSound}
          setAmbientSound={setAmbientSound}
          ambientVolume={ambientVolume}
          setAmbientVolume={setAmbientVolume}
          updateFrequencies={updateFrequencies}
          updateVolumeState={updateVolumeState}
          canvasRef={canvasRef}
          saveFavorite={saveFavorite}
          loadFavorite={loadFavorite}
          favorites={favorites}
        />
      } />
      <Route path="/stats" element={<StatsPage isPlaying={isPlaying} />} />
    </Routes>
  );
}

export default App;
