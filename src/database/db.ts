import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Selection, Comment, Rating } from '../types/annotation.js';

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
    return row ? this.rowToSelection(row) : null;
  }

  getSelectionsBySubmission(submissionId: string): Selection[] {
    const rows = this.db.prepare('SELECT * FROM selections WHERE submission_id = ? ORDER BY created_at').all(submissionId);
    return rows.map(row => this.rowToSelection(row));
  }

  getSelectionsByUser(userId: string): Selection[] {
    const rows = this.db.prepare('SELECT * FROM selections WHERE created_by = ? ORDER BY created_at DESC').all(userId);
    return rows.map(row => this.rowToSelection(row));
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
      created_at: new Date(row.created_at)
    };
  }

  // Comment methods
  createComment(comment: Comment): void {
    const stmt = this.db.prepare(`
      INSERT INTO comments (
        id, submission_id, author_id, target_id, target_type,
        parent_id, content, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      comment.id,
      comment.submission_id,
      comment.author_id,
      comment.target_id,
      comment.target_type,
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

  getCommentsBySubmission(submissionId: string): Comment[] {
    const rows = this.db.prepare('SELECT * FROM comments WHERE submission_id = ? ORDER BY created_at').all(submissionId);
    return rows.map(row => this.rowToComment(row));
  }

  getCommentsByTarget(targetId: string, targetType: string): Comment[] {
    const rows = this.db.prepare('SELECT * FROM comments WHERE target_id = ? AND target_type = ? ORDER BY created_at').all(targetId, targetType);
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
      submission_id: row.submission_id,
      author_id: row.author_id,
      target_id: row.target_id,
      target_type: row.target_type,
      parent_id: row.parent_id,
      content: row.content,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  // Rating methods
  createRating(rating: Rating): void {
    const stmt = this.db.prepare(`
      INSERT INTO ratings (
        id, submission_id, rater_id, target_id, target_type,
        criterion_id, score, comment_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      rating.id,
      rating.submission_id,
      rating.rater_id,
      rating.target_id,
      rating.target_type,
      rating.criterion_id,
      rating.score,
      rating.comment_id ?? null,
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

  getRatingsByTarget(targetId: string, targetType: string): Rating[] {
    const rows = this.db.prepare('SELECT * FROM ratings WHERE target_id = ? AND target_type = ? ORDER BY created_at').all(targetId, targetType);
    return rows.map(row => this.rowToRating(row));
  }

  getRatingsByCriterion(criterionId: string): Rating[] {
    const rows = this.db.prepare('SELECT * FROM ratings WHERE criterion_id = ? ORDER BY created_at DESC').all(criterionId);
    return rows.map(row => this.rowToRating(row));
  }

  updateRating(id: string, score: number, commentId?: string): void {
    this.db.prepare('UPDATE ratings SET score = ?, comment_id = ?, updated_at = ? WHERE id = ?')
      .run(score, commentId ?? null, new Date().toISOString(), id);
  }

  deleteRating(id: string): void {
    this.db.prepare('DELETE FROM ratings WHERE id = ?').run(id);
  }

  private rowToRating(row: any): Rating {
    return {
      id: row.id,
      submission_id: row.submission_id,
      rater_id: row.rater_id,
      target_id: row.target_id,
      target_type: row.target_type,
      criterion_id: row.criterion_id,
      score: row.score,
      comment_id: row.comment_id,
      created_at: new Date(row.created_at),
      updated_at: row.updated_at ? new Date(row.updated_at) : undefined
    };
  }

  close(): void {
    this.db.close();
  }
}

