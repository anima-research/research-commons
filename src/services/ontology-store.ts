import { v4 as uuidv4 } from 'uuid';
import { EventStore } from '../storage/event-store.js';
import { AnnotationOntology, AnnotationTag } from '../types/ontology.js';

/**
 * Manages ontologies and tags (event-sourced)
 */
export class OntologyStore {
  private ontologiesFile: EventStore;
  private tagsFile: EventStore;
  
  private ontologies: Map<string, AnnotationOntology> = new Map();
  private tags: Map<string, AnnotationTag> = new Map();
  private ontologyTags: Map<string, string[]> = new Map(); // ontologyId -> tagIds

  constructor(dataPath: string) {
    this.ontologiesFile = new EventStore(`${dataPath}/ontologies.jsonl`);
    this.tagsFile = new EventStore(`${dataPath}/ontology-tags.jsonl`);
  }

  async init(): Promise<void> {
    await this.ontologiesFile.init();
    await this.tagsFile.init();

    // Load ontologies
    const ontologyEvents = await this.ontologiesFile.loadEvents();
    for (const event of ontologyEvents) {
      if (event.type === 'ontology_created') {
        const ontology = {
          ...event.data,
          created_at: new Date(event.data.created_at)
        };
        this.ontologies.set(ontology.id, ontology);
      } else if (event.type === 'ontology_updated') {
        const existing = this.ontologies.get(event.data.id);
        if (existing) {
          this.ontologies.set(event.data.id, {
            ...existing,
            ...event.data.updates
          });
        }
      }
    }

    // Load tags
    const tagEvents = await this.tagsFile.loadEvents();
    for (const event of tagEvents) {
      if (event.type === 'tag_created') {
        const tag = event.data as AnnotationTag;
        this.tags.set(tag.id, tag);
        
        // Build reverse index
        const ontologyTagList = this.ontologyTags.get(tag.ontology_id) || [];
        ontologyTagList.push(tag.id);
        this.ontologyTags.set(tag.ontology_id, ontologyTagList);
      } else if (event.type === 'tag_deleted') {
        const tagId = event.data.id;
        const tag = this.tags.get(tagId);
        if (tag) {
          // Remove from reverse index
          const ontologyTagList = this.ontologyTags.get(tag.ontology_id) || [];
          this.ontologyTags.set(
            tag.ontology_id,
            ontologyTagList.filter(id => id !== tagId)
          );
          this.tags.delete(tagId);
        }
      }
    }
  }

  // Ontology methods
  async createOntology(
    name: string,
    description: string,
    category: AnnotationOntology['category'],
    permissions: AnnotationOntology['permissions'],
    createdBy: string,
    tags: Array<{name: string, description: string, color: string, examples?: string[]}>
  ): Promise<AnnotationOntology> {
    const ontology: AnnotationOntology = {
      id: uuidv4(),
      name,
      description,
      category,
      permissions,
      created_by: createdBy,
      created_at: new Date()
    };

    await this.ontologiesFile.appendEvent({
      timestamp: new Date(),
      type: 'ontology_created',
      data: ontology
    });

    this.ontologies.set(ontology.id, ontology);

    // Create tags
    const tagIds: string[] = [];
    for (const tagData of tags) {
      const tag = await this.createTag(ontology.id, tagData);
      tagIds.push(tag.id);
    }
    
    this.ontologyTags.set(ontology.id, tagIds);

    return ontology;
  }

  async createTag(
    ontologyId: string,
    data: {name: string, description: string, color: string, examples?: string[]}
  ): Promise<AnnotationTag> {
    const tag: AnnotationTag = {
      id: uuidv4(),
      ontology_id: ontologyId,
      name: data.name,
      description: data.description,
      color: data.color,
      examples: data.examples
    };

    await this.tagsFile.appendEvent({
      timestamp: new Date(),
      type: 'tag_created',
      data: tag
    });

    this.tags.set(tag.id, tag);

    return tag;
  }

  async getOntology(id: string): Promise<AnnotationOntology | null> {
    return this.ontologies.get(id) || null;
  }

  async getAllOntologies(): Promise<AnnotationOntology[]> {
    return Array.from(this.ontologies.values());
  }

  async getTag(id: string): Promise<AnnotationTag | null> {
    return this.tags.get(id) || null;
  }

  async getTagsForOntology(ontologyId: string): Promise<AnnotationTag[]> {
    const tagIds = this.ontologyTags.get(ontologyId) || [];
    return tagIds
      .map(id => this.tags.get(id))
      .filter((tag): tag is AnnotationTag => tag !== undefined);
  }

  async updateOntology(
    id: string,
    name: string,
    description: string,
    category: AnnotationOntology['category'],
    permissions: AnnotationOntology['permissions'],
    tags: Array<{name: string, description: string, color: string, examples?: string[]}>
  ): Promise<AnnotationOntology> {
    const ontology = this.ontologies.get(id);
    if (!ontology) {
      throw new Error('Ontology not found');
    }

    // Update ontology metadata
    const updates = {
      name,
      description,
      category,
      permissions
    };

    await this.ontologiesFile.appendEvent({
      timestamp: new Date(),
      type: 'ontology_updated',
      data: { id, updates }
    });

    const updatedOntology = { ...ontology, ...updates };
    this.ontologies.set(id, updatedOntology);

    // Replace all tags (delete old, create new)
    const oldTags = await this.getTagsForOntology(id);
    for (const tag of oldTags) {
      await this.deleteTag(tag.id);
    }

    const newTagIds: string[] = [];
    for (const tagData of tags) {
      const tag = await this.createTag(id, tagData);
      newTagIds.push(tag.id);
    }
    
    this.ontologyTags.set(id, newTagIds);

    return updatedOntology;
  }

  async deleteTag(id: string): Promise<void> {
    const tag = this.tags.get(id);
    if (!tag) return;

    await this.tagsFile.appendEvent({
      timestamp: new Date(),
      type: 'tag_deleted',
      data: { id }
    });

    // Remove from reverse index
    const ontologyTagList = this.ontologyTags.get(tag.ontology_id) || [];
    this.ontologyTags.set(
      tag.ontology_id,
      ontologyTagList.filter(tid => tid !== id)
    );

    this.tags.delete(id);
  }

  async close(): Promise<void> {
    await this.ontologiesFile.close();
    await this.tagsFile.close();
  }
}

