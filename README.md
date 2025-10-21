# BookSmart - Academic Sharing App

A React Native mobile app built with Expo for Nigerian university students to share and discover study materials.

## Features

- **Authentication**: Email/password signup with university selection
- **Material Sharing**: Upload and view PDF study materials
- **Search & Filter**: Find materials by school, department, and level
- **Bookmark System**: Save materials for later viewing
- **Points System**: Earn points for uploads and recommendations
- **Profile Management**: Track points, bookmarks, and uploads
- **PDF Viewer**: In-app PDF viewing with bookmark and recommend features

## Setup

### Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. Get your Supabase credentials:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings > API
   - Copy the Project URL and anon/public key

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: Expo Router
- **Backend**: Supabase
- **PDF Viewing**: react-native-pdf
- **UI**: Custom components with white & green theme

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase** (Required - app uses Supabase database)
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy your `.env.example` to `.env` and fill in your Supabase credentials
   - Run the SQL script in `supabase-setup.sql` in your Supabase SQL Editor to create the required tables
   - The script will create all necessary tables, indexes, and Row Level Security policies

3. **Run the App**
   ```bash
   npm start
   ```

4. **Test the App**
   - Use "Demo Login" button for quick access
   - Or create a new account with any email/password

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home feed
│   │   ├── upload.tsx     # Upload materials
│   │   ├── bookmarks.tsx  # User bookmarks
│   │   └── profile.tsx    # User profile
│   ├── login.tsx          # Login screen
│   ├── signup.tsx         # Signup screen
│   └── pdf-viewer.tsx     # PDF viewer modal
├── components/            # Reusable components
│   └── MaterialCard.tsx   # Study material card
├── screens/               # Screen components
│   ├── auth/              # Authentication screens
│   └── PDFViewerScreen.tsx
├── lib/                   # Core utilities
│   ├── supabase.ts        # Supabase client & types
│   └── store.ts           # Zustand store
├── constants/             # App constants
│   ├── colors.ts          # Color palette
│   └── theme.ts           # Theme configuration
└── lib/                   # Database and utilities
    └── supabase.ts        # Supabase configuration and database functions
```

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  university_id UUID REFERENCES schools(id),
  department TEXT,
  level TEXT,
  points INTEGER DEFAULT 0,
  recommendations INTEGER DEFAULT 0,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Materials table
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  pdf_url TEXT NOT NULL,
  uploader_id UUID REFERENCES users(id),
  school_id UUID REFERENCES schools(id),
  department TEXT,
  level TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookmarks table
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  material_id UUID REFERENCES materials(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Key Features Implementation

### Authentication
- Email/password signup with university selection
- Random avatar assignment using DiceBear API
- User profile management

### Material Management
- PDF upload with metadata (title, description, department, level)
- Approval system (materials start as pending)
- Points system (+5 points per approved upload)

### PDF Viewing
- In-app PDF viewer with zoom and navigation
- Bookmark and recommend functionality
- Material metadata display

### Search & Filter
- Text search across titles and descriptions
- Filter by university, department, and level
- Real-time filtering

### Points System
- Earn points for approved uploads
- Payout eligibility at 30 points
- Track recommendations received

## Development Notes

- Fully integrated with Supabase database
- Supabase integration ready but not required
- All CRUD operations implemented with Zustand
- Responsive design with light/dark theme support
- TypeScript throughout for type safety

## Future Enhancements

- Real Supabase integration
- Push notifications for approvals
- Social features (comments, ratings)
- Offline PDF caching
- Advanced search filters
- Material categories and tags
- Admin dashboard for approvals