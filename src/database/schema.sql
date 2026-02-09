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

-- Selection tags: Links selections to annotation tags (allows multiple votes per tag)
CREATE TABLE IF NOT EXISTS selection_tags (
  selection_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  tagged_by TEXT NOT NULL,
  tagged_at TEXT NOT NULL,
  PRIMARY KEY (selection_id, tag_id, tagged_by),  -- Allow multiple users to vote same tag
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

-- Message reactions: Quick reactions to messages
CREATE TABLE IF NOT EXISTS message_reactions (
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK(reaction_type IN ('star', 'laugh', 'sparkles')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (message_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- Hidden messages: Messages hidden from non-researchers by admins/owners
CREATE TABLE IF NOT EXISTS hidden_messages (
  message_id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  hidden_by TEXT NOT NULL,
  hidden_at TEXT NOT NULL,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_hidden_messages_submission ON hidden_messages(submission_id);

-- Folder members: Who has explicit access to which folders
CREATE TABLE IF NOT EXISTS folder_members (
  folder_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  added_by TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (folder_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_folder_members_user ON folder_members(user_id);
CREATE INDEX IF NOT EXISTS idx_folder_members_folder ON folder_members(folder_id);

-- Folder submissions: Which submissions are in which folders
CREATE TABLE IF NOT EXISTS folder_submissions (
  folder_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  added_by TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (folder_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_folder_submissions_folder ON folder_submissions(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_submissions_submission ON folder_submissions(submission_id);

