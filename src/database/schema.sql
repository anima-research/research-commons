-- Selections: Text ranges in submissions
CREATE TABLE IF NOT EXISTS selections (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  start_message_id TEXT NOT NULL,
  start_offset INTEGER,
  end_message_id TEXT NOT NULL,
  end_offset INTEGER,
  label TEXT,  -- Legacy/optional freeform label
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_selections_submission ON selections(submission_id);
CREATE INDEX IF NOT EXISTS idx_selections_creator ON selections(created_by);

-- Selection tags: Links selections to annotation tags
CREATE TABLE IF NOT EXISTS selection_tags (
  selection_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  tagged_by TEXT NOT NULL,
  tagged_at TEXT NOT NULL,
  PRIMARY KEY (selection_id, tag_id),
  FOREIGN KEY (selection_id) REFERENCES selections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_selection_tags_selection ON selection_tags(selection_id);
CREATE INDEX IF NOT EXISTS idx_selection_tags_tag ON selection_tags(tag_id);

-- Comments: Always on selections, can be threaded
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  selection_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  parent_id TEXT, -- for threading
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  FOREIGN KEY (selection_id) REFERENCES selections(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_selection ON comments(selection_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Ratings: Always on submissions (not selections)
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  rater_id TEXT NOT NULL,
  criterion_id TEXT NOT NULL,
  score REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  UNIQUE(rater_id, submission_id, criterion_id) -- One rating per rater/submission/criterion
);

CREATE INDEX IF NOT EXISTS idx_ratings_submission ON ratings(submission_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_criterion ON ratings(criterion_id);

-- Submission ontologies: Links ontologies to submissions
CREATE TABLE IF NOT EXISTS submission_ontologies (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  ontology_id TEXT NOT NULL,
  attached_by TEXT NOT NULL,
  attached_at TEXT NOT NULL,
  usage_permissions TEXT NOT NULL CHECK(usage_permissions IN ('anyone', 'expert-only', 'researcher-only')),
  is_default INTEGER NOT NULL DEFAULT 0,  -- Boolean: auto-attached from topic
  UNIQUE(submission_id, ontology_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_ontologies_submission ON submission_ontologies(submission_id);
CREATE INDEX IF NOT EXISTS idx_sub_ontologies_ontology ON submission_ontologies(ontology_id);

-- Submission ranking systems: Links ranking systems to submissions
CREATE TABLE IF NOT EXISTS submission_ranking_systems (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  ranking_system_id TEXT NOT NULL,
  attached_by TEXT NOT NULL,
  attached_at TEXT NOT NULL,
  usage_permissions TEXT NOT NULL CHECK(usage_permissions IN ('anyone', 'expert-only', 'researcher-only')),
  is_from_topic INTEGER NOT NULL DEFAULT 0,  -- Boolean: if true, cannot be detached
  UNIQUE(submission_id, ranking_system_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_ranking_systems_submission ON submission_ranking_systems(submission_id);
CREATE INDEX IF NOT EXISTS idx_sub_ranking_systems_ranking ON submission_ranking_systems(ranking_system_id);

