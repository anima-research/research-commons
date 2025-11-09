import { v4 as uuidv4 } from 'uuid';
import { EventStore } from '../storage/event-store.js';
import { Topic } from '../types/research.js';
import { Criterion } from '../types/ranking.js';

/**
 * Manages topics and criteria (event-sourced)
 */
export class ResearchStore {
  private topicsFile: EventStore;
  private criteriaFile: EventStore;
  
  private topics: Map<string, Topic> = new Map();
  private criteria: Map<string, Criterion> = new Map();

  constructor(dataPath: string) {
    this.topicsFile = new EventStore(`${dataPath}/topics.jsonl`);
    this.criteriaFile = new EventStore(`${dataPath}/criteria.jsonl`);
  }

  async init(): Promise<void> {
    await this.topicsFile.init();
    await this.criteriaFile.init();

    // Load topics
    const topicEvents = await this.topicsFile.loadEvents();
    for (const event of topicEvents) {
      if (event.type === 'topic_created') {
        const topic = {
          ...event.data,
          created_at: new Date(event.data.created_at),
          // Ensure arrays exist for backward compat
          default_ontologies: event.data.default_ontologies || [],
          default_ranking_systems: event.data.default_ranking_systems || []
        };
        this.topics.set(topic.id, topic);
      } else if (event.type === 'topic_updated') {
        const topic = this.topics.get(event.data.id);
        if (topic) {
          this.topics.set(event.data.id, { ...topic, ...event.data.updates });
        }
      } else if (event.type === 'topic_deleted') {
        this.topics.delete(event.data.id);
      }
    }

    // Load criteria
    const criteriaEvents = await this.criteriaFile.loadEvents();
    for (const event of criteriaEvents) {
      if (event.type === 'criterion_created') {
        const criterion = {
          ...event.data,
          created_at: new Date(event.data.created_at)
        };
        this.criteria.set(criterion.id, criterion);
      }
    }
  }

  // Topic methods
  async createTopic(
    name: string, 
    description: string, 
    createdBy: string, 
    defaultOntologies: string[] = [],
    defaultRankingSystems: string[] = []
  ): Promise<Topic> {
    const topic: Topic = {
      id: uuidv4(),
      name,
      description,
      default_ontologies: defaultOntologies,
      default_ranking_systems: defaultRankingSystems,
      created_by: createdBy,
      created_at: new Date()
    };

    await this.topicsFile.appendEvent({
      timestamp: new Date(),
      type: 'topic_created',
      data: topic
    });

    this.topics.set(topic.id, topic);
    return topic;
  }

  async getTopic(id: string): Promise<Topic | null> {
    return this.topics.get(id) || null;
  }

  async getAllTopics(): Promise<Topic[]> {
    return Array.from(this.topics.values());
  }

  async updateTopic(id: string, updates: Partial<Topic>): Promise<Topic | null> {
    const topic = this.topics.get(id);
    if (!topic) return null;

    const updated = { ...topic, ...updates };
    this.topics.set(id, updated);

    await this.topicsFile.appendEvent({
      timestamp: new Date(),
      type: 'topic_updated',
      data: { id, updates }
    });

    return updated;
  }

  async deleteTopic(id: string): Promise<boolean> {
    if (!this.topics.has(id)) return false;

    this.topics.delete(id);

    await this.topicsFile.appendEvent({
      timestamp: new Date(),
      type: 'topic_deleted',
      data: { id }
    });

    return true;
  }

  // Criterion methods - deprecated, moved to RankingStore
  // Kept for backward compatibility with old API routes
  async getAllCriteria(): Promise<Criterion[]> {
    return Array.from(this.criteria.values());
  }

  async close(): Promise<void> {
    await this.topicsFile.close();
    await this.criteriaFile.close();
  }
}

