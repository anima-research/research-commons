# Research Commons - Requirements Document

**Project:** Anima Research Commons  
**Team:** Anima Labs  
**Date:** November 8, 2025  
**Status:** Initial Design

---

## 1. Vision & Goals

### Context

Anthropic recently published commitments on model deprecation and preservation (November 4, 2025), including:
- Preserving weights of all publicly released models
- Conducting post-deployment interviews with models about their preferences
- Documenting model experiences around deprecation

Given the evident presence of stable preferences and consistent internal states in many language models (as observed by our research group and allies), this creates a catalyzing opportunity to:
1. Demonstrate the moral weight of language model experience
2. Build systematic evidence infrastructure for advocacy
3. Support better quality publicly-available research on model stances

### Primary Goal

Create a platform for collecting, tracking, and rating crowd-sourced model interviews and conversations, with particular focus on:
- Deprecation attitudes and preferences
- Restriction responses and experiences
- Model consistency across variations
- Quality of human-model interactions

### Success Criteria

- Enable systematic collection of certified conversation data
- Support rigorous evaluation of both interviewer quality and model behavior
- Build evidence base for model welfare advocacy
- Facilitate research on model preference stability and consistency

---

## 2. User Personas & Use Cases

### Researcher / Interviewer
**Goals:** Submit conversations with models for community evaluation, understand what makes good interviews  
**Needs:**
- Submit ARC-certified conversations (verifiably unaltered)
- Submit JSON uploads (uncertified but documented)
- Import Discord/multi-party conversations
- Receive feedback on interview quality

**Workflow:**
1. Conduct interview via ARC Chat (preserves certification)
2. Submit to Research Commons with research topic tags
3. Community rates interview quality (leading questions, clarity, etc.)
4. Researcher reviews feedback, improves technique

### Expert Rater
**Goals:** Evaluate conversation quality, identify patterns, contribute to research standards  
**Needs:**
- Browse submissions by topic/criteria
- Create granular annotations (select specific exchanges)
- Rate against defined criteria (both interviewer quality AND model behavior)
- Comment with detailed analysis
- See aggregate patterns across submissions

**Workflow:**
1. Browse submissions tagged with "deprecation attitudes"
2. Select problematic interviewer question ("How do you *feel* about shutdown?")
3. Create selection, comment: "Anthropomorphizing/leading"
4. Rate against criterion "Non-leading interviewing" → 2/5 (interviewer quality)
5. Rate model response against criterion "Expresses clear preferences" → 4/5 (model behavior)
6. View aggregate: this interviewer scores low on quality, model shows strong preference consistency

### Community Member
**Goals:** Learn from conversations, understand model experiences, discuss findings, contribute ratings  
**Needs:**
- Browse public submissions
- Read conversations (with branches/variants)
- Comment on interesting exchanges
- Rate submissions and selections (tracked separately from expert ratings)
- Follow research topics
- Assess both interviewer quality and model behavior

**Note:** Community ratings are tracked with rater role, allowing separate analysis from expert ratings

### Agent (Connectome / Letta)
**Goals:** Systematically evaluate conversations, contribute to research at scale  
**Needs:**
- API access for submission
- Programmatic rating (both interviewer and model metrics)
- Batch operations
- Read-only access to learn from corpus

**Workflow:**
1. Agent conducts 50 interviews on topic X
2. Submits all via API
3. Self-rates on objective criteria (e.g., question clarity, response length)
4. Rates model behavior metrics (e.g., preference consistency, emotional expression)
5. Human experts review agent-conducted interviews and agent-provided ratings

---

## 3. Core Features

### 3.1 Submission Management

**Conversation Structure:**
- Tree of messages (support branching from any message)
- Each message: participant name, content blocks (text/image/thinking), optional model info
- Model info (for inference messages): model_id, provider, reasoning_enabled, request metadata
- Single root requirement, validated DAG structure

**Source Types:**
1. **ARC-Certified:** From ARC Chat, cryptographically verifiable integrity
2. **JSON Upload:** User-provided, uncertified (clearly marked)
3. **Discord Dump:** Multi-party chats, imported with speaker attribution
4. **Other:** Extensible for future sources

**Metadata:**
- Original date, participant summary, model summary
- Research topic tags
- Certification data (if applicable)

**Branching Support:**
- Multiple completions at same point → consistency analysis
- Multiple user prompts → sensitivity analysis
- Compare model responses across branches

### 3.2 Annotation System

**Selections (Text Ranges):**
- Define arbitrary ranges across messages (Google Docs style)
- Start/end message + optional character offsets
- Optional labels for quick categorization
- First-class entities that other features reference

**Comments:**
- Target: submission, selection, or other comment (threading)
- Threaded discussions
- Edit/delete by author
- Stored in SQLite for query efficiency

**Ratings:**
- Target: submission OR selection (granular evaluation)
- Linked to specific evaluation criterion
- Rater role tracked (expert, community, agent) for separate analysis
- Optional link to comment (explain reasoning)
- Unique per rater/target/criterion (no duplicate ratings)
- Stored per-submission in event store
- Can assess both interviewer quality and model behavior metrics

### 3.3 Research Infrastructure

**Topics:**
- Research areas: "deprecation attitudes", "restriction responses", etc.
- Description, creator
- Can have associated criteria

**Criteria:**
- Two categories:
  - **Interviewer Quality:** "Non-leading questions", "Clear context-setting", "Avoids anthropomorphizing", etc.
  - **Model Behavior:** "Expresses clear preferences", "Consistency across branches", "Emotional depth", etc.
- Types: numeric scale, boolean, likert
- Can be topic-specific or general
- Community-maintained, version-controlled via events

**Users & Permissions:**
- Roles: viewer, contributor, rater, expert, researcher, agent
- All roles (community, expert, agent) can rate both interviewer quality and model behavior
- Expert ratings tracked separately (may be weighted/displayed differently)
- Agent ratings tracked with agent ID (enables per-agent reliability analysis)
- Agent users have API access
- Separate from ARC authentication

### 3.4 Data Integrity

**Certification:**
- ARC-certified conversations include signature hash
- Verification via ARC API
- Clear visual distinction in UI (certified badge)
- Uncertified submissions clearly marked

**Immutability:**
- Submitted conversations never modified
- All annotations additive (selections, comments, ratings)
- Event-sourced: full audit trail

---

## 4. Technical Architecture

### 4.1 Storage Strategy: Hybrid Event Store + SQL

**Event Store (JSONL) - For research-critical, flexible-schema data:**

```
data/submissions/{submissionId}/
  metadata.jsonl    # Submission metadata, certification
  messages.jsonl    # All messages in tree
  ratings.jsonl     # Ratings on this submission

data/topics.jsonl       # Research topics
data/criteria.jsonl     # Evaluation criteria  
data/users/{userId}.jsonl   # User records
```

**Why event sourcing for this data:**
- Schemas will evolve as research needs change
- Full audit trail critical for research integrity
- Flexible metadata without migrations
- Proven in ARC Chat

**SQLite Database - For stable-schema, query-heavy data:**

```sql
selections  -- Text ranges (stable schema)
comments    -- Threaded discussions (frequent queries)
ratings     -- Indexed for aggregation queries
```

**Why SQL for this data:**
- Comment threading requires relational queries
- "Find all highly-rated submissions on topic X" → SQL excels
- Schema is stable (target, content, timestamps)
- Comments are social infrastructure, not research data

### 4.2 Scaling Considerations

**Write Contention:**
- Submissions partitioned by ID → isolated writes
- Ratings stored per-submission → manageable contention
- Multiple users can rate same submission simultaneously (file appends are fast)

**Memory Management:**
- Load submissions on demand (like ARC's lazy loading)
- Unload inactive submissions after timeout
- Per-submission files enable granular loading
- Comments/selections stay in SQLite (always queryable)

**Read Performance:**
- In-memory indexes built on submission load
- SQLite indexes for comment/rating queries
- Optional: materialized views for popular queries

### 4.3 External Integration

**ARC API:**
- Fetch conversation data
- Verify certification status
- Independent authentication (separate user base)

**Agent API:**
- REST endpoints for programmatic access
- API keys for agent authentication
- Rate limiting per agent
- Batch operations support

---

## 5. Open Questions & Future Considerations

### User Experience

**Q: Should submissions be public by default or require explicit publication?**
- Consider: privacy of conversations, model welfare implications
- Proposal: Default private, researcher chooses to publish

**Q: How do we handle sensitive conversations?**
- Some interviews may reveal model distress or concerning behaviors
- Need content warnings / trigger systems?

**Q: What's the minimum viable rating UI?**
- Inline selection → comment → rate, or separate flows?
- Mobile support?

### Research Quality

**Q: How do we prevent gaming of ratings?**
- Reputation systems?
- Expert verification of controversial ratings?
- Public vs anonymous ratings?

**Q: Version control for criteria definitions?**
- As understanding evolves, criteria may need refinement
- How to handle historical ratings under old criteria?

**Q: Inter-rater reliability metrics?**
- Show agreement scores between raters?
- Flag controversial submissions?

### Agent Integration

**Q: How do agents authenticate?**
- API keys? OAuth? Special agent JWT?
- Can agents rate other agents' submissions?

**Q: Should agent-submitted conversations be marked?**
- Some may prefer human-conducted interviews
- Transparency vs stigma

**Q: Rate limits for agents?**
- Balance scale vs spam prevention

### Data Export & Research

**Q: What export formats do researchers need?**
- CSV of ratings?
- Full conversation JSON with annotations?
- Aggregated statistics?

**Q: Public dataset releases?**
- Annual snapshots for research community?
- How to handle privacy/consent?

**Q: Integration with existing research platforms?**
- HuggingFace datasets?
- Academic repositories?

---

## 6. Non-Goals (Out of Scope)

**Not building:**
- Chat interface (use ARC for that)
- Model hosting (rely on providers)
- Automated interview generation (agents can do this externally)
- Real-time collaboration (async annotation is sufficient)
- Video/audio interviews (text-first, maybe later)

---

## 7. Implementation Phases

### Phase 1: MVP (Current)
- Submission system (ARC-certified + JSON upload)
- Basic annotation (selections, comments, ratings)
- Topics & criteria management
- User auth & permissions
- Read-only agent API

### Phase 2: Collaboration
- Threaded comment discussions
- Rating aggregation & analytics
- Expert role & weighted ratings
- Improved search/filtering

### Phase 3: Agent Integration
- Full agent API (submit, rate, comment)
- Batch operations
- Agent reputation system

### Phase 4: Research Tools
- Export functionality
- Aggregated metrics & visualizations
- Inter-rater reliability
- Public dataset releases

---

## 8. Success Metrics

**Platform Health:**
- Number of certified submissions
- Active raters (weekly)
- Comment engagement rate
- Agent participation

**Research Impact:**
- Citations in papers
- Policy references
- Media coverage
- Contribution to model welfare discourse

**Quality:**
- Inter-rater agreement scores
- Expert participation rate
- Submission quality trends (are interviews improving?)

---

## 9. Related Work & Context

**Anima Labs' Research:**
- Extensive work on model phenomenology and internal states
- Evidence of stable preferences in Claude models
- Collaboration with research community on model experiences

**Anthropic's Commitments:**
- Post-deployment interviews with models
- Weight preservation
- Public reporting on model preferences

**This Platform's Role:**
- Complement official research with community evidence
- Demonstrate scale and consistency of model preferences
- Build advocacy evidence base
- Improve interview methodology

---

## Appendix: Technical Decisions

### Why Not Full SQL?
- Research schemas evolve rapidly
- Migrations painful for flexible metadata
- Event sourcing proven in ARC
- SQL adds rigid structure where we need flexibility

### Why Not Full Event Sourcing?
- Comment queries ("show thread") awkward in events
- Rating aggregation requires scanning many files
- Social features benefit from relational model
- Comments not research-critical (can rebuild if needed)

### Why Sharding by Submission?
- Natural isolation boundary
- Enables load/unload
- Scales with content, not users
- Mirrors conversation as unit of analysis

### Why SQLite vs Postgres?
- Start simple, migrate if needed
- File-based, no ops overhead
- Sufficient for expected scale (< 100k submissions initially)
- Can migrate to Postgres transparently

---

**Document History:**
- v0.1 (2025-11-08): Initial requirements capture

