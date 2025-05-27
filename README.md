# Scales Mobile App

A hybrid mobile web application for practicing piano and musical scales. Built with Next.js 15, React 19, and Shadcn UI.

## Features

### Home Screen
- **My Scales**: List of preloaded musical scales with difficulty levels (Easy, Intermediate, Advanced)
- **Recent Sessions**: Shows the last 3 practice sessions (empty for new users)
- **Workout Session**: Start a random scales practice session

### Current Scales
- C Major (Easy)
- G Major (Easy) 
- D Major (Intermediate)
- A Minor (Easy)
- E Minor (Intermediate)  
- F Major (Advanced)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: JavaScript (no TypeScript)
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI + Radix UI
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── layout.js          # Root layout with mobile optimizations
│   ├── page.js            # Home screen
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Shadcn UI components
│   └── scales/            # Scale-specific components
│       ├── ScaleCard.jsx  # Individual scale card
│       └── SessionCard.jsx # Recent session card
└── data/
    └── scales.js          # Scales and sessions data
```

## Mobile Optimization

The app is optimized for mobile devices with:
- Responsive design (max-width: 448px)
- Touch-friendly interfaces
- Mobile viewport meta tags
- PWA-ready configuration
- Apple mobile web app support

## Future Features

- Add new scales functionality
- Practice session implementation
- User progress tracking
- Audio feedback
- Metronome integration
- Statistics and analytics

## Development

This is a hybrid web app designed to work like a native mobile app in browsers. It uses modern web technologies to provide a smooth mobile experience without requiring app store deployment.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
