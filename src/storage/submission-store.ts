import { v4 as uuidv4 } from 'uuid';
import { ShardedEventStore, EventStore, Event } from './event-store.js';
import { Submission, Message, VisibilityLevel } from '../types/submission.js';
import { Rating } from '../types/annotation.js';

/**
 * Filter options for listing submissions
 */
export interface ListSubmissionsFilter {
  visibility?: VisibilityLevel[];  // Only include these visibility levels
  includeDeleted?: boolean;        // Include soft-deleted submissions (default: false)
}

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
    certificationData?: Submission['certification_data'],
    visibility: VisibilityLevel = 'public'
  ): Promise<Submission> {
    const submission: Submission = {
      id: uuidv4(),
      title,
      submitter_id: submitterId,
      source_type: sourceType,
      visibility, // Screening visibility state
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

    // Replay all events to get current state
    const submissionEvent = events.find(e => e.type === 'submission_created');
    if (!submissionEvent) return null;
    
    let submission = submissionEvent.data as Submission;
    
    // Apply all updates (not just metadata)
    const updateEvents = events.filter(e => e.type === 'submission_updated');
    for (const event of updateEvents) {
      const updates = event.data.updates;
      // Apply all fields from updates
      submission = { ...submission, ...updates };
      // Merge metadata separately to avoid overwriting
      if (updates.metadata) {
        submission.metadata = { ...submission.metadata, ...updates.metadata };
      }
    }

    this.submissions.set(submissionId, submission);
    this.lastAccessed.set(submissionId, new Date());

    return submission;
  }

  /**
   * Update submission metadata
   */
  async updateSubmission(submissionId: string, updates: Submission): Promise<void> {
    await this.store.appendEvent(submissionId, 'metadata.jsonl', {
      timestamp: new Date(),
      type: 'submission_updated',
      data: { updates }
    });

    this.submissions.set(submissionId, updates);
  }

  /**
   * Soft delete submission
   */
  async deleteSubmission(submissionId: string, deletedBy: string): Promise<void> {
    const submission = await this.getSubmission(submissionId);
    if (!submission) return;

    submission.deleted = true;
    submission.deleted_at = new Date();
    submission.deleted_by = deletedBy;

    await this.updateSubmission(submissionId, submission);
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
    
    // Build message map by replaying events
    const messageMap = new Map<string, Message>();
    
    for (const event of events) {
      if (event.type === 'message_added') {
        const msg = event.data as Message;
        messageMap.set(msg.id, msg);
      } else if (event.type === 'message_order_updated') {
        const { messageId, newOrder } = event.data;
        const msg = messageMap.get(messageId);
        if (msg) {
          msg.order = newOrder;
        }
      } else if (event.type === 'message_parent_updated') {
        const { messageId, newParentId } = event.data;
        const msg = messageMap.get(messageId);
        if (msg) {
          msg.parent_message_id = newParentId;
        }
      }
    }

    this.messages.set(submissionId, messageMap);
    this.lastAccessed.set(submissionId, new Date());

    return Array.from(messageMap.values());
  }

  // Note: Ratings no longer stored in event store - moved to SQLite
  // These methods are kept for backward compatibility but deprecated

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
   * List submissions with optional filtering
   * @param filter Optional filters for visibility and deleted status
   */
  async listSubmissions(filter?: ListSubmissionsFilter): Promise<Submission[]> {
    const submissions: Submission[] = [];
    
    for (const submissionId of this.submissionIndex) {
      const submission = await this.getSubmission(submissionId);
      if (!submission) continue;
      
      // Filter by deleted status (default: exclude deleted)
      if (!filter?.includeDeleted && submission.deleted) {
        continue;
      }
      
      // Filter by visibility (if specified)
      // Backward compat: treat missing visibility as 'public'
      if (filter?.visibility && filter.visibility.length > 0) {
        const subVisibility = submission.visibility || 'public';
        if (!filter.visibility.includes(subVisibility)) {
          continue;
        }
      }
      
      submissions.push(submission);
    }
    
    // Sort by submitted_at, newest first
    submissions.sort((a, b) => 
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );
    
    return submissions;
  }

  /**
   * List pending submissions (convenience method for screening queue)
   */
  async listPendingSubmissions(): Promise<Submission[]> {
    return this.listSubmissions({ visibility: ['pending'] });
  }

  /**
   * Extend a conversation by prepending or appending messages
   * @param submissionId The submission to extend
   * @param newMessages New messages to add (already formatted)
   * @param direction 'earlier' to prepend, 'later' to append
   * @returns Updated message count
   */
  async extendConversation(
    submissionId: string,
    newMessages: Message[],
    direction: 'earlier' | 'later'
  ): Promise<{ addedCount: number; totalCount: number }> {
    if (newMessages.length === 0) {
      const existing = await this.getMessages(submissionId);
      return { addedCount: 0, totalCount: existing.length };
    }

    // Load existing messages
    const existingMessages = await this.getMessages(submissionId);
    existingMessages.sort((a, b) => a.order - b.order);

    if (direction === 'earlier') {
      // PREPENDING: New messages go at the beginning
      const shiftAmount = newMessages.length;
      
      // Find current root message (order 0, parent_message_id = null)
      const currentRoot = existingMessages.find(m => m.parent_message_id === null);
      if (!currentRoot) {
        throw new Error('Cannot find root message in existing conversation');
      }

      // Shift all existing message orders by the number of new messages
      for (const msg of existingMessages) {
        msg.order += shiftAmount;
        // Store the order update event
        await this.store.appendEvent(submissionId, 'messages.jsonl', {
          timestamp: new Date(),
          type: 'message_order_updated',
          data: { messageId: msg.id, newOrder: msg.order }
        });
      }

      // Update current root to point to the last new message as parent
      const lastNewMessage = newMessages[newMessages.length - 1];
      currentRoot.parent_message_id = lastNewMessage.id;
      await this.store.appendEvent(submissionId, 'messages.jsonl', {
        timestamp: new Date(),
        type: 'message_parent_updated',
        data: { messageId: currentRoot.id, newParentId: lastNewMessage.id }
      });

      // Add new messages with correct order (0 to N-1)
      for (let i = 0; i < newMessages.length; i++) {
        const msg = newMessages[i];
        msg.order = i;
        msg.submission_id = submissionId;
        
        await this.store.appendEvent(submissionId, 'messages.jsonl', {
          timestamp: new Date(),
          type: 'message_added',
          data: msg
        });
      }

    } else {
      // APPENDING: New messages go at the end
      const currentMaxOrder = existingMessages.length > 0 
        ? Math.max(...existingMessages.map(m => m.order))
        : -1;
      
      // Find current last message (highest order)
      const currentLast = existingMessages.find(m => m.order === currentMaxOrder);

      // Add new messages with correct order and parent chain
      for (let i = 0; i < newMessages.length; i++) {
        const msg = newMessages[i];
        msg.order = currentMaxOrder + 1 + i;
        msg.submission_id = submissionId;
        
        // First new message points to current last message
        if (i === 0 && currentLast) {
          msg.parent_message_id = currentLast.id;
        }
        
        await this.store.appendEvent(submissionId, 'messages.jsonl', {
          timestamp: new Date(),
          type: 'message_added',
          data: msg
        });
      }
    }

    // Clear message cache to force reload
    this.messages.delete(submissionId);
    
    // Reload and return updated count
    const updatedMessages = await this.getMessages(submissionId);
    return { 
      addedCount: newMessages.length, 
      totalCount: updatedMessages.length 
    };
  }

  async close(): Promise<void> {
    await this.store.closeAll();
    await this.indexStore.close();
  }
}

