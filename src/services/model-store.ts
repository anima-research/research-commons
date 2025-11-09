import { v4 as uuidv4 } from 'uuid';
import { EventStore } from '../storage/event-store.js';
import { Model } from '../types/model.js';

/**
 * Manages model registry (event-sourced)
 */
export class ModelStore {
  private modelsFile: EventStore;
  private models: Map<string, Model> = new Map();

  constructor(dataPath: string) {
    this.modelsFile = new EventStore(`${dataPath}/models.jsonl`);
  }

  async init(): Promise<void> {
    await this.modelsFile.init();

    // Load models
    const events = await this.modelsFile.loadEvents();
    for (const event of events) {
      if (event.type === 'model_created') {
        const model = {
          ...event.data,
          created_at: new Date(event.data.created_at)
        };
        this.models.set(model.id, model);
      } else if (event.type === 'model_updated') {
        const existing = this.models.get(event.data.id);
        if (existing) {
          this.models.set(event.data.id, {
            ...existing,
            ...event.data.updates
          });
        }
      } else if (event.type === 'model_deleted') {
        this.models.delete(event.data.id);
      }
    }
  }

  async createModel(
    name: string,
    description: string,
    provider: Model['provider'],
    modelId: string,
    avatar: string,
    color: string,
    createdBy: string
  ): Promise<Model> {
    const model: Model = {
      id: uuidv4(),
      name,
      description,
      provider,
      model_id: modelId,
      avatar,
      color,
      created_by: createdBy,
      created_at: new Date()
    };

    await this.modelsFile.appendEvent({
      timestamp: new Date(),
      type: 'model_created',
      data: model
    });

    this.models.set(model.id, model);
    return model;
  }

  async updateModel(
    id: string,
    updates: Partial<Pick<Model, 'name' | 'description' | 'provider' | 'model_id' | 'avatar' | 'color'>>
  ): Promise<Model> {
    const model = this.models.get(id);
    if (!model) {
      throw new Error('Model not found');
    }

    await this.modelsFile.appendEvent({
      timestamp: new Date(),
      type: 'model_updated',
      data: { id, updates }
    });

    const updated = { ...model, ...updates };
    this.models.set(id, updated);
    return updated;
  }

  async deleteModel(id: string): Promise<void> {
    await this.modelsFile.appendEvent({
      timestamp: new Date(),
      type: 'model_deleted',
      data: { id }
    });

    this.models.delete(id);
  }

  async getModel(id: string): Promise<Model | null> {
    return this.models.get(id) || null;
  }

  async getAllModels(): Promise<Model[]> {
    return Array.from(this.models.values());
  }

  async close(): Promise<void> {
    await this.modelsFile.close();
  }
}

