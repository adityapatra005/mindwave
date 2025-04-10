import React from 'react';
import { Link } from 'react-router-dom';
import MeditationTimer from '../components/MeditationTimer';

const HomePage = ({ 
  baseFreq, setBaseFreq,
  beatFreq, setBeatFreq,
  volume, setVolume,
  isPlaying, togglePlay,
  currentState, setCurrentState,
  waveform, setWaveform,
  ambientSound, setAmbientSound,
  ambientVolume, setAmbientVolume,
  updateFrequencies,
  updateVolumeState,
  canvasRef
}) => {
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
            <select value={waveform} onChange={(e) => setWaveform(e.target.value)}>
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
        <MeditationTimer isPlaying={isPlaying} />
        <Link to="/stats" className="stats-link">View Meditation Stats →</Link>
      </div>
    </div>
  );
};

export default HomePage;
