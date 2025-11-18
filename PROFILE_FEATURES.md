# Profile Features Implementation

## Overview
Added profile picture/avatar functionality with initials fallback and a profile setup prompt for new users.

## Features Implemented

### 1. User Avatar Component (`src/components/UserAvatar.jsx`)
- Displays user profile picture or initials if no picture is set
- Automatically generates initials from user's name (e.g., "John Doe" → "JD")
- Color-coded avatars based on user name for consistency
- Three sizes: small (32px), medium (40px), large (80px)
- Fallback to initials if image fails to load

### 2. Profile Setup Modal (`src/components/ProfileSetupModal.jsx`)
- Shows up for new users after signup (only once unless dismissed)
- Prompts users to complete their profile
- Two actions:
  - **Go to Settings** - Navigates to settings section in Dashboard
  - **Remind Me Later** - Dismisses for this session (can be shown again for truly new users)
- Only appears for users who haven't completed profile setup AND haven't dismissed it

### 3. Avatar Upload in Settings
- Users can upload profile pictures from Settings section in Dashboard or Profile page
- Click "Change Photo" button when editing profile
- Supports common image formats (jpg, png, gif, webp)
- Maximum file size: 5MB
- Images stored in Supabase Storage bucket `user-assets/avatars/`

### 4. Database Changes
**Migration file:** `supabase/migrations/20251118_add_profile_avatar.sql`

Added columns to `user_profiles` table:
- `avatar_url` - URL to uploaded avatar image
- `profile_setup_completed` - Boolean flag (false by default)
- `profile_setup_dismissed_at` - Timestamp when user clicked "Remind Me Later"

### 5. Updated Components

**Dashboard (`src/Dashboard.jsx`):**
- Shows UserAvatar in top bar instead of static image
- Displays ProfileSetupModal for new users
- Avatar shows initials if no picture uploaded
- Modal navigates to Settings section when user clicks "Go to Settings"

**Profile/Settings Page (`src/Profile.jsx`):**
- Avatar upload functionality in Personal Information section
- Shows UserAvatar with upload button when editing
- Saves avatar URL to database
- Marks profile as complete after first save

## API Functions

**In `src/lib/profileApi.js`:**

1. `uploadAvatar(userId, file)` - Uploads image to Supabase Storage
2. `markProfileSetupComplete(userId)` - Marks profile as set up
3. `dismissProfileSetup(userId)` - Records dismissal timestamp
4. Updated `saveUserProfile()` to include `avatarUrl`

## User Flow

### For New Users:
1. User signs up
2. After 1.5 seconds, ProfileSetupModal appears
3. User can either:
   - Click "Go to Settings" → Taken to Settings section
   - Click "Remind Me Later" → Modal dismissed (won't show again for existing users)
4. In Settings, user can upload avatar and fill profile details
5. On save, profile marked as complete

### For Existing Users:
- Modal does NOT appear if they've already completed setup
- Modal does NOT appear if they've dismissed it before
- Can still update avatar anytime from Settings

## Storage Structure

```
Supabase Storage Bucket: user-assets
└── avatars/
    └── {userId}-{timestamp}.{ext}
```

## Styling

- `src/components/UserAvatar.css` - Avatar component styles
- `src/components/ProfileSetupModal.css` - Modal styles with animations
- Integrates with existing Dashboard and Profile page styles
