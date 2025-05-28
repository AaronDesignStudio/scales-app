export const INITIAL_SCALES = [
  { id: 1, name: "C Major", level: "Easy" },
  { id: 2, name: "G Major", level: "Easy" },
  { id: 3, name: "D Major", level: "Intermediate" },
  { id: 4, name: "A Minor", level: "Easy" },
  { id: 5, name: "E Minor", level: "Intermediate" },
  { id: 6, name: "F Major", level: "Advanced" },
  { id: 7, name: "F Major", level: "Advanced" },
];

export const SAMPLE_SESSIONS = [
  { id: 1, scale: "C Major", hand: "Left hand", octaves: 2, bpm: 94 },
  { id: 2, scale: "C Major", pattern: "Staccato", octaves: 3, bpm: 46 },
];

// Last sessions for specific scales
export const SCALE_LAST_SESSIONS = {
  "C Major": [
    { id: 1, scaleId: 1, hand: "Left hand", octaves: 2, bpm: 94 },
    { id: 2, scaleId: 1, pattern: "Two hands", octaves: 3, bpm: 62 },
  ],
  "G Major": [
    { id: 3, scaleId: 2, hand: "Right hand", octaves: 1, bpm: 80 },
  ],
  "D Major": [
    { id: 4, scaleId: 3, pattern: "Contrary Motion", octaves: 2, bpm: 75 },
    { id: 5, scaleId: 3, hand: "Two hands", octaves: 4, bpm: 90 },
  ],
};

// User progress tracking best BPM for each scale-practice-octave combination
export const USER_PROGRESS = {
  "C Major-right-hand-1": { bestBPM: 82 },
  "C Major-right-hand-2": { bestBPM: 62 },
  "C Major-left-hand-2": { bestBPM: 94 },
  "C Major-two-hands-3": { bestBPM: 62 },
  "G Major-right-hand-1": { bestBPM: 80 },
  "D Major-contrary-motion-2": { bestBPM: 75 },
  "D Major-two-hands-4": { bestBPM: 90 },
};

export const SCALE_LEVELS = {
  EASY: "Easy",
  INTERMEDIATE: "Intermediate", 
  ADVANCED: "Advanced"
};

// Real session management functions
export const SessionManager = {
  // Save a new practice session
  saveSession: (sessionData) => {
    try {
      const sessions = SessionManager.getAllSessions();
      const newSession = {
        id: Date.now(), // Use timestamp as unique ID
        ...sessionData,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString()
      };
      
      sessions.unshift(newSession); // Add to beginning of array
      
      // Keep only the last 50 sessions to prevent localStorage bloat
      const trimmedSessions = sessions.slice(0, 50);
      
      localStorage.setItem('practiceSessionsHistory', JSON.stringify(trimmedSessions));
      
      return newSession;
    } catch (error) {
      console.error('Error saving session:', error);
      return null;
    }
  },

  // Save a unique practice session (removes duplicates for same exercise)
  saveUniqueSession: (sessionData) => {
    try {
      // Remove any existing session with the same configuration
      SessionManager.removeDuplicateSession(sessionData.scale, sessionData.practiceType, sessionData.octaves);
      
      // Now save the new session
      return SessionManager.saveSession(sessionData);
    } catch (error) {
      console.error('Error saving unique session:', error);
      return null;
    }
  },

  // Remove duplicate sessions for the same exercise configuration
  removeDuplicateSession: (scale, practiceType, octaves) => {
    try {
      const sessions = SessionManager.getAllSessions();
      const filteredSessions = sessions.filter(session => {
        return !(session.scale === scale && 
                 session.practiceType === practiceType && 
                 session.octaves === octaves);
      });
      
      localStorage.setItem('practiceSessionsHistory', JSON.stringify(filteredSessions));
    } catch (error) {
      console.error('Error removing duplicate session:', error);
    }
  },

  // Get all sessions from localStorage
  getAllSessions: () => {
    try {
      const stored = localStorage.getItem('practiceSessionsHistory');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  // Get recent sessions (last 10)
  getRecentSessions: () => {
    const sessions = SessionManager.getAllSessions();
    return sessions.slice(0, 10);
  },

  // Get last 20 sessions for "View All" modal
  getLast20Sessions: () => {
    const sessions = SessionManager.getAllSessions();
    return sessions.slice(0, 20);
  },

  // Get sessions for a specific scale
  getSessionsForScale: (scaleName) => {
    const sessions = SessionManager.getAllSessions();
    return sessions.filter(session => session.scale === scaleName);
  },

  // Get last 2 sessions for a specific scale (for modal display)
  getLastSessionsForScale: (scaleName) => {
    const sessions = SessionManager.getSessionsForScale(scaleName);
    return sessions.slice(0, 2);
  },

  // Clear all sessions (for testing/reset)
  clearAllSessions: () => {
    localStorage.removeItem('practiceSessionsHistory');
    console.log('All sessions cleared');
  },

  // Get practice stats
  getPracticeStats: () => {
    const sessions = SessionManager.getAllSessions();
    const today = new Date().toDateString();
    
    return {
      totalSessions: sessions.length,
      todaySessions: sessions.filter(s => s.date === today).length,
      totalPracticeTime: sessions.reduce((total, session) => total + (session.duration || 0), 0),
      favoriteScale: SessionManager.getMostPracticedScale(sessions)
    };
  },

  // Helper to get most practiced scale
  getMostPracticedScale: (sessions) => {
    const scaleCount = {};
    sessions.forEach(session => {
      scaleCount[session.scale] = (scaleCount[session.scale] || 0) + 1;
    });
    
    let mostPracticed = null;
    let maxCount = 0;
    Object.entries(scaleCount).forEach(([scale, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPracticed = scale;
      }
    });
    
    return mostPracticed;
  },

  // Check if a specific exercise has been practiced before
  hasExerciseBeenPracticed: (scale, practiceType) => {
    try {
      const sessions = SessionManager.getAllSessions();
      return sessions.some(session => {
        return session.scale === scale && 
               (session.practiceType === practiceType || 
                session.hand === practiceType || 
                session.pattern === practiceType);
      });
    } catch (error) {
      console.error('Error checking exercise history:', error);
      return false;
    }
  },

  // Get all practiced exercise combinations for a specific scale
  getPracticedExercisesForScale: (scale) => {
    try {
      const sessions = SessionManager.getAllSessions();
      const practicedTypes = new Set();
      
      sessions.forEach(session => {
        if (session.scale === scale) {
          const practiceType = session.practiceType || session.hand || session.pattern;
          if (practiceType) {
            practicedTypes.add(practiceType);
          }
        }
      });
      
      return Array.from(practicedTypes);
    } catch (error) {
      console.error('Error getting practiced exercises:', error);
      return [];
    }
  }
}; 