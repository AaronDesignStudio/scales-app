import { NextResponse } from 'next/server';
import { SessionDB } from '@/lib/database';

// GET - Fetch sessions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const scale = searchParams.get('scale');
    const limit = searchParams.get('limit');

    switch (action) {
      case 'recent':
        const recentSessions = SessionDB.getRecentSessions(limit ? parseInt(limit) : 10);
        return NextResponse.json(recentSessions);
      
      case 'all':
        const allSessions = SessionDB.getAllSessions();
        return NextResponse.json(allSessions);
      
      case 'forScale':
        if (!scale) {
          return NextResponse.json({ error: 'Scale parameter required' }, { status: 400 });
        }
        const scaleSessions = SessionDB.getSessionsForScale(scale);
        return NextResponse.json(scaleSessions);
      
      case 'lastForScale':
        if (!scale) {
          return NextResponse.json({ error: 'Scale parameter required' }, { status: 400 });
        }
        const lastSessions = SessionDB.getLastSessionsForScale(scale, limit ? parseInt(limit) : 2);
        return NextResponse.json(lastSessions);
      
      case 'stats':
        const stats = SessionDB.getPracticeStats();
        return NextResponse.json(stats);
      
      default:
        const defaultSessions = SessionDB.getRecentSessions(10);
        return NextResponse.json(defaultSessions);
    }
  } catch (error) {
    console.error('Error in sessions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save session
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, sessionData } = body;

    switch (action) {
      case 'save':
        const savedSession = SessionDB.saveSession(sessionData);
        return NextResponse.json(savedSession);
      
      case 'saveUnique':
        const uniqueSession = SessionDB.saveUniqueSession(sessionData);
        return NextResponse.json(uniqueSession);
      
      case 'clear':
        SessionDB.clearAllSessions();
        return NextResponse.json({ success: true });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in sessions POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 