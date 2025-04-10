import React from 'react';
import { Link } from 'react-router-dom';
import SessionTracker from '../components/SessionTracker';

const StatsPage = ({ isPlaying }) => {
  return (
    <div className="stats-page">
      <div className="stats-header">
        <Link to="/" className="back-button">← Back to Meditation</Link>
        <h1>Meditation Statistics</h1>
      </div>
      <SessionTracker isPlaying={isPlaying} />
    </div>
  );
};

export default StatsPage;
