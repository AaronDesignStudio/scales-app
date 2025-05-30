import { NextResponse } from 'next/server';
import { SessionDB, DailyPracticeDB, ScalesDB } from '@/lib/database';

// POST - Database operations
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clearAll':
        // Clear all database tables
        SessionDB.clearAllSessions();
        DailyPracticeDB.clearDailyPracticeData();
        ScalesDB.clearAllScales();
        
        // Reinitialize with default scales
        const defaultScales = ScalesDB.initializeDefaultScales();
        
        return NextResponse.json({ 
          success: true, 
          message: 'All database data cleared successfully',
          defaultScales 
        });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in database operation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 