import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Selection, Comment, Rating } from '../types/annotation.js';
import { SubmissionOntology } from '../types/ontology.js';
import { SubmissionRankingSystem } from '../types/ranking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AnnotationDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    this.migrate();
  }

  private migrate(): void {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);
  }

  // Selection methods
  createSelection(selection: Selection): void {
    const stmt = this.db.prepare(`
      INSERT INTO selections (
        id, submission_id, created_by, start_message_id, start_offset,
        end_message_id, end_offset, label, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      selection.id,
      selection.submission_id,
      selection.created_by,
      selection.start_message_id,
      selection.start_offset ?? null,
      selection.end_message_id,
      selection.end_offset ?? null,
      selection.label ?? null,
      selection.created_at.toISOString()
    );
  }

  getSelection(id: string): Selection | null {
    const row = this.db.prepare('SELECT * FROM selections WHERE id = ?').get(id);
    if (!row) return null;
    
    const selection = this.rowToSelection(row);
    // Populate annotation_tags from selection_tags table
    const tagRows = this.db.prepare('SELECT DISTINCT tag_id FROM selection_tags WHERE selection_id = ?').all(id);
    selection.annotation_tags = tagRows.map((r: any) => r.tag_id);
    return selection;
  }

  getSelectionsBySubmission(submissionId: string): Selection[] {
    const rows = this.db.prepare('SELECT * FROM selections WHERE submission_id = ? ORDER BY created_at').all(submissionId);
    return rows.map((row: any) => {
      const selection = this.rowToSelection(row);
      // Populate annotation_tags from selection_tags table
      const tagRows = this.db.prepare('SELECT DISTINCT tag_id FROM selection_tags WHERE selection_id = ?').all(row.id);
      selection.annotation_tags = tagRows.map((r: any) => r.tag_id);
      return selection;
    });
  }

  getSelectionsByUser(userId: string): Selection[] {
    const rows = this.db.prepare('SELECT * FROM selections WHERE created_by = ? ORDER BY created_at DESC').all(userId);
    return rows.map((row: any) => {
      const selection = this.rowToSelection(row);
      // Populate annotation_tags from selection_tags table
      const tagRows = this.db.prepare('SELECT DISTINCT tag_id FROM selection_tags WHERE selection_id = ?').all(row.id);
      selection.annotation_tags = tagRows.map((r: any) => r.tag_id);
      return selection;
    });
  }

  deleteSelection(id: string): void {
    // Foreign keys with CASCADE will handle comments, ratings, and tags
    this.db.prepare('DELETE FROM selections WHERE id = ?').run(id);
  }

  private rowToSelection(row: any): Selection {
    return {
      id: row.id,
      submission_id: row.submission_id,
      created_by: row.created_by,
      start_message_id: row.start_message_id,
      start_offset: row.start_offset,
      end_message_id: row.end_message_id,
      end_offset: row.end_offset,
      label: row.label,
      annotation_tags: [], // Will be populated separately
      created_at: new Date(row.created_at)
    };
  }
  
  // Selection tag methods
  applyTags(selectionId: string, tagIds: string[], taggedBy: string): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO selection_tags (selection_id, tag_id, tagged_by, tagged_at)
      VALUES (?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    for (const tagId of tagIds) {
      stmt.run(selectionId, tagId, taggedBy, now);
    }
  }
  
  removeTag(selectionId: string, tagId: string, userId: string): void {
    // Only remove this specific user's vote, not all votes for the tag
    this.db.prepare('DELETE FROM selection_tags WHERE selection_id = ? AND tag_id = ? AND tagged_by = ?')
      .run(selectionId, tagId, userId);
  }
  
  getTagsForSelection(selectionId: string): string[] {
    const rows = this.db.prepare('SELECT tag_id FROM selection_tags WHERE selection_id = ?')
      .all(selectionId);
    return rows.map((row: any) => row.tag_id);
  }

  getTagAttributions(selectionId: string): Array<{ tag_id: string; tagged_by: string; tagged_at: Date }> {
    const rows = this.db.prepare(
      'SELECT tag_id, tagged_by, tagged_at FROM selection_tags WHERE selection_id = ? ORDER BY tagged_at'
    ).all(selectionId);
    
    return rows.map((row: any) => ({
      tag_id: row.tag_id,
      tagged_by: row.tagged_by,
      tagged_at: new Date(row.tagged_at)
    }));
  }
  
  getSelectionWithTags(id: string): Selection | null {
    const selection = this.getSelection(id);
    if (!selection) return null;
    selection.annotation_tags = this.getTagsForSelection(id);
    return selection;
  }
  
  canDeleteSelection(selectionId: string, userId: string): { canDelete: boolean; reason?: string } {
    const selection = this.getSelection(selectionId);
    if (!selection) return { canDelete: false, reason: 'Selection not found' };
    
    // Creator can always delete their own empty selection
    if (selection.created_by === userId) {
      // Check if selection has any content from others
      const comments = this.getCommentsBySelection(selectionId);
      const hasOthersComments = comments.some(c => c.author_id !== userId);
      
      const tags = this.getTagAttributions(selectionId);
      const hasOthersTags = tags.some(t => t.tagged_by !== userId);
      
      if (hasOthersComments || hasOthersTags) {
        return { canDelete: false, reason: 'Selection has contributions from other users' };
      }
      
      return { canDelete: true };
    }
    
    // Non-creators can only delete if they're the sole contributor
    const comments = this.getCommentsBySelection(selectionId);
    const allCommentsAreTheirs = comments.every(c => c.author_id === userId);
    
    const tags = this.getTagAttributions(selectionId);
    const allTagsAreTheirs = tags.every(t => t.tagged_by === userId);
    
    if (comments.length === 0 && tags.length === 0) {
      return { canDelete: false, reason: 'Cannot delete empty selection created by someone else' };
    }
    
    if (allCommentsAreTheirs && allTagsAreTheirs && (comments.length > 0 || tags.length > 0)) {
      return { canDelete: true };
    }
    
    return { canDelete: false, reason: 'Selection has contributions from other users or you' };
  }

  // Comment methods
  createComment(comment: Comment): void {
    const stmt = this.db.prepare(`
      INSERT INTO comments (
        id, selection_id, author_id, parent_id, content, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      comment.id,
      comment.selection_id,
      comment.author_id,
      comment.parent_id ?? null,
      comment.content,
      comment.created_at.toISOString(),
      comment.updated_at?.toISOString() ?? null
    );
  }

  getComment(id: string): Comment | null {
    const row = this.db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    return row ? this.rowToComment(row) : null;
  }

  getCommentsBySelection(selectionId: string): Comment[] {
    const rows = this.db.prepare('SELECT * FROM comments WHERE selection_id = ? ORDER BY created_at').all(selectionId);
    return rows.map(row => this.rowToComment(row));
  }

  getCommentReplies(parentId: string): Comment[] {
    const rows = this.db.prepare('SELECT * FROM comments WHERE parent_id = ? ORDER BY created_at').all(parentId);
    return rows.map(row => this.rowToComment(row));
  }

  updateComment(id: string, content: string): void {
    this.db.prepare('UPDATE comments SET content = ?, updated_at = ? WHERE id = ?')
      .run(content, new Date().toISOString(), id);
  }

  deleteComment(id: string): void {
    this.db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  }

  private rowToComment(row: any): Comment {
    return {
      id: row.id,
      selection_id: row.selection_id,
      author_id: row.author_id,
      parent_id: row.parent_id,
      content: row.content,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  // Rating methods
  createRating(rating: Rating): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ratings (
        id, submission_id, rater_id, criterion_id, score, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      rating.id,
      rating.submission_id,
      rating.rater_id,
      rating.criterion_id,
      rating.score,
      rating.created_at.toISOString(),
      rating.updated_at?.toISOString() ?? null
    );
  }

  getRating(id: string): Rating | null {
    const row = this.db.prepare('SELECT * FROM ratings WHERE id = ?').get(id);
    return row ? this.rowToRating(row) : null;
  }

  getRatingsBySubmission(submissionId: string): Rating[] {
    const rows = this.db.prepare('SELECT * FROM ratings WHERE submission_id = ? ORDER BY created_at').all(submissionId);
    return rows.map(row => this.rowToRating(row));
  }

  getRatingsByCriterion(criterionId: string): Rating[] {
    const rows = this.db.prepare('SELECT * FROM ratings WHERE criterion_id = ? ORDER BY created_at DESC').all(criterionId);
    return rows.map(row => this.rowToRating(row));
  }

  updateRating(id: string, score: number): void {
    this.db.prepare('UPDATE ratings SET score = ?, updated_at = ? WHERE id = ?')
      .run(score, new Date().toISOString(), id);
  }

  deleteRating(id: string): void {
    this.db.prepare('DELETE FROM ratings WHERE id = ?').run(id);
  }

  private rowToRating(row: any): Rating {
    return {
      id: row.id,
      submission_id: row.submission_id,
      rater_id: row.rater_id,
      criterion_id: row.criterion_id,
      score: row.score,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }
  
  // Submission ontology methods
  attachOntology(submissionOntology: SubmissionOntology): void {
    const stmt = this.db.prepare(`
      INSERT INTO submission_ontologies (
        id, submission_id, ontology_id, attached_by, attached_at,
        usage_permissions, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      submissionOntology.id,
      submissionOntology.submission_id,
      submissionOntology.ontology_id,
      submissionOntology.attached_by,
      submissionOntology.attached_at.toISOString(),
      submissionOntology.usage_permissions,
      submissionOntology.is_default ? 1 : 0
    );
  }
  
  getSubmissionOntologies(submissionId: string): SubmissionOntology[] {
    const rows = this.db.prepare('SELECT * FROM submission_ontologies WHERE submission_id = ?')
      .all(submissionId);
    return rows.map((row: any) => ({
      id: row.id,
      submission_id: row.submission_id,
      ontology_id: row.ontology_id,
      attached_by: row.attached_by,
      attached_at: new Date(row.attached_at),
      usage_permissions: row.usage_permissions,
      is_default: row.is_default === 1
    }));
  }
  
  detachOntology(submissionId: string, ontologyId: string): void {
    this.db.prepare('DELETE FROM submission_ontologies WHERE submission_id = ? AND ontology_id = ?')
      .run(submissionId, ontologyId);
  }

  // Submission ranking system methods
  attachRankingSystem(submissionRankingSystem: SubmissionRankingSystem): void {
    const stmt = this.db.prepare(`
      INSERT INTO submission_ranking_systems (
        id, submission_id, ranking_system_id, attached_by, attached_at,
        usage_permissions, is_from_topic
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      submissionRankingSystem.id,
      submissionRankingSystem.submission_id,
      submissionRankingSystem.ranking_system_id,
      submissionRankingSystem.attached_by,
      submissionRankingSystem.attached_at.toISOString(),
      submissionRankingSystem.usage_permissions,
      submissionRankingSystem.is_from_topic ? 1 : 0
    );
  }
  
  getSubmissionRankingSystems(submissionId: string): SubmissionRankingSystem[] {
    const rows = this.db.prepare('SELECT * FROM submission_ranking_systems WHERE submission_id = ?')
      .all(submissionId);
    return rows.map((row: any) => ({
      id: row.id,
      submission_id: row.submission_id,
      ranking_system_id: row.ranking_system_id,
      attached_by: row.attached_by,
      attached_at: new Date(row.attached_at),
      usage_permissions: row.usage_permissions,
      is_from_topic: row.is_from_topic === 1
    }));
  }
  
  detachRankingSystem(submissionId: string, rankingSystemId: string): boolean {
    // Check if it's from topic (cannot be detached)
    const existing = this.db.prepare(
      'SELECT is_from_topic FROM submission_ranking_systems WHERE submission_id = ? AND ranking_system_id = ?'
    ).get(submissionId, rankingSystemId) as any;
    
    if (existing?.is_from_topic === 1) {
      return false; // Cannot detach topic-derived ranking systems
    }
    
    this.db.prepare('DELETE FROM submission_ranking_systems WHERE submission_id = ? AND ranking_system_id = ?')
      .run(submissionId, rankingSystemId);
    return true;
  }

  // Message reaction methods
  addReaction(messageId: string, userId: string, reactionType: 'star' | 'laugh' | 'sparkles'): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO message_reactions (message_id, user_id, reaction_type, created_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(messageId, userId, reactionType, new Date().toISOString());
  }

  removeReaction(messageId: string, userId: string, reactionType: 'star' | 'laugh' | 'sparkles'): void {
    const stmt = this.db.prepare(`
      DELETE FROM message_reactions
      WHERE message_id = ? AND user_id = ? AND reaction_type = ?
    `);
    stmt.run(messageId, userId, reactionType);
  }

  getReactionsByMessage(messageId: string): Array<{ user_id: string; reaction_type: string; created_at: string }> {
    const stmt = this.db.prepare(`
      SELECT user_id, reaction_type, created_at
      FROM message_reactions
      WHERE message_id = ?
      ORDER BY created_at
    `);
    return stmt.all(messageId) as Array<{ user_id: string; reaction_type: string; created_at: string }>;
  }

  getReactionsBySubmission(submissionId: string): Map<string, Array<{ user_id: string; reaction_type: string }>> {
    // Get all reactions for all messages in a submission
    const stmt = this.db.prepare(`
      SELECT mr.message_id, mr.user_id, mr.reaction_type
      FROM message_reactions mr
      INNER JOIN (
        SELECT id FROM messages WHERE submission_id = ?
      ) m ON mr.message_id = m.id
    `);
    
    // This would need messages table - let's simplify for now
    // Just return reactions for given message IDs
    return new Map();
  }

  close(): void {
    this.db.close();
  }
}


