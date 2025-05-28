import Database from 'better-sqlite3';
import path from 'path';

// Database file path
const dbPath = path.join(process.cwd(), 'data', 'scales.db');

// Initialize database
let db;

export function initDatabase() {
  try {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    
    // Use safer journal mode for development
    try {
      db.pragma('journal_mode = DELETE');
    } catch (pragmaError) {
      console.warn('Could not set journal mode, continuing with default:', pragmaError.message);
    }
    
    // Create tables
    createTables();
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    
    // If database is corrupted, try to remove it and recreate
    if (error.code === 'SQLITE_IOERR_SHORT_READ' || error.code === 'SQLITE_CORRUPT') {
      console.log('Database appears corrupted, attempting to recreate...');
      try {
        const fs = require('fs');
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
          console.log('Removed corrupted database file');
        }
        
        // Try to initialize again
        db = new Database(dbPath);
        db.pragma('journal_mode = DELETE');
        createTables();
        console.log('Database recreated successfully');
        return db;
      } catch (retryError) {
        console.error('Failed to recreate database:', retryError);
        throw retryError;
      }
    }
    
    throw error;
  }
}

function createTables() {
  // Practice sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scale TEXT NOT NULL,
      practice_type TEXT NOT NULL,
      octaves INTEGER NOT NULL,
      bpm INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Daily practice data table
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_practice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      total_time INTEGER NOT NULL DEFAULT 0,
      last_updated TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User scales collection table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_scales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      level TEXT NOT NULL,
      sharps INTEGER NOT NULL DEFAULT 0,
      flats INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_scale_type_octaves 
    ON practice_sessions(scale, practice_type, octaves)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_date 
    ON practice_sessions(date)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_timestamp 
    ON practice_sessions(timestamp DESC)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_scales_name 
    ON user_scales(name)
  `);

  console.log('Database tables created successfully');
}

// Get database instance
export function getDatabase() {
  if (!db) {
    try {
      initDatabase();
    } catch (error) {
      console.error('Failed to get database instance:', error);
      throw error;
    }
  }
  return db;
}

// Practice Sessions Operations
export const SessionDB = {
  // Save a new practice session
  saveSession: (sessionData) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO practice_sessions (scale, practice_type, octaves, bpm, duration, timestamp, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        sessionData.scale,
        sessionData.practiceType,
        sessionData.octaves,
        sessionData.bpm,
        sessionData.duration,
        sessionData.timestamp || new Date().toISOString(),
        sessionData.date || new Date().toDateString()
      );
      
      return { id: result.lastInsertRowid, ...sessionData };
    } catch (error) {
      console.error('Error saving session:', error);
      return null;
    }
  },

  // Save unique session (remove duplicates for same exercise)
  saveUniqueSession: (sessionData) => {
    try {
      const db = getDatabase();
      
      // Start transaction
      const transaction = db.transaction(() => {
        // Remove existing session with same configuration
        const deleteStmt = db.prepare(`
          DELETE FROM practice_sessions 
          WHERE scale = ? AND practice_type = ? AND octaves = ?
        `);
        deleteStmt.run(sessionData.scale, sessionData.practiceType, sessionData.octaves);
        
        // Insert new session
        const insertStmt = db.prepare(`
          INSERT INTO practice_sessions (scale, practice_type, octaves, bpm, duration, timestamp, date)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertStmt.run(
          sessionData.scale,
          sessionData.practiceType,
          sessionData.octaves,
          sessionData.bpm,
          sessionData.duration,
          sessionData.timestamp || new Date().toISOString(),
          sessionData.date || new Date().toDateString()
        );
        
        return { id: result.lastInsertRowid, ...sessionData };
      });
      
      return transaction();
    } catch (error) {
      console.error('Error saving unique session:', error);
      return null;
    }
  },

  // Get all sessions
  getAllSessions: () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM practice_sessions 
        ORDER BY timestamp DESC 
        LIMIT 50
      `);
      return stmt.all();
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  },

  // Get recent sessions
  getRecentSessions: (limit = 10) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM practice_sessions 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  },

  // Get sessions for a specific scale
  getSessionsForScale: (scaleName) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM practice_sessions 
        WHERE scale = ? 
        ORDER BY timestamp DESC
      `);
      return stmt.all(scaleName);
    } catch (error) {
      console.error('Error getting sessions for scale:', error);
      return [];
    }
  },

  // Get last sessions for a specific scale
  getLastSessionsForScale: (scaleName, limit = 2) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM practice_sessions 
        WHERE scale = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      return stmt.all(scaleName, limit);
    } catch (error) {
      console.error('Error getting last sessions for scale:', error);
      return [];
    }
  },

  // Get best BPM for specific exercise
  getBestBPMForExercise: (scale, practiceType, octaves) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT MAX(bpm) as best_bpm 
        FROM practice_sessions 
        WHERE scale = ? AND practice_type = ? AND octaves = ?
      `);
      
      const result = stmt.get(scale, practiceType, octaves);
      return result?.best_bpm || null;
    } catch (error) {
      console.error('Error getting best BPM:', error);
      return null;
    }
  },

  // Check if exercise has been practiced
  hasExerciseBeenPracticed: (scale, practiceType) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT COUNT(*) as count 
        FROM practice_sessions 
        WHERE scale = ? AND practice_type = ?
      `);
      
      const result = stmt.get(scale, practiceType);
      return result.count > 0;
    } catch (error) {
      console.error('Error checking if exercise practiced:', error);
      return false;
    }
  },

  // Get practiced exercises for a scale
  getPracticedExercisesForScale: (scale) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT DISTINCT practice_type 
        FROM practice_sessions 
        WHERE scale = ?
      `);
      
      const results = stmt.all(scale);
      return results.map(row => row.practice_type);
    } catch (error) {
      console.error('Error getting practiced exercises:', error);
      return [];
    }
  },

  // Get practice stats
  getPracticeStats: () => {
    try {
      const db = getDatabase();
      const today = new Date().toDateString();
      
      // Total sessions
      const totalStmt = db.prepare('SELECT COUNT(*) as count FROM practice_sessions');
      const totalSessions = totalStmt.get().count;
      
      // Today's sessions
      const todayStmt = db.prepare('SELECT COUNT(*) as count FROM practice_sessions WHERE date = ?');
      const todaySessions = todayStmt.get(today).count;
      
      // Total practice time
      const timeStmt = db.prepare('SELECT SUM(duration) as total FROM practice_sessions');
      const totalTime = timeStmt.get().total || 0;
      
      // Most practiced scale
      const scaleStmt = db.prepare(`
        SELECT scale, COUNT(*) as count 
        FROM practice_sessions 
        GROUP BY scale 
        ORDER BY count DESC 
        LIMIT 1
      `);
      const favoriteScale = scaleStmt.get()?.scale || null;
      
      return {
        totalSessions,
        todaySessions,
        totalPracticeTime: totalTime,
        favoriteScale
      };
    } catch (error) {
      console.error('Error getting practice stats:', error);
      return {
        totalSessions: 0,
        todaySessions: 0,
        totalPracticeTime: 0,
        favoriteScale: null
      };
    }
  },

  // Clear all sessions
  clearAllSessions: () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM practice_sessions');
      stmt.run();
      console.log('All sessions cleared');
    } catch (error) {
      console.error('Error clearing sessions:', error);
    }
  },

  // Debug function
  debugPracticeTypesForScale: (scale) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT practice_type, octaves, bpm 
        FROM practice_sessions 
        WHERE scale = ?
      `);
      
      const results = stmt.all(scale);
      const practiceTypes = results.map(row => 
        `"${row.practice_type}" (octaves: ${row.octaves}, bpm: ${row.bpm})`
      );
      
      console.log(`Practice types stored for ${scale}:`, practiceTypes);
      return practiceTypes;
    } catch (error) {
      console.error('Error debugging practice types:', error);
      return [];
    }
  }
};

// Daily Practice Operations
export const DailyPracticeDB = {
  // Get daily practice data
  getDailyPracticeData: (date = null) => {
    try {
      const db = getDatabase();
      const targetDate = date || new Date().toDateString();
      
      const stmt = db.prepare(`
        SELECT * FROM daily_practice WHERE date = ?
      `);
      
      return stmt.get(targetDate);
    } catch (error) {
      console.error('Error getting daily practice data:', error);
      return null;
    }
  },

  // Save daily practice data
  saveDailyPracticeData: (practiceData) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO daily_practice (date, total_time, last_updated)
        VALUES (?, ?, ?)
      `);
      
      stmt.run(
        practiceData.date,
        practiceData.time,
        practiceData.lastUpdated
      );
      
      return true;
    } catch (error) {
      console.error('Error saving daily practice data:', error);
      return false;
    }
  },

  // Clear daily practice data
  clearDailyPracticeData: () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM daily_practice');
      stmt.run();
      console.log('Daily practice data cleared');
    } catch (error) {
      console.error('Error clearing daily practice data:', error);
    }
  }
};

// User Scales Operations
export const ScalesDB = {
  // Get user's scale collection
  getUserScales: () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM user_scales 
        ORDER BY created_at ASC
      `);
      return stmt.all();
    } catch (error) {
      console.error('Error getting user scales:', error);
      return [];
    }
  },

  // Add a scale to user's collection
  addScale: (scale) => {
    try {
      console.log('ScalesDB.addScale called with:', scale);
      
      if (!scale || !scale.name) {
        console.error('Invalid scale data provided:', scale);
        throw new Error('Scale must have a name');
      }
      
      const db = getDatabase();
      console.log('Database instance obtained successfully');
      
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO user_scales (name, level, sharps, flats)
        VALUES (?, ?, ?, ?)
      `);
      
      console.log('Prepared statement created successfully');
      
      const result = stmt.run(
        scale.name,
        scale.level,
        scale.sharps || 0,
        scale.flats || 0
      );
      
      console.log('Insert statement executed, result:', result);
      
      if (result.changes > 0) {
        const addedScale = { id: result.lastInsertRowid, ...scale };
        console.log('Scale added successfully:', addedScale);
        return addedScale;
      } else {
        console.log('Scale already exists in collection:', scale.name);
        return null;
      }
    } catch (error) {
      console.error('Error adding scale - Details:', {
        error: error.message,
        stack: error.stack,
        scaleData: scale
      });
      throw error; // Re-throw to propagate the error
    }
  },

  // Remove a scale from user's collection
  removeScale: (scaleId) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        DELETE FROM user_scales WHERE id = ?
      `);
      
      const result = stmt.run(scaleId);
      return result.changes > 0;
    } catch (error) {
      console.error('Error removing scale:', error);
      return false;
    }
  },

  // Initialize with default scales
  initializeDefaultScales: () => {
    try {
      const db = getDatabase();
      
      // Always ensure minimum required scales exist
      const requiredScales = [
        { name: "C Major", level: "Easy", sharps: 0, flats: 0 },
        { name: "G Major", level: "Easy", sharps: 1, flats: 0 },
        { name: "Bb Major", level: "Intermediate", sharps: 0, flats: 2 },
      ];
      
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO user_scales (name, level, sharps, flats)
        VALUES (?, ?, ?, ?)
      `);
      
      const transaction = db.transaction(() => {
        requiredScales.forEach(scale => {
          insertStmt.run(scale.name, scale.level, scale.sharps, scale.flats);
        });
      });
      
      transaction();
      console.log('Minimum required scales ensured');
      return ScalesDB.getUserScales();
    } catch (error) {
      console.error('Error initializing default scales:', error);
      return [];
    }
  },

  // Reset collection to defaults
  resetToDefaults: () => {
    try {
      const db = getDatabase();
      
      const transaction = db.transaction(() => {
        // Clear existing scales
        const clearStmt = db.prepare('DELETE FROM user_scales');
        clearStmt.run();
        
        // Reinitialize with defaults
        return ScalesDB.initializeDefaultScales();
      });
      
      return transaction();
    } catch (error) {
      console.error('Error resetting scales to defaults:', error);
      return [];
    }
  },

  // Check if scale exists in collection
  scaleExists: (scaleName) => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT COUNT(*) as count FROM user_scales WHERE name = ?
      `);
      
      const result = stmt.get(scaleName);
      return result.count > 0;
    } catch (error) {
      console.error('Error checking if scale exists:', error);
      return false;
    }
  },

  // Clear all user scales
  clearAllScales: () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM user_scales');
      stmt.run();
      console.log('All user scales cleared');
    } catch (error) {
      console.error('Error clearing user scales:', error);
    }
  }
};

// Close database connection
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
} 