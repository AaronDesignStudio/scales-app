import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';

// GET - Initialize database
export async function GET() {
  try {
    initDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Database initialization failed',
      details: error.message 
    }, { status: 500 });
  }
} 