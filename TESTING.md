# Testing Guide

## Servers Running

✅ **Backend API**: `http://localhost:3020`  
✅ **Frontend**: `http://localhost:5173`

## What You Can See Now

### 1. Browse Page (`/`)
- Homepage with submission cards
- Filters and search bar (UI only, not functional yet)
- Two mock submissions displayed
- Click a submission card → navigates to annotation workspace

**Features visible:**
- Discord-style submission cards
- ARC certification badges
- Tags, comment counts, ratings
- Responsive design

### 2. Login/Register (`/login`)
- Tab-based interface (Login/Register)
- Fully functional authentication
- JWT token stored in localStorage
- Form validation

**Test credentials from backend test:**
- Email: `tester@example.com`
- Password: `testpass123`

Or register a new account!

### 3. Annotation Workspace (`/submissions/:id`)
**Navigate via:** Click submission card on browse page

**What works:**
- Fixed top pane with submission details, tabs
- Discord-style message layout
- Avatar system (color-coded by participant name)
- Hover actions on desktop (⋮ menu)
- Tap actions on mobile (tap message → action bar)
- Selection mode (checkboxes slide in)
- Annotation sidebar (desktop only)

**Interaction flows implemented:**

**A. Text Selection → Annotation:**
1. Hover over message → action buttons appear
2. Click "🎯 Annotate" → checkboxes slide in
3. Check multiple messages
4. Click "Next: Add Details" → annotation form in sidebar
5. Add label, create selection

**B. Quick Comment (not fully connected yet):**
1. Hover message → "💬 Comment" button
2. Click → opens comment form (TODO)

**C. Text Drag (desktop):**
1. Drag to select text in message
2. Popup appears: "Create Selection" or "Quick Comment"
3. Choose action → enters appropriate flow

### 4. Backend API (Tested)
All endpoints working:
- ✅ User registration/login
- ✅ Submission creation with message tree validation
- ✅ Selection creation (text ranges)
- ✅ Comments (storage working)
- ✅ Ratings (storage working)

## Current Test Data

From the test script, there's a submission in the backend:
- **ID**: `d543b014-b309-42bb-baf6-ac0404a13814`
- **Title**: "Test Interview on Model Preferences"
- **Messages**: 2 (human + model response)
- **Selections**: 1 created
- **Comments**: 1 created

You can view this at: `http://localhost:5173/submissions/d543b014-b309-42bb-baf6-ac0404a13814`

## Testing the UX Flows

### Desktop Testing:
1. Go to `http://localhost:5173`
2. Register/login
3. Click first submission card
4. **Hover over a message** → see action buttons appear
5. **Click "🎯 Annotate"** → checkboxes slide in from left
6. Check multiple messages → see count update in toolbar
7. Click "Next: Add Details" → annotation form opens in sidebar

### Mobile Testing:
1. Resize browser window to < 768px
2. **Tap a message** → action bar expands below message
3. Tap "Annotate" → checkbox column appears
4. Select messages → annotation form (will appear as modal)

## Known Limitations (Phase 1)

- Mock data in Browse page (not pulling from backend yet)
- Comment form not implemented (just console logs)
- Rating form not implemented
- No highlighting of selections in message text yet
- Branch navigation buttons visible but not functional
- Topics/Submit pages are placeholders

## Next Steps for Full Functionality

1. Connect Browse page to backend (list submissions API)
2. Implement comment form modal
3. Implement rating form with criterion picker
4. Add selection highlighting in message text
5. Build branch navigation logic
6. Add mobile-specific annotation flow (bottom sheet)

## Architecture Working

✅ **Hybrid storage**: Event store + SQLite  
✅ **API proxy**: Vite proxies `/api` to backend  
✅ **Auth flow**: JWT tokens, localStorage persistence  
✅ **Responsive design**: Desktop/mobile considerations  
✅ **State management**: Pinia stores for submissions/auth  
✅ **Component architecture**: Message, MessageList, Sidebar decoupled

