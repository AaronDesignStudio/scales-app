import { NextResponse } from 'next/server';
import { SessionDB, DailyPracticeDB } from '@/lib/database';

// POST - Migrate localStorage data to SQLite
export async function POST(request) {
  try {
    const { sessions, dailyPractice } = await request.json();
    let migratedSessions = 0;
    let migratedDailyPractice = false;

    // Migrate sessions
    if (sessions && Array.isArray(sessions)) {
      for (const session of sessions) {
        try {
          // Normalize session data for SQLite
          const sessionData = {
            scale: session.scale,
            practiceType: session.practiceType || session.hand || session.pattern,
            octaves: parseInt(session.octaves),
            bpm: parseInt(session.bpm),
            duration: parseInt(session.duration || 60), // Default duration if missing
            timestamp: session.timestamp || new Date().toISOString(),
            date: session.date || new Date().toDateString()
          };

          // Save to SQLite
          const saved = SessionDB.saveSession(sessionData);
          if (saved) {
            migratedSessions++;
          }
        } catch (error) {
          console.error('Error migrating session:', session, error);
        }
      }
    }

    // Migrate daily practice data
    if (dailyPractice) {
      try {
        const practiceData = {
          date: dailyPractice.date,
          time: parseInt(dailyPractice.time || 0),
          lastUpdated: dailyPractice.lastUpdated || new Date().toISOString()
        };

        const saved = DailyPracticeDB.saveDailyPracticeData(practiceData);
        if (saved) {
          migratedDailyPractice = true;
        }
      } catch (error) {
        console.error('Error migrating daily practice data:', dailyPractice, error);
      }
    }

    return NextResponse.json({
      success: true,
      migratedSessions,
      migratedDailyPractice,
      message: `Successfully migrated ${migratedSessions} sessions${migratedDailyPractice ? ' and daily practice data' : ''}`
    });

  } catch (error) {
    console.error('Error in migration:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Migration failed',
      details: error.message 
    }, { status: 500 });
  }
} 