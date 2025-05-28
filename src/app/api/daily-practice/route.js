import { NextResponse } from 'next/server';
import { DailyPracticeDB } from '@/lib/database';

// GET - Fetch daily practice data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const practiceData = DailyPracticeDB.getDailyPracticeData(date);
    return NextResponse.json(practiceData);
  } catch (error) {
    console.error('Error in daily practice GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save daily practice data
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, practiceData } = body;

    switch (action) {
      case 'save':
        const success = DailyPracticeDB.saveDailyPracticeData(practiceData);
        return NextResponse.json({ success });
      
      case 'clear':
        DailyPracticeDB.clearDailyPracticeData();
        return NextResponse.json({ success: true });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in daily practice POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 