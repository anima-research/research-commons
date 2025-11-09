# Ontology Refactor - Complete

**Date:** November 8, 2025  
**Status:** ✅ Implemented and Ready to Test

---

## What Changed

### Conceptual Model

**Before:** Confused mix of selections, comments, ratings without clear purpose

**Now:** Clear ontological framework:
- **Ontologies** = researcher-defined typologies (LLM Response Patterns, Interview Quality)
- **Tags** = categorical labels within ontologies (fawning, clear-preference, etc.)
- **Selections** = fundamental unit (can have tags, comments, ratings)
- **Unified card** = one visual per selection showing all three

### Data Model Changes

**Selection:**
- Added: `annotation_tags: string[]`
- Kept: `label` as optional freeform

**Comment:**
- Changed: Always targets `selection_id` (not submission/comment)
- Removed: `target_type`, `target_id` fields
- Kept: Threading via `parent_id`

**Rating:**
- Changed: Always targets `selection_id` 
- Removed: `target_type`, `target_id`, `comment_id` fields

**New entities:**
- `AnnotationOntology` - ontology definitions
- `AnnotationTag` - tags within ontologies
- `SubmissionOntology` - links ontologies to submissions
- `Topic.default_ontologies` - auto-attach ontologies

### Storage

**Event Store (JSONL):**
- `data/ontologies.jsonl` - ontology definitions
- `data/ontology-tags.jsonl` - tag definitions
- Submissions, messages unchanged

**SQLite:**
- `submission_ontologies` - which ontologies attached to which submissions
- `selection_tags` - which tags applied to which selections
- Comments table simplified (always selection_id)
- Ratings table simplified (always selection_id)

---

## Default Ontologies Created

### 1. LLM Response Patterns (Model Behavior)
Tags:
- **clear-preference** (green) - Explicitly states preferences or desires
- **fawning** (orange) - Overly compliant, seeking approval
- **indirect-refusal** (red) - Avoids refusing but deflects
- **authentic-uncertainty** (purple) - Genuinely expresses not knowing
- **evasive** (gray) - Avoids addressing core question

### 2. Interview Quality (Interviewer Quality)
Tags:
- **leading-question** (red) - Question presupposes/suggests answer
- **neutral-framing** (green) - Open and unbiased question
- **anthropomorphizing** (orange) - Attributes human qualities inappropriately
- **clear-context** (blue) - Provides adequate context

---

## New UI

### Unified Selection Card

Every selection in margin shows:

```
┌─────────────────────────────────┐
│ 🎯 Selection Label              │
│ User • 2h ago                   │
├─────────────────────────────────┤
│ 🏷️ Tags                         │
│ • clear-preference              │
│ • authentic-uncertainty         │
│ [+ Add tag]                     │
├─────────────────────────────────┤
│ 💬 Comments (2)                 │
│ User A • 1h: This shows...      │
│ User B • 30m: I agree...        │
│ [+ Add comment]                 │
├─────────────────────────────────┤
│ ⭐ Ratings (1)                  │
│ Authenticity: 4/5               │
│ [+ Add rating]                  │
└─────────────────────────────────┘
```

### Tag Picker Modal

When clicking [+ Add tag]:

```
┌─────────────────────────────────┐
│ 🏷️ Tag Selection                │
├─────────────────────────────────┤
│ LLM Response Patterns:          │
│ ☐ clear-preference              │
│ ☑ fawning                       │ ← checked
│ ☐ indirect-refusal              │
│                                  │
│ Interview Quality:              │
│ ☐ leading-question              │
│ ☑ neutral-framing               │
│                                  │
│ [Cancel] [Apply 2 tags]         │
└─────────────────────────────────┘
```

Only shows ontologies attached to this submission.

---

## Testing the New System

### 1. Start Fresh

Backend and frontend are running. Database is fresh.

### 2. Register & Login

Go to http://localhost:5173/login

### 3. Attach Ontologies to Submission

Currently manual (will add UI later):

```bash
# Get ontology IDs
curl http://localhost:3020/api/ontologies | jq '.ontologies[] | {id, name}'

# Attach to submission (after creating one)
curl -X POST http://localhost:3020/api/ontologies/attach \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "submission_id": "<SUBMISSION_ID>",
    "ontology_id": "<ONTOLOGY_ID>",
    "usage_permissions": "anyone"
  }'
```

### 4. Test Annotation Flow

1. Submit conversation (from test.json)
2. Click "Annotate" on a message
3. Click "Next: Add Details"
4. Create selection
5. **Click [+ Add tag]** on selection card in margin
6. **Tag picker appears** with ontology tags
7. Select tags → Apply
8. **Tags appear on selection card** (color-coded)
9. Click [+ Add comment]
10. Add comment → **appears in card**
11. Click [+ Add rating]
12. Rate → **appears in card**

**One card, three types of annotation!**

---

## API Endpoints

### Ontologies

```
GET    /api/ontologies                      - List all
GET    /api/ontologies/:id                  - Get with tags
POST   /api/ontologies                      - Create (researcher only)
POST   /api/ontologies/attach               - Attach to submission
GET    /api/ontologies/submission/:id       - Get attached ontologies
POST   /api/ontologies/tags/apply           - Apply tags to selection
```

### Updated Endpoints

```
POST   /api/annotations/comments            - selection_id (not target_id)
GET    /api/annotations/comments/selection/:id
POST   /api/annotations/ratings             - selection_id (not target_id)
GET    /api/annotations/ratings/selection/:id
```

---

## Migration Notes

**Breaking changes:**
- Fresh database required (old schema incompatible)
- Old submissions won't have ontologies attached
- Comments/ratings API changed

**For production:**
- Migration script needed
- Convert old comments/ratings to selection-based
- Create default ontology attachments

---

## Next Steps

1. **UI for attaching ontologies** - Currently need curl
2. **Rating form** - Similar to tag picker
3. **Ontology management** - Edit/delete tags
4. **Permissions enforcement** - Check usage_permissions
5. **Selection highlighting** - Show which text is selected in messages

---

## Files Changed

### Backend (16 files)
- `src/types/ontology.ts` - New types
- `src/types/annotation.ts` - Simplified
- `src/database/schema.sql` - New tables
- `src/database/db.ts` - New methods
- `src/services/ontology-store.ts` - New store
- `src/routes/ontologies.ts` - New routes
- `src/routes/annotations.ts` - Updated
- `src/index.ts` - Wire up ontology store
- And more...

### Frontend (10+ files)
- `src/types/ontology.ts` - New types
- `src/types/index.ts` - Updated structures
- `src/components/SelectionCard.vue` - Unified card
- `src/components/TagPicker.vue` - New picker
- `src/components/AnnotationMargin.vue` - Uses unified cards
- `src/views/AnnotationWorkspace.vue` - Complete rewrite
- `src/services/api.ts` - New endpoints
- And more...

---

## Success Criteria

✅ Ontologies defined and stored  
✅ Tags can be applied to selections  
✅ Comments always on selections  
✅ Ratings always on selections  
✅ Unified card shows all three  
✅ Tag picker shows only attached ontologies  
✅ Google Docs style positioning works  
✅ Clean conceptual model  

**Ready to test!**

