import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';

const SessionTracker = ({ isPlaying }) => {
  const [sessions, setSessions] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Load sessions from localStorage on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('meditationSessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
    calculateStreaks(JSON.parse(savedSessions || '[]'));
  }, []);

  // Handle session tracking when meditation starts/stops
  useEffect(() => {
    if (isPlaying && !sessionStartTime) {
      setSessionStartTime(new Date());
    } else if (!isPlaying && sessionStartTime) {
      const endTime = new Date();
      const duration = Math.round((endTime - sessionStartTime) / 1000); // duration in seconds
      
      // Only record sessions that last at least 60 seconds
      if (duration >= 60) {
        const newSession = {
          date: format(sessionStartTime, 'yyyy-MM-dd'),
          duration,
          startTime: sessionStartTime.toISOString(),
          endTime: endTime.toISOString()
        };
        
        const updatedSessions = [...sessions, newSession];
        setSessions(updatedSessions);
        localStorage.setItem('meditationSessions', JSON.stringify(updatedSessions));
        calculateStreaks(updatedSessions);
      }
      setSessionStartTime(null);
    }
  }, [isPlaying, sessionStartTime, sessions]);

  // Calculate meditation streaks
  const calculateStreaks = (sessionsList) => {
    if (!sessionsList.length) return;

    const dates = [...new Set(sessionsList.map(s => s.date))].sort();
    let currentStrk = 1;
    let maxStreak = 1;
    let prevDate = new Date(dates[0]);

    for (let i = 1; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStrk++;
        maxStreak = Math.max(maxStreak, currentStrk);
      } else {
        currentStrk = 1;
      }
      prevDate = currentDate;
    }

    setCurrentStreak(currentStrk);
    setLongestStreak(maxStreak);
  };

  // Customize calendar tile based on meditation sessions
  const tileContent = ({ date }) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const daySessions = sessions.filter(s => s.date === formattedDate);
    
    if (daySessions.length > 0) {
      const totalDuration = daySessions.reduce((acc, session) => acc + session.duration, 0);
      const minutes = Math.round(totalDuration / 60);
      return (
        <div className="session-marker">
          {minutes}m
        </div>
      );
    }
    return null;
  };

  return (
    <div className="session-tracker">
      <div className="streak-info">
        <div className="streak-box">
          <h3>Current Streak</h3>
          <p>{currentStreak} days</p>
        </div>
        <div className="streak-box">
          <h3>Longest Streak</h3>
          <p>{longestStreak} days</p>
        </div>
      </div>
      <Calendar
        tileContent={tileContent}
        className="meditation-calendar"
      />
    </div>
  );
};

export default SessionTracker;
