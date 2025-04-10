import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [baseFreq, setBaseFreq] = useState(200);
  const [beatFreq, setBeatFreq] = useState(7);
  const [volume, setVolume] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentState, setCurrentState] = useState('Theta waves (4-7 Hz) - Meditation, deep relaxation');
  const [waveform, setWaveform] = useState('sine');
  const [ambientSound, setAmbientSound] = useState('none');
  const [ambientVolume, setAmbientVolume] = useState(30);
  const [favorites, setFavorites] = useState([]);
  
  // Refs for ambient sounds
  const ambientSourceRef = useRef(null);
  const ambientGainRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorLeftRef = useRef(null);
  const oscillatorRightRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);

  const initAudio = async () => {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = (volume / 100) * 0.5;  // Initial volume
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      oscillatorLeftRef.current = audioContextRef.current.createOscillator();
      oscillatorRightRef.current = audioContextRef.current.createOscillator();
      
      // Set waveform type
      oscillatorLeftRef.current.type = waveform;
      oscillatorRightRef.current.type = waveform;
      
      // Set initial frequencies
      oscillatorLeftRef.current.frequency.setValueAtTime(baseFreq, audioContextRef.current.currentTime);
      oscillatorRightRef.current.frequency.setValueAtTime(baseFreq + beatFreq, audioContextRef.current.currentTime);
      
      // Setup ambient sound if selected
      if (ambientSound !== 'none') {
        ambientSourceRef.current = audioContextRef.current.createBufferSource();
        ambientGainRef.current = audioContextRef.current.createGain();
        ambientGainRef.current.gain.value = ambientVolume / 100;
        
        // Load and play ambient sound
        fetch(`/ambient/${ambientSound}.mp3`)
          .then(response => response.arrayBuffer())
          .then(data => audioContextRef.current.decodeAudioData(data))
          .then(buffer => {
            ambientSourceRef.current.buffer = buffer;
            ambientSourceRef.current.loop = true;
            ambientSourceRef.current.connect(ambientGainRef.current);
            ambientGainRef.current.connect(audioContextRef.current.destination);
            if (isPlaying) {
              ambientSourceRef.current.start();
            }
          });
      }
      
      const merger = audioContextRef.current.createChannelMerger(2);

      oscillatorLeftRef.current.connect(merger, 0, 0);
      oscillatorRightRef.current.connect(merger, 0, 1);
      merger.connect(gainNodeRef.current);
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    };

  const stopAudio = () => {
    try {
      if (oscillatorLeftRef.current && isPlaying) {
        oscillatorLeftRef.current.stop();
        oscillatorLeftRef.current.disconnect();
      }
      if (oscillatorRightRef.current && isPlaying) {
        oscillatorRightRef.current.stop();
        oscillatorRightRef.current.disconnect();
      }
      if (ambientSourceRef.current) {
        ambientSourceRef.current.stop();
        ambientSourceRef.current.disconnect();
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
      if (ambientGainRef.current) {
        ambientGainRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    } catch (error) {
      console.log('Audio cleanup error:', error);
    }
  };

  const saveFavorite = () => {
    const newFavorite = {
      name: `Custom ${favorites.length + 1}`,
      baseFreq,
      beatFreq,
      waveform,
      ambientSound,
      ambientVolume
    };
    setFavorites([...favorites, newFavorite]);
    localStorage.setItem('mindwave-favorites', JSON.stringify([...favorites, newFavorite]));
  };

  const loadFavorite = (favorite) => {
    setBaseFreq(favorite.baseFreq);
    setBeatFreq(favorite.beatFreq);
    setWaveform(favorite.waveform);
    setAmbientSound(favorite.ambientSound);
    setAmbientVolume(favorite.ambientVolume);
    updateFrequencies();
  };

  useEffect(() => {
    initAudio();
    
    // Cleanup function
    return () => {
      stopAudio();
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

  const updateVolumeState = (value) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = (value / 100) * 0.5;
    }
  };

  const togglePlay = () => {
    if (!isPlaying) {
      // Starting playback
      initAudio().then(() => {
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        oscillatorLeftRef.current.start();
        oscillatorRightRef.current.start();
      });
    } else {
      // Stopping playback
      stopAudio();
    }
    setIsPlaying(!isPlaying);
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
        <div className="sound-customization">
          <div className="waveform-control">
            <label>Waveform Type:</label>
            <select value={waveform} onChange={(e) => {
              setWaveform(e.target.value);
              if (oscillatorLeftRef.current && oscillatorRightRef.current) {
                oscillatorLeftRef.current.type = e.target.value;
                oscillatorRightRef.current.type = e.target.value;
              }
            }}>
              <option value="sine">Sine Wave (smoothest, purest tone)</option>
              <option value="square">Square Wave (harsh, strong)</option>
              <option value="triangle">Triangle Wave (mellow, warm)</option>
              <option value="sawtooth">Sawtooth Wave (buzzy)</option>
            </select>
          </div>
          
          <div className="ambient-control">
            <label>Background Sound:</label>
            <select value={ambientSound} onChange={(e) => setAmbientSound(e.target.value)}>
              <option value="none">None</option>
              <option value="rain">Rain</option>
              <option value="whitenoise">White Noise</option>
              <option value="forest">Forest</option>
              <option value="ocean">Ocean Waves</option>
            </select>
            
            {ambientSound !== 'none' && (
              <div className="frequency-control">
                <label>Ambient Volume: {ambientVolume}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="favorites-section">
          <button className="save-button" onClick={saveFavorite}>Save Current Settings</button>
          {favorites.length > 0 && (
            <div className="favorites-list">
              <h3>Saved Favorites</h3>
              {favorites.map((favorite, index) => (
                <button key={index} onClick={() => loadFavorite(favorite)}>
                  {favorite.name}
                </button>
              ))}
            </div>
          )}
        </div>

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
