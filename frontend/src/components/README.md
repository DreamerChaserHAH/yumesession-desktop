# Components Folder Structure

This folder has been reorganized into a more maintainable structure:

## Folder Organization

### 📁 `modals/`
Modal dialog components that overlay the main content:
- `DocumentPreviewModal.jsx` - PDF document preview with AI summary
- `SystemCheckModal.jsx` - System status and requirements check
- `SystemCheckModal.css` - Styles for system check modal

### 📁 `pages/`
Full page components that represent entire application views:
- `HomePage.jsx` - Main dashboard with knowledge base and workspaces
- `WorkspacePage.jsx` - Individual workspace view with transcription and notes

### 📁 `sections/`
Page section components that make up parts of larger pages:
- `KnowledgeBaseSection.jsx` - Document management and display
- `NotesSection.jsx` - Markdown notes editor and viewer
- `PromptSection.jsx` - AI chat prompt interface
- `QuickStatsSection.jsx` - Statistics and metrics display
- `WorkspacesSection.jsx` - Workspace listing and management

### 📁 `shared/`
Reusable components used across multiple pages:
- `HeaderBar.jsx` - Navigation and header component
- `NoVNC.jsx` - VNC viewer component
- `TranscriptScreen.jsx` - Real-time transcription display

### 📄 `index.js`
Central export file for easier imports. You can now import components like:
```jsx
import { HomePage, WorkspacePage } from './components';
```

## Import Guidelines

- Use the centralized `index.js` for cleaner imports when possible
- Relative imports within the same folder group are fine
- All wailsjs imports use the correct relative path (`../../../wailsjs/...`)
- Asset imports use the correct relative path (`../../assets/...`)

## Benefits of This Structure

1. **Better Organization**: Related components are grouped together
2. **Easier Navigation**: Developers can quickly find the right component
3. **Clearer Dependencies**: The structure makes component relationships more obvious
4. **Scalability**: Easy to add new components in the appropriate category
5. **Maintainability**: Reduces cognitive load when working on specific features
