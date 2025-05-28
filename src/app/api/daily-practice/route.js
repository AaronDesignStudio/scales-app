import { NextResponse } from 'next/server';
import { DailyPracticeDB, initDatabase } from '@/lib/database';

// GET - Fetch daily practice data
export async function GET(request) {
  try {
    console.log('Daily practice GET request received');
    
    // Ensure database is initialized
    console.log('Initializing database...');
    initDatabase();
    console.log('Database initialized successfully');
    
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    console.log('Requested date:', date);

    console.log('Calling DailyPracticeDB.getDailyPracticeData...');
    const practiceData = DailyPracticeDB.getDailyPracticeData(date);
    console.log('Practice data retrieved:', practiceData);
    
    return NextResponse.json(practiceData || null);
  } catch (error) {
    console.error('Error in daily practice GET:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST - Save daily practice data
export async function POST(request) {
  try {
    console.log('Daily practice POST request received');
    
    // Ensure database is initialized
    console.log('Initializing database...');
    initDatabase();
    console.log('Database initialized successfully');
    
    const body = await request.json();
    console.log('Request body:', body);
    const { action, practiceData } = body;

    switch (action) {
      case 'save':
        console.log('Saving practice data:', practiceData);
        const success = DailyPracticeDB.saveDailyPracticeData(practiceData);
        console.log('Save result:', success);
        return NextResponse.json({ success });
      
      case 'clear':
        console.log('Clearing daily practice data');
        DailyPracticeDB.clearDailyPracticeData();
        return NextResponse.json({ success: true });
      
      default:
        console.log('Invalid action:', action);
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in daily practice POST:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 