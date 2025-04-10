import React, { useState, useEffect } from 'react';

const MeditationTimer = ({ isPlaying }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timerInterval;
    if (isPlaying) {
      timerInterval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isPlaying]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const pad = (num) => num.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
    }
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  return (
    <div className="meditation-timer">
      <div className="timer-display">
        {formatTime(elapsedTime)}
      </div>
    </div>
  );
};

export default MeditationTimer;
