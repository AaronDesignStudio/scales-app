export const INITIAL_SCALES = [
  { id: 1, name: "C Major", level: "Easy" },
  { id: 2, name: "G Major", level: "Easy" },
  { id: 3, name: "D Major", level: "Intermediate" },
  { id: 4, name: "A Minor", level: "Easy" },
  { id: 5, name: "E Minor", level: "Intermediate" },
  { id: 6, name: "F Major", level: "Advanced" },
  { id: 7, name: "F Major", level: "Advanced" },
];

export const SAMPLE_SESSIONS = [
  { id: 1, scale: "C Major", hand: "Left hand", octaves: 2, bpm: 94 },
  { id: 2, scale: "C Major", pattern: "Staccato", octaves: 3, bpm: 46 },
];

// Last sessions for specific scales
export const SCALE_LAST_SESSIONS = {
  "C Major": [
    { id: 1, scaleId: 1, hand: "Left hand", octaves: 2, bpm: 94 },
    { id: 2, scaleId: 1, pattern: "Two hands", octaves: 3, bpm: 62 },
  ],
  "G Major": [
    { id: 3, scaleId: 2, hand: "Right hand", octaves: 1, bpm: 80 },
  ],
  "D Major": [
    { id: 4, scaleId: 3, pattern: "Contrary Motion", octaves: 2, bpm: 75 },
    { id: 5, scaleId: 3, hand: "Two hands", octaves: 4, bpm: 90 },
  ],
};

// User progress tracking best BPM for each scale-practice-octave combination
export const USER_PROGRESS = {
  "C Major-right-hand-1": { bestBPM: 82 },
  "C Major-right-hand-2": { bestBPM: 62 },
  "C Major-left-hand-2": { bestBPM: 94 },
  "C Major-two-hands-3": { bestBPM: 62 },
  "G Major-right-hand-1": { bestBPM: 80 },
  "D Major-contrary-motion-2": { bestBPM: 75 },
  "D Major-two-hands-4": { bestBPM: 90 },
};

export const SCALE_LEVELS = {
  EASY: "Easy",
  INTERMEDIATE: "Intermediate", 
  ADVANCED: "Advanced"
}; 