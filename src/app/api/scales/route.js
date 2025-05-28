import { NextResponse } from 'next/server';
import { ScalesDB } from '@/lib/database';

// GET - Fetch user's scale collection
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'getCollection':
        const userScales = ScalesDB.getUserScales();
        return NextResponse.json(userScales);
      
      default:
        const defaultScales = ScalesDB.getUserScales();
        return NextResponse.json(defaultScales);
    }
  } catch (error) {
    console.error('Error in scales GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Manage scale collection
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, scale, scaleId } = body;

    switch (action) {
      case 'addScale':
        console.log('API addScale called with:', { scale });
        
        if (!scale || !scale.name) {
          console.error('Missing scale data:', { scale });
          return NextResponse.json({ error: 'Scale data required' }, { status: 400 });
        }
        
        try {
          const addedScale = ScalesDB.addScale(scale);
          console.log('ScalesDB.addScale result:', addedScale);
          
          if (addedScale) {
            return NextResponse.json(addedScale);
          } else {
            console.log('Scale already exists:', scale.name);
            return NextResponse.json({ error: 'Scale already exists or failed to add' }, { status: 409 });
          }
        } catch (dbError) {
          console.error('Database error in addScale:', dbError);
          return NextResponse.json({ 
            error: 'Database error occurred', 
            details: dbError.message 
          }, { status: 500 });
        }
      
      case 'removeScale':
        if (!scaleId) {
          return NextResponse.json({ error: 'Scale ID required' }, { status: 400 });
        }
        
        const removed = ScalesDB.removeScale(scaleId);
        if (removed) {
          return NextResponse.json({ success: true });
        } else {
          return NextResponse.json({ error: 'Scale not found or failed to remove' }, { status: 404 });
        }
      
      case 'initializeDefaults':
        const defaultScales = ScalesDB.initializeDefaultScales();
        return NextResponse.json(defaultScales);
      
      case 'resetToDefaults':
        const resetScales = ScalesDB.resetToDefaults();
        return NextResponse.json(resetScales);
      
      case 'clearAll':
        ScalesDB.clearAllScales();
        return NextResponse.json({ success: true });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in scales POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 