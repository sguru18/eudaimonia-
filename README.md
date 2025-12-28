# Eudaimonia 🌱

A calm, modular personal lifestyle tracker built with Expo and React Native.

## Overview

Eudaimonia is a comprehensive lifestyle tracking app with five main modules:
- 🥗 **Food** - Meal planning, grocery lists, and food logging
- 💰 **Finances** - Expense tracking and financial management
- 📈 **Habits** - Daily habit tracking and visualization
- 📝 **Notes** - Rich text notes with Apple Notes-inspired design
- 🧘 **Stretch** - Guided stretching routines with TTS and timers

## Tech Stack

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase
- **State Management**: React Hooks
- **Forms**: React Hook Form
- **Date Handling**: date-fns
- **Storage**: AsyncStorage & Supabase
- **UI**: Custom components with a calm, minimal design

## Project Structure

```
garden-app/
├── app/                    # Expo Router routes
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── food/          # Food module routes
│   │   ├── finances/      # Finances module routes
│   │   ├── habits/        # Habits module routes
│   │   ├── notes.tsx      # Notes module
│   │   └── stretch/       # Stretch module routes
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/           # Screen components
│   ├── navigation/        # Navigation configuration
│   ├── services/          # Business logic services
│   ├── hooks/             # Custom React hooks
│   ├── theme/             # Theme configuration
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── assets/                # Images, fonts, etc.
└── ...config files

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd /Users/sriharigurugubelli/Desktop/garden-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   See [ENV_SETUP.md](ENV_SETUP.md) for detailed instructions.

4. **Set up the database:**
   Run the SQL schema in your Supabase project:
   ```bash
   # Copy the contents of supabase-schema.sql to your Supabase SQL editor
   ```

5. **Start the development server:**
   ```bash
   npm start
   ```

6. **Run on your platform:**
   - iOS: Press `i` or run `npm run ios`
   - Android: Press `a` or run `npm run android`
   - Web: Press `w` or run `npm run web`

## Documentation

- [Migration Notes](MIGRATION_NOTES.md) - Details about the Expo migration
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Feature implementation details
- [Notes Redesign](NOTES_REDESIGN.md) - Notes module design decisions
- [Quick Start Guide](QUICK_START.md) - Getting started quickly
- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Stretch Feature](STRETCH_FEATURE.md) - Stretch module documentation
- [Supabase Troubleshooting](SUPABASE_TROUBLESHOOTING.md) - Common Supabase issues
- [Environment Setup](ENV_SETUP.md) - Environment variables configuration

## Features

### Food Module 🥗
- Weekly meal planner
- Grocery list management
- Food logging and tracking
- Meal detail views

### Finances Module 💰
- Quick expense entry
- Expense list and history
- Recurring expenses tracking
- Data export functionality

### Habits Module 📈
- Visual habit grid
- Daily habit tracking
- Progress summaries
- Printable habit views

### Notes Module 📝
- Rich text editing
- Apple Notes-inspired design
- Quick note creation
- Search and organization

### Stretch Module 🧘
- Custom routine creation
- Guided stretching sessions
- Text-to-speech guidance
- Timer functionality
- Calm background music (configurable)

## Development

### Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Run linter
npm test           # Run tests
```

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Consistent file naming (PascalCase for components, camelCase for utilities)
- Theme-based styling

## Architecture

### Routing
Uses Expo Router for file-based routing:
- `app/_layout.tsx` - Root layout with initialization
- `app/(tabs)/_layout.tsx` - Tab bar configuration
- `app/(tabs)/[module]/` - Module-specific routes

### State Management
- Local state with React Hooks
- Global state with Context (where needed)
- Persistent storage with AsyncStorage
- Server state with Supabase

### Services
- `database.ts` - Supabase operations
- `supabase.ts` - Supabase client configuration
- `backgroundMusic.ts` - Audio playback (Expo AV)
- `tts.ts` - Text-to-speech (Expo Speech)
- `notifications.ts` - Push notifications (stub)

## Building for Production

### Configure app.json
Update the app configuration in `app.json`:
```json
{
  "expo": {
    "name": "Eudaimonia",
    "slug": "garden-app",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.garden"
    },
    "android": {
      "package": "com.yourcompany.garden"
    }
  }
}
```

### Build with EAS
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Private project - All rights reserved

## Support

For issues or questions:
1. Check the documentation files
2. Review SUPABASE_TROUBLESHOOTING.md for backend issues
3. Check console logs for debugging

## Acknowledgments

- Built with Expo and React Native
- Backend powered by Supabase
- Design inspired by calm, minimal aesthetics
