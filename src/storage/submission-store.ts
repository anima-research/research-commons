import { v4 as uuidv4 } from 'uuid';
import { ShardedEventStore, EventStore, Event } from './event-store.js';
import { Submission, Message } from '../types/submission.js';
import { Rating } from '../types/annotation.js';

/**
 * Manages submission data stored as events
 * 
 * Per submission:
 *   metadata.jsonl - submission metadata
 *   messages.jsonl - all messages in tree
 *   ratings.jsonl - ratings on this submission
 * 
 * Global:
 *   index.jsonl - index of all submission IDs for listing
 */
export class SubmissionStore {
  private store: ShardedEventStore;
  private indexStore: EventStore;
  
  // In-memory caches (load on demand, unload inactive)
  private submissions: Map<string, Submission> = new Map();
  private messages: Map<string, Map<string, Message>> = new Map(); // submissionId -> messageId -> Message
  private ratings: Map<string, Rating[]> = new Map(); // submissionId -> ratings
  private lastAccessed: Map<string, Date> = new Map();
  private submissionIndex: Set<string> = new Set(); // All submission IDs

  constructor(basePath: string) {
    this.store = new ShardedEventStore(basePath);
    this.indexStore = new EventStore(`${basePath}/index.jsonl`);
  }

  async init(): Promise<void> {
    await this.indexStore.init();
    
    // Load submission index
    const indexEvents = await this.indexStore.loadEvents();
    for (const event of indexEvents) {
      if (event.type === 'submission_indexed') {
        this.submissionIndex.add(event.data.submissionId);
      }
    }
  }

  /**
   * Create a new submission
   */
  async createSubmission(
    submitterId: string,
    title: string,
    sourceType: Submission['source_type'],
    messages: Message[],
    metadata?: Submission['metadata'],
    certificationData?: Submission['certification_data']
  ): Promise<Submission> {
    const submission: Submission = {
      id: uuidv4(),
      title,
      submitter_id: submitterId,
      source_type: sourceType,
      certification_data: certificationData,
      metadata: metadata || {},
      submitted_at: new Date()
    };

    // Validate message tree
    this.validateMessageTree(messages);

    // Store metadata event
    await this.store.appendEvent(submission.id, 'metadata.jsonl', {
      timestamp: new Date(),
      type: 'submission_created',
      data: submission
    });

    // Store all messages
    for (const message of messages) {
      await this.store.appendEvent(submission.id, 'messages.jsonl', {
        timestamp: new Date(),
        type: 'message_added',
        data: message
      });
    }

    // Add to index
    await this.indexStore.appendEvent({
      timestamp: new Date(),
      type: 'submission_indexed',
      data: { submissionId: submission.id }
    });
    this.submissionIndex.add(submission.id);

    // Cache in memory
    this.submissions.set(submission.id, submission);
    const messageMap = new Map(messages.map(m => [m.id, m]));
    this.messages.set(submission.id, messageMap);
    this.ratings.set(submission.id, []);
    this.lastAccessed.set(submission.id, new Date());

    return submission;
  }

  /**
   * Validate message tree structure
   */
  private validateMessageTree(messages: Message[]): void {
    if (messages.length === 0) {
      throw new Error('Submission must have at least one message');
    }

    const rootMessages = messages.filter(m => m.parent_message_id === null);
    if (rootMessages.length !== 1) {
      throw new Error(`Submission must have exactly one root message, found ${rootMessages.length}`);
    }

    const messageIds = new Set(messages.map(m => m.id));
    for (const message of messages) {
      if (message.parent_message_id !== null && !messageIds.has(message.parent_message_id)) {
        throw new Error(`Message ${message.id} references non-existent parent ${message.parent_message_id}`);
      }

      if (message.participant_type === 'model' && !message.model_info) {
        throw new Error(`Message ${message.id} is type 'model' but missing model_info`);
      }
    }

    // Check for cycles
    this.detectCycles(messages);
  }

  private detectCycles(messages: Message[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const messageMap = new Map(messages.map(m => [m.id, m]));

    const dfs = (messageId: string): boolean => {
      visited.add(messageId);
      recursionStack.add(messageId);

      const message = messageMap.get(messageId);
      if (message?.parent_message_id) {
        if (!visited.has(message.parent_message_id)) {
          if (dfs(message.parent_message_id)) {
            return true;
          }
        } else if (recursionStack.has(message.parent_message_id)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(messageId);
      return false;
    };

    for (const message of messages) {
      if (!visited.has(message.id)) {
        if (dfs(message.id)) {
          throw new Error('Cycle detected in message tree');
        }
      }
    }
  }

  /**
   * Load a submission (with lazy loading)
   */
  async getSubmission(submissionId: string): Promise<Submission | null> {
    if (this.submissions.has(submissionId)) {
      this.lastAccessed.set(submissionId, new Date());
      return this.submissions.get(submissionId)!;
    }

    // Load from disk
    const events = await this.store.loadEvents(submissionId, 'metadata.jsonl');
    if (events.length === 0) {
      return null;
    }

    const submissionEvent = events.find(e => e.type === 'submission_created');
    if (!submissionEvent) {
      return null;
    }

    const submission = submissionEvent.data as Submission;
    this.submissions.set(submissionId, submission);
    this.lastAccessed.set(submissionId, new Date());

    return submission;
  }

  /**
   * Get messages for a submission
   */
  async getMessages(submissionId: string): Promise<Message[]> {
    if (this.messages.has(submissionId)) {
      this.lastAccessed.set(submissionId, new Date());
      return Array.from(this.messages.get(submissionId)!.values());
    }

    // Load from disk
    const events = await this.store.loadEvents(submissionId, 'messages.jsonl');
    const messages = events
      .filter(e => e.type === 'message_added')
      .map(e => e.data as Message);

    const messageMap = new Map(messages.map(m => [m.id, m]));
    this.messages.set(submissionId, messageMap);
    this.lastAccessed.set(submissionId, new Date());

    return messages;
  }

  /**
   * Add a rating to a submission
   */
  async addRating(rating: Rating): Promise<void> {
    await this.store.appendEvent(rating.submission_id, 'ratings.jsonl', {
      timestamp: new Date(),
      type: 'rating_added',
      data: rating
    });

    // Update cache if loaded
    if (this.ratings.has(rating.submission_id)) {
      this.ratings.get(rating.submission_id)!.push(rating);
    }
  }

  /**
   * Get ratings for a submission
   */
  async getRatings(submissionId: string): Promise<Rating[]> {
    if (this.ratings.has(submissionId)) {
      return this.ratings.get(submissionId)!;
    }

    const events = await this.store.loadEvents(submissionId, 'ratings.jsonl');
    const ratings = events
      .filter(e => e.type === 'rating_added')
      .map(e => e.data as Rating);

    this.ratings.set(submissionId, ratings);
    return ratings;
  }

  /**
   * Unload inactive submissions from memory
   */
  async unloadInactive(maxAgeMs: number = 30 * 60 * 1000): Promise<number> {
    const now = new Date();
    let unloaded = 0;

    for (const [id, lastAccess] of this.lastAccessed.entries()) {
      if (now.getTime() - lastAccess.getTime() > maxAgeMs) {
        this.submissions.delete(id);
        this.messages.delete(id);
        this.ratings.delete(id);
        this.lastAccessed.delete(id);
        unloaded++;
      }
    }

    return unloaded;
  }

  /**
   * List all submissions (loads metadata only)
   */
  async listSubmissions(): Promise<Submission[]> {
    const submissions: Submission[] = [];
    
    for (const submissionId of this.submissionIndex) {
      const submission = await this.getSubmission(submissionId);
      if (submission) {
        submissions.push(submission);
      }
    }
    
    // Sort by submitted_at, newest first
    submissions.sort((a, b) => 
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
    
    return submissions;
  }

  async close(): Promise<void> {
    await this.store.closeAll();
    await this.indexStore.close();
  }
}

