-- Selections: Text ranges in submissions
CREATE TABLE IF NOT EXISTS selections (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  start_message_id TEXT NOT NULL,
  start_offset INTEGER,
  end_message_id TEXT NOT NULL,
  end_offset INTEGER,
  label TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_selections_submission ON selections(submission_id);
CREATE INDEX IF NOT EXISTS idx_selections_creator ON selections(created_by);

-- Comments: Threaded comments on submissions/selections/other comments
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('submission', 'selection', 'comment')),
  parent_id TEXT, -- for threading
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_submission ON comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Ratings: Linked to criteria, optionally to comments
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  rater_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK(target_type IN ('submission', 'selection')),
  criterion_id TEXT NOT NULL,
  score REAL NOT NULL,
  comment_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE SET NULL,
  UNIQUE(rater_id, target_id, criterion_id) -- One rating per rater/target/criterion
);

CREATE INDEX IF NOT EXISTS idx_ratings_submission ON ratings(submission_id);
CREATE INDEX IF NOT EXISTS idx_ratings_target ON ratings(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_criterion ON ratings(criterion_id);

