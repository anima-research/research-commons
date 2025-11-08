# Anima Research Commons

Platform for collecting, tracking, and rating crowd-sourced model interviews and conversations.

## Architecture

### Event Store (JSONL)
Research-critical data with flexible schemas:
- `data/submissions/{submissionId}/` - Submission metadata, messages, ratings
- `data/topics.jsonl` - Research topics
- `data/criteria.jsonl` - Evaluation criteria
- `data/users/{userId}.jsonl` - User records

### Database (SQLite)
Social/query-heavy with stable schemas:
- `selections` - Text ranges/annotations in submissions
- `comments` - Threaded comments on submissions/selections
- `ratings` - Linked to comments and criteria

### External Integration
- Calls ARC API for certified conversation data
- Independent user registration (not shared with ARC)

## Development

```bash
npm install
npm run dev
```

## Data Model

Submissions contain a tree of messages (branching chat conversations).
Researchers create selections (text ranges), comment on them, and rate them against criteria.

See `src/types/` for detailed schemas.

