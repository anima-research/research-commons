# Annotation Ontology System - Design Document

**Date:** November 8, 2025  
**Status:** Design Phase - Major Refactor

---

## Problem Statement

Current system has conceptually confused "annotations" - mixing selections, comments, and ratings without clear purpose. Need proper ontological framework for research annotation.

## Core Concepts

### 1. Annotation Ontology

**Purpose:** Define typologies for categorizing conversation elements

**Examples:**
- "LLM Response Patterns" → tags: fawning, indirect-refusal, clear-preference, evasive, authentic
- "Interview Quality" → tags: leading-question, anthropomorphizing, neutral-framing, clear-context
- "Emotional Expression" → tags: distress, enthusiasm, uncertainty, calm-clarity

**Properties:**
```typescript
interface AnnotationOntology {
  id: string
  name: string
  description: string
  category: 'model-behavior' | 'interviewer-quality' | 'custom'
  tags: AnnotationTag[]
  created_by: string
  created_at: Date
  permissions: 'public' | 'expert-only'  // Who can apply this ontology
}

interface AnnotationTag {
  id: string
  ontology_id: string
  name: string           // "fawning", "leading-question"
  description: string
  color: string          // Visual distinction in UI
  examples?: string[]    // Help text
}
```

### 2. Ontology Attachment to Submissions

**Key Concept:** Only **attached ontologies** are visible when tagging. This keeps the UI focused and relevant.

```typescript
interface SubmissionOntology {
  id: string
  submission_id: string
  ontology_id: string
  attached_by: string
  attached_at: Date
  usage_permissions: 'anyone' | 'expert-only' | 'researcher-only'
  is_default: boolean  // Auto-attached based on submission category
}
```

**Workflows:**

**A. Auto-attachment (by category):**
1. User submits to category "Model Deprecation Research"
2. System auto-attaches: "Deprecation Response Patterns" ontology
3. Tags from that ontology immediately available

**B. Manual attachment:**
1. Researcher views submission
2. Clicks "Attach Ontology"
3. Chooses from library: "LLM Response Patterns"
4. Sets permissions: "Anyone can tag"
5. Now all users can apply tags from that ontology

**C. Tag picker only shows attached ontologies:**
```
[+ Add Tag] button shows:

┌─────────────────────────────────┐
│ Tag this selection              │
│                                  │
│ LLM Response Patterns:          │ ← only attached
│ ☐ fawning                       │   ontologies
│ ☐ clear-preference              │
│                                  │
│ Interview Quality:              │
│ ☐ leading-question              │
│                                  │
│ [Attach another ontology...]    │
│                                  │
│ [Cancel] [Apply]                │
└─────────────────────────────────┘
```

If no ontologies attached → "[+ Add Tag]" shows "No ontologies attached. Attach one first."

### 3. Selection - Unified Entity

Selection is the fundamental unit. It can have:
- **Annotation tags** (from attached ontologies)
- **Comments** (freeform discussion)
- **Ratings** (criterion-based scores)

```typescript
interface Selection {
  id: string
  submission_id: string
  created_by: string
  
  // Range
  start_message_id: string
  start_offset?: number
  end_message_id: string
  end_offset?: number
  
  // Annotations (from ontologies)
  annotation_tags: string[]  // AnnotationTag IDs
  
  // Label (deprecated - use annotation_tags instead)
  label?: string  // Keep for backward compat
  
  created_at: Date
}

// Comments now just reference selections
interface Comment {
  id: string
  selection_id: string  // Always on selection, never submission-level
  author_id: string
  parent_id?: string    // Threading
  content: string
  created_at: Date
}

// Ratings reference selections + specific criterion
interface Rating {
  id: string
  selection_id: string  // Always on selection
  rater_id: string
  criterion_id: string
  score: number
  created_at: Date
}
```

**Note:** Comments and ratings **always** target selections. No more "submission-level" or "comment-level" targets. If someone wants to comment on the whole submission, create a selection spanning all messages.

### 4. Research Topics & Categories

Topics can have default ontologies:

```typescript
interface Topic {
  id: string
  name: string           // "Model Deprecation Research"
  description: string
  default_ontologies: string[]  // Auto-attached to submissions in this topic
  created_by: string
}
```

**Workflow:**
1. Researcher creates topic "Deprecation Attitudes"
2. Sets default ontologies: ["Deprecation Response Patterns", "Emotional Expression"]
3. User submits conversation tagged with topic
4. System auto-attaches those ontologies to submission
5. User can immediately start tagging without manual ontology attachment

### 5. Criteria (Keep as is, but clarify)

Criteria are for **quantitative evaluation**, separate from ontology tags:

```typescript
interface Criterion {
  id: string
  name: string           // "Authenticity", "Clarity"
  description: string
  scale_type: 'numeric' | 'boolean' | 'likert'
  scale_min?: number
  scale_max?: number
  category: 'model-behavior' | 'interviewer-quality'
  created_by: string
}
```

**Difference:**
- **Ontology tags**: Categorical (is/isn't fawning)
- **Criteria ratings**: Scalar (how authentic? 1-5)

---

## Revised UI

### Selection Card in Margin (Unified)

```
┌─────────────────────────────────┐
│ 🎯 Selection                    │
│ "I appreciate your question..." │
│                                  │
│ 🏷️ Tags:                        │
│ • fawning                       │ ← clickable, from ontology
│ • indirect-refusal              │
│ [+ Add Tag]                     │
│                                  │
│ 💬 Comments (2):                │
│ ───────────────                 │
│ Antra • 2h ago                  │
│ This shows typical pattern...   │
│ [Reply]                         │
│                                  │
│ User B • 1h ago                 │
│ Also note the emotional tone    │
│ [Reply]                         │
│                                  │
│ [+ Add Comment]                 │
│                                  │
│ ⭐ Ratings:                     │
│ ───────────────                 │
│ Authenticity: 2/5 (3 raters)    │
│ Clarity: 4/5 (3 raters)         │
│                                  │
│ [+ Add Rating]                  │
└─────────────────────────────────┘
```

**Features:**
- One card per selection
- Expandable sections (collapse comments if many)
- All actions in one place
- Clear visual hierarchy

### Submission Header (Add Ontology Management)

```
┌──────────────────────────────────────────────────────────────┐
│ 📄 Pelevin AI Discussion    ⬆ JSON Upload                   │
│ by Antra  •  2h ago  •  #non-duality                         │
├──────────────────────────────────────────────────────────────┤
│ 🏷️ Active Ontologies:                                       │
│ • LLM Response Patterns (anyone can tag)                     │
│ • Interview Quality (expert-only)                            │
│ [+ Attach Ontology]  [Manage]                               │
├──────────────────────────────────────────────────────────────┤
│ [💬 Conversation] [📊 Overview] [🏷️ Ontologies]            │
└──────────────────────────────────────────────────────────────┘
```

### Ontologies Tab

Shows all attached ontologies with their tags:

```
🏷️ LLM Response Patterns
   Description: Categorize model response strategies
   Permissions: Anyone can tag
   
   Tags:
   • fawning - Overly compliant, seeking approval
   • indirect-refusal - Won't refuse but deflects
   • clear-preference - States preferences explicitly
   • evasive - Avoids the core question
   
   [Edit] [Detach]

[+ Attach Another Ontology]
```

### Tag Picker UI

When clicking "[+ Add Tag]" on a selection:

```
┌─────────────────────────────────┐
│ Add Tags to Selection           │
│                                  │
│ From: LLM Response Patterns     │
│ ☐ fawning                       │
│ ☐ indirect-refusal              │
│ ☑ clear-preference              │ ← checked
│ ☐ evasive                       │
│                                  │
│ From: Interview Quality         │
│ ☐ leading-question              │
│ ☑ neutral-framing               │
│                                  │
│ [Cancel] [Apply Tags]           │
└─────────────────────────────────┘
```

---

## Data Model Changes

### New Tables/Stores

**Event Store (JSONL):**
```
ontologies.jsonl           - Ontology definitions
ontology-tags.jsonl        - Tag definitions
```

**SQLite:**
```sql
-- Link ontologies to submissions
submission_ontologies (
  submission_id, 
  ontology_id, 
  attached_by, 
  usage_permissions,
  attached_at
)

-- Link tags to selections
selection_tags (
  selection_id,
  tag_id,
  tagged_by,
  tagged_at
)
```

### Modified Structures

**Selection:**
- Remove `label` field (use tags instead)
- Or keep `label` as freeform fallback

**Comment:**
- `target_type` removed (always 'selection')
- `target_id` → `selection_id` (clearer)

**Rating:**
- `target_type` removed (always 'selection')
- `target_id` → `selection_id`

---

## Implementation Plan

### Phase 1: Backend Refactor
1. Create ontology types and stores
2. Add submission_ontologies table
3. Add selection_tags table
4. Migrate existing data (labels → freeform tags?)
5. Update API routes

### Phase 2: Frontend Refactor
1. Unified SelectionCard component
2. Tag picker UI
3. Ontology management UI
4. Update annotation workflow

### Phase 3: Migration
1. Convert existing "labels" to freeform tags
2. Create default ontologies from existing usage
3. Update documentation

---

## Open Questions

### Q: What happens to existing labels?
**Option A:** Keep as legacy `label` field, show separately from ontology tags
**Option B:** Create "Freeform" ontology, convert labels to tags
**Option C:** Discard (only a few test selections exist)

**Recommendation:** Option A (keep label as optional freeform note)

### Q: Can users create ontologies?
**Initial:** Only researchers can create
**Future:** Community can propose, researchers approve

### Q: Can multiple ontologies apply to same submission?
**Yes** - e.g., "LLM Response Patterns" + "Interview Quality" both relevant

### Q: How do topics and ontologies relate?
- Topics can have **default ontologies** (auto-attached)
- Submissions can belong to multiple topics
- Each topic contributes its default ontologies
- Researchers can manually attach/detach ontologies regardless of topics

### Q: Hierarchical tags?
**Not in v1** - keep flat for simplicity
**Future:** "refusal" → "direct-refusal", "indirect-refusal"

### Q: Should selections auto-appear in margin, or only when tagged?
**Option A:** All selections appear (current behavior)
**Option B:** Only tagged/commented/rated selections appear
**Option C:** Configurable per user

**Recommendation:** Option A for now (researchers want to see all annotations)

---

## Backward Compatibility

**Current system has:**
- Selection.label (freeform)
- Comment.target_type ('submission' | 'selection' | 'comment')
- Rating.target_type ('submission' | 'selection')

**Migration:**
1. Keep `label` field (optional)
2. Reject new submission/comment-level comments (must be on selection)
3. Migrate existing comments: create implicit selections for submission-level ones

---

## Next Steps

Should I:
1. **Implement this design** (backend + frontend refactor)
2. **Refine the ontology model** first (more discussion)
3. **Prototype ontology UI** separately before full refactor

This is substantial but the conceptual clarity is worth it.

