# YumeSession Frontend - Component Structure

This document describes the refactored component structure for better maintainability and debugging.

## Component Architecture

### Main Application
- **`App.jsx`** - Main router component that handles routing between pages

### Pages
- **`components/HomePage.jsx`** - Dashboard page showing workspace overview and stats
- **`components/WorkspacePage.jsx`** - Main workspace page with three-panel layout

### Shared Components
- **`components/HeaderBar.jsx`** - Top navigation bar with controls and workspace info
- **`components/TranscriptScreen.jsx`** - Live transcript panel with text selection features
- **`components/PromptSection.jsx`** - AI assistant chat interface
- **`components/NotesSection.jsx`** - Meeting notes with markdown editor and preview
- **`components/NoVNC.jsx`** - Browser streaming panel

## Benefits of This Structure

1. **Easier Debugging** - Each component is in its own file, making it easier to isolate issues
2. **Better Code Organization** - Related functionality is grouped together
3. **Reusability** - Components can be easily reused across different pages
4. **Maintainability** - Changes to one component don't affect others
5. **Team Collaboration** - Multiple developers can work on different components simultaneously

## File Structure
```
src/
├── App.jsx                     # Main router
├── App.css                     # Global styles
├── main.jsx                    # App entry point
├── style.css                   # Additional styles
├── assets/
│   ├── fonts/
│   └── images/
│       └── logo-universal.png
└── components/
    ├── HomePage.jsx            # Dashboard page
    ├── WorkspacePage.jsx       # Main workspace
    ├── HeaderBar.jsx           # Navigation header
    ├── TranscriptScreen.jsx    # Transcript panel
    ├── PromptSection.jsx       # AI chat panel
    ├── NotesSection.jsx        # Notes with markdown
    └── NoVNC.jsx               # Browser panel
```

## Import Relationships

- `App.jsx` imports `HomePage` and `WorkspacePage`
- `WorkspacePage` imports all panel components (`HeaderBar`, `TranscriptScreen`, `PromptSection`, `NotesSection`, `NoVNC`)
- Each component manages its own state and functionality
- Components communicate through props passed down from parent components

## Functionality Preserved

All original functionality has been maintained:
- ✅ HomePage dashboard with workspace cards
- ✅ WorkspacePage three-panel layout (25% / 37.5% / 37.5%)
- ✅ Browser panel sliding animation
- ✅ Live transcript with text selection
- ✅ AI assistant chat interface
- ✅ Meeting notes with markdown editor/preview tabs
- ✅ Compact font sizes and spacing
- ✅ All styling and animations

## Development

The application runs on Vite and can be started with:
```bash
npm run dev
```

Each component can now be developed and debugged independently, making the development process much more efficient.
