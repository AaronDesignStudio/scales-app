import { NextResponse } from 'next/server';
import { SessionDB } from '@/lib/database';

// GET - Exercise-specific queries
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const scale = searchParams.get('scale');
    const practiceType = searchParams.get('practiceType');
    const octaves = searchParams.get('octaves');

    switch (action) {
      case 'bestBPM':
        if (!scale || !practiceType || !octaves) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const bestBPM = SessionDB.getBestBPMForExercise(scale, practiceType, parseInt(octaves));
        return NextResponse.json({ bestBPM });
      
      case 'hasBeenPracticed':
        if (!scale || !practiceType) {
          return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }
        const practiced = SessionDB.hasExerciseBeenPracticed(scale, practiceType);
        return NextResponse.json({ practiced });
      
      case 'practicedForScale':
        if (!scale) {
          return NextResponse.json({ error: 'Scale parameter required' }, { status: 400 });
        }
        const exercises = SessionDB.getPracticedExercisesForScale(scale);
        return NextResponse.json({ exercises });
      
      case 'debug':
        if (!scale) {
          return NextResponse.json({ error: 'Scale parameter required' }, { status: 400 });
        }
        const debugInfo = SessionDB.debugPracticeTypesForScale(scale);
        return NextResponse.json({ debugInfo });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in exercise GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 