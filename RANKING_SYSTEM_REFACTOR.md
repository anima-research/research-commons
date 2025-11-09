# Ranking System Refactor

**Date:** November 9, 2025  
**Status:** Design

## Goal

Make ranking systems parallel to ontologies - organized, attached to submissions, tied to research topics.

## Changes

### Data Model

**Before:**
```typescript
Criterion - standalone entities
Rating - references criterion + selection
```

**After:**
```typescript
RankingSystem {
  id, name, description, category
  // Like Ontology
}

Criterion {
  id, ranking_system_id, name, description, scale_min, scale_max
  // Like AnnotationTag (belongs to parent system)
}

SubmissionRankingSystem {
  submission_id, ranking_system_id, 
  attached_by, usage_permissions,
  is_from_topic: boolean  // If from topic, cannot be removed
}

Topic {
  default_ontologies: string[]
  default_ranking_systems: string[]  // NEW
}
```

### Key Feature: Topic Lock

**When submission tagged with topic:**
1. Auto-attaches topic's ranking systems
2. **is_from_topic = true** → cannot be detached
3. Can attach additional ranking systems manually
4. Only manually-attached ones can be removed

**Example:**
```
Submission tagged with "Deprecation Research"

Ranking Systems:
├─ Interview Quality ← from topic (locked 🔒)
├─ Model Authenticity ← from topic (locked 🔒)
└─ Custom Scale ← manually added (can remove ✕)
```

### Implementation

**Backend:**
1. Create RankingSystem type and store (event-sourced)
2. Move Criterion to belong to RankingSystem
3. Add submission_ranking_systems table
4. Update Topic to have default_ranking_systems
5. Auto-attach on submission creation

**Frontend:**
1. Rating form shows only attached ranking systems
2. Show lock icon on topic-derived systems
3. Can't detach locked systems

### Migration

- Existing loose criteria → create default ranking systems
- Group by category (interviewer vs model-behavior)

## Benefits

- Organized: Criteria grouped into coherent systems
- Focused: Only relevant criteria shown per submission
- Consistent: Topics enforce standard evaluation
- Flexible: Can add custom ranking systems
- Integrity: Topic-derived systems can't be removed (research consistency)

