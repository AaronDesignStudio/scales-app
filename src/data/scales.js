export const INITIAL_SCALES = [
  { id: 1, name: "C Major", level: "Easy" },
  { id: 2, name: "G Major", level: "Easy" },
  { id: 3, name: "D Major", level: "Intermediate" },
  { id: 4, name: "A Minor", level: "Easy" },
  { id: 5, name: "E Minor", level: "Intermediate" },
  { id: 6, name: "F Major", level: "Advanced" },
];

export const SCALE_LEVELS = {
  EASY: "Easy",
  INTERMEDIATE: "Intermediate", 
  ADVANCED: "Advanced"
};

// Comprehensive list of major scales
export const MAJOR_SCALES = [
  { name: "C Major", level: "Easy", sharps: 0, flats: 0 },
  { name: "G Major", level: "Easy", sharps: 1, flats: 0 },
  { name: "D Major", level: "Intermediate", sharps: 2, flats: 0 },
  { name: "A Major", level: "Intermediate", sharps: 3, flats: 0 },
  { name: "E Major", level: "Advanced", sharps: 4, flats: 0 },
  { name: "B Major", level: "Advanced", sharps: 5, flats: 0 },
  { name: "F# Major", level: "Expert", sharps: 6, flats: 0 },
  { name: "C# Major", level: "Expert", sharps: 7, flats: 0 },
  { name: "F Major", level: "Intermediate", sharps: 0, flats: 1 },
  { name: "Bb Major", level: "Intermediate", sharps: 0, flats: 2 },
  { name: "Eb Major", level: "Advanced", sharps: 0, flats: 3 },
  { name: "Ab Major", level: "Advanced", sharps: 0, flats: 4 },
  { name: "Db Major", level: "Expert", sharps: 0, flats: 5 },
  { name: "Gb Major", level: "Expert", sharps: 0, flats: 6 },
  { name: "Cb Major", level: "Expert", sharps: 0, flats: 7 },
];

// Comprehensive list of minor scales
export const MINOR_SCALES = [
  { name: "A Minor", level: "Easy", sharps: 0, flats: 0 },
  { name: "E Minor", level: "Easy", sharps: 1, flats: 0 },
  { name: "B Minor", level: "Intermediate", sharps: 2, flats: 0 },
  { name: "F# Minor", level: "Intermediate", sharps: 3, flats: 0 },
  { name: "C# Minor", level: "Advanced", sharps: 4, flats: 0 },
  { name: "G# Minor", level: "Advanced", sharps: 5, flats: 0 },
  { name: "D# Minor", level: "Expert", sharps: 6, flats: 0 },
  { name: "A# Minor", level: "Expert", sharps: 7, flats: 0 },
  { name: "D Minor", level: "Intermediate", sharps: 0, flats: 1 },
  { name: "G Minor", level: "Intermediate", sharps: 0, flats: 2 },
  { name: "C Minor", level: "Advanced", sharps: 0, flats: 3 },
  { name: "F Minor", level: "Advanced", sharps: 0, flats: 4 },
  { name: "Bb Minor", level: "Expert", sharps: 0, flats: 5 },
  { name: "Eb Minor", level: "Expert", sharps: 0, flats: 6 },
  { name: "Ab Minor", level: "Expert", sharps: 0, flats: 7 },
];

// Combined list of all available scales
export const ALL_AVAILABLE_SCALES = [
  ...MAJOR_SCALES,
  ...MINOR_SCALES
];

// Helper function to get scale by name
export const getScaleByName = (name) => {
  return ALL_AVAILABLE_SCALES.find(scale => scale.name === name);
};

// Helper function to check if scale is already in user's collection
export const isScaleInCollection = (scaleName, userScales) => {
  return userScales.some(scale => scale.name === scaleName);
}; 