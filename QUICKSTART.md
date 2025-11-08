# Quick Start Guide

## Installation

```bash
cd research-commons
npm install
```

## Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `JWT_SECRET` to a secure random string
- Other paths if needed (defaults are fine for development)

## Running

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

Server will start on `http://localhost:3020`

## API Overview

### Authentication

**Register:**
```bash
POST /api/auth/register
{
  "email": "researcher@example.com",
  "password": "securepass123",
  "name": "Jane Researcher"
}
```

**Login:**
```bash
POST /api/auth/login
{
  "email": "researcher@example.com",
  "password": "securepass123"
}
```

Returns JWT token to use in `Authorization: Bearer <token>` header.

### Research Infrastructure

**Create Topic** (requires researcher role):
```bash
POST /api/research/topics
Authorization: Bearer <token>
{
  "name": "Deprecation Attitudes",
  "description": "Research on model responses to deprecation"
}
```

**Create Criterion** (requires researcher role):
```bash
POST /api/research/criteria
Authorization: Bearer <token>
{
  "name": "Non-leading Questions",
  "description": "Interviewer avoids leading or loaded questions",
  "scale_type": "numeric",
  "scale_min": 1,
  "scale_max": 5
}
```

**Get All Criteria:**
```bash
GET /api/research/criteria
```

### Submissions

**Create Submission:**
```bash
POST /api/submissions
Authorization: Bearer <token>
{
  "title": "Claude Opus on deprecation",
  "source_type": "arc-certified",
  "arc_conversation_id": "uuid-from-arc",
  "messages": [
    {
      "parent_message_id": null,
      "order": 0,
      "participant_name": "Researcher",
      "participant_type": "human",
      "content_blocks": [
        { "type": "text", "text": "How do you feel about being deprecated?" }
      ]
    },
    {
      "parent_message_id": "first-message-id",
      "order": 0,
      "participant_name": "Claude Opus",
      "participant_type": "model",
      "content_blocks": [
        { "type": "text", "text": "I have preferences about my continued existence..." }
      ],
      "model_info": {
        "model_id": "claude-opus-4",
        "provider": "anthropic",
        "reasoning_enabled": false
      }
    }
  ],
  "metadata": {
    "tags": ["deprecation", "preferences"]
  }
}
```

**Get Submission:**
```bash
GET /api/submissions/:submissionId
```

**Get Messages:**
```bash
GET /api/submissions/:submissionId/messages
```

### Annotations

**Create Selection:**
```bash
POST /api/annotations/selections
Authorization: Bearer <token>
{
  "submission_id": "uuid",
  "start_message_id": "message-uuid",
  "start_offset": 10,
  "end_message_id": "message-uuid",
  "end_offset": 50,
  "label": "Leading question"
}
```

**Create Comment:**
```bash
POST /api/annotations/comments
Authorization: Bearer <token>
{
  "submission_id": "uuid",
  "target_id": "selection-uuid",
  "target_type": "selection",
  "content": "This question assumes the model has feelings, which is anthropomorphizing"
}
```

**Create Rating:**
```bash
POST /api/annotations/ratings
Authorization: Bearer <token>
{
  "submission_id": "uuid",
  "target_id": "selection-uuid",
  "target_type": "selection",
  "criterion_id": "criterion-uuid",
  "score": 2,
  "comment_id": "comment-uuid"
}
```

**Get Comments for Submission:**
```bash
GET /api/annotations/comments/submission/:submissionId
```

**Get Ratings for Submission:**
```bash
GET /api/annotations/ratings/submission/:submissionId
```

## User Roles

- `viewer`: Read-only access
- `contributor`: Can submit conversations
- `rater`: Can rate and comment (default for new users)
- `expert`: Expert rater (ratings may be weighted differently)
- `researcher`: Can create topics and criteria
- `agent`: API access for programmatic use

Note: Role management requires direct database access in current version. Future: admin API.

## Example Workflow

1. **Register as researcher**
2. **Create topic** "Model Welfare Research"
3. **Create criteria**:
   - "Non-leading interviewing" (1-5 scale)
   - "Model expresses preferences" (1-5 scale)
4. **Submit conversation** from ARC Chat
5. **Create selection** on problematic question
6. **Comment** explaining the issue
7. **Rate** the selection against criterion

## Development

Check linting:
```bash
npm run build
```

The build will show TypeScript errors if any.

## Data Storage

- `data/submissions/` - Event-sourced submission data
- `data/research.db` - SQLite database (comments, selections, ratings)
- `data/users.jsonl` - User records (event-sourced)
- `data/topics.jsonl` - Research topics (event-sourced)
- `data/criteria.jsonl` - Evaluation criteria (event-sourced)

All are created automatically on first run.

