import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'data', 'bpm-config.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(configPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// GET - Fetch BPM configuration
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const configKey = searchParams.get('key');

    ensureDataDir();

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ bpm: 60 }); // Default BPM
    }

    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    if (configKey) {
      return NextResponse.json({ bpm: configData[configKey] || 60 });
    }
    
    return NextResponse.json(configData);
  } catch (error) {
    console.error('Error reading BPM config:', error);
    return NextResponse.json({ bpm: 60 }); // Default BPM
  }
}

// POST - Save BPM configuration
export async function POST(request) {
  try {
    const { configKey, bpm } = await request.json();

    ensureDataDir();

    let configData = {};
    if (fs.existsSync(configPath)) {
      configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    configData[configKey] = bpm;

    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving BPM config:', error);
    return NextResponse.json({ error: 'Failed to save BPM config' }, { status: 500 });
  }
} 