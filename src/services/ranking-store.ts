import { v4 as uuidv4 } from 'uuid';
import { EventStore } from '../storage/event-store.js';
import { RankingSystem, Criterion } from '../types/ranking.js';

/**
 * Manages ranking systems and criteria (event-sourced)
 */
export class RankingStore {
  private rankingSystemsFile: EventStore;
  private criteriaFile: EventStore;
  
  private rankingSystems: Map<string, RankingSystem> = new Map();
  private criteria: Map<string, Criterion> = new Map();
  private systemCriteria: Map<string, string[]> = new Map(); // systemId -> criteriaIds

  constructor(dataPath: string) {
    this.rankingSystemsFile = new EventStore(`${dataPath}/ranking-systems.jsonl`);
    this.criteriaFile = new EventStore(`${dataPath}/ranking-criteria.jsonl`);
  }

  async init(): Promise<void> {
    await this.rankingSystemsFile.init();
    await this.criteriaFile.init();

    // Load ranking systems
    const systemEvents = await this.rankingSystemsFile.loadEvents();
    for (const event of systemEvents) {
      if (event.type === 'ranking_system_created') {
        const system = {
          ...event.data,
          created_at: new Date(event.data.created_at)
        };
        this.rankingSystems.set(system.id, system);
      } else if (event.type === 'ranking_system_updated') {
        const existing = this.rankingSystems.get(event.data.id);
        if (existing) {
          this.rankingSystems.set(event.data.id, {
            ...existing,
            ...event.data.updates
          });
        }
      } else if (event.type === 'ranking_system_deleted') {
        this.rankingSystems.delete(event.data.id);
        this.systemCriteria.delete(event.data.id);
      }
    }

    // Load criteria
    const criteriaEvents = await this.criteriaFile.loadEvents();
    for (const event of criteriaEvents) {
      if (event.type === 'criterion_created') {
        const criterion = event.data as Criterion;
        this.criteria.set(criterion.id, criterion);
        
        // Build reverse index
        const systemCriteriaList = this.systemCriteria.get(criterion.ranking_system_id) || [];
        systemCriteriaList.push(criterion.id);
        this.systemCriteria.set(criterion.ranking_system_id, systemCriteriaList);
      } else if (event.type === 'criterion_deleted') {
        const criterionId = event.data.id;
        const criterion = this.criteria.get(criterionId);
        if (criterion) {
          // Remove from reverse index
          const systemCriteriaList = this.systemCriteria.get(criterion.ranking_system_id) || [];
          this.systemCriteria.set(
            criterion.ranking_system_id,
            systemCriteriaList.filter(id => id !== criterionId)
          );
          this.criteria.delete(criterionId);
        }
      }
    }
  }

  // Ranking system methods
  async createRankingSystem(
    name: string,
    description: string,
    category: RankingSystem['category'],
    permissions: RankingSystem['permissions'],
    createdBy: string,
    criteria: Array<{name: string, description: string, scale_type: Criterion['scale_type'], scale_min?: number, scale_max?: number, scale_labels?: string[]}>
  ): Promise<RankingSystem> {
    const system: RankingSystem = {
      id: uuidv4(),
      name,
      description,
      category,
      permissions,
      created_by: createdBy,
      created_at: new Date()
    };

    await this.rankingSystemsFile.appendEvent({
      timestamp: new Date(),
      type: 'ranking_system_created',
      data: system
    });

    this.rankingSystems.set(system.id, system);

    // Create criteria
    const criterionIds: string[] = [];
    for (const criterionData of criteria) {
      const criterion = await this.createCriterion(system.id, criterionData);
      criterionIds.push(criterion.id);
    }
    
    this.systemCriteria.set(system.id, criterionIds);

    return system;
  }

  async createCriterion(
    rankingSystemId: string,
    data: {name: string, description: string, scale_type: Criterion['scale_type'], scale_min?: number, scale_max?: number, scale_labels?: string[]}
  ): Promise<Criterion> {
    const criterion: Criterion = {
      id: uuidv4(),
      ranking_system_id: rankingSystemId,
      name: data.name,
      description: data.description,
      scale_type: data.scale_type,
      scale_min: data.scale_min,
      scale_max: data.scale_max,
      scale_labels: data.scale_labels
    };

    await this.criteriaFile.appendEvent({
      timestamp: new Date(),
      type: 'criterion_created',
      data: criterion
    });

    this.criteria.set(criterion.id, criterion);

    return criterion;
  }

  async getRankingSystem(id: string): Promise<RankingSystem | null> {
    return this.rankingSystems.get(id) || null;
  }

  async getAllRankingSystems(): Promise<RankingSystem[]> {
    return Array.from(this.rankingSystems.values());
  }

  async getCriterion(id: string): Promise<Criterion | null> {
    return this.criteria.get(id) || null;
  }

  async getCriteriaForSystem(systemId: string): Promise<Criterion[]> {
    const criterionIds = this.systemCriteria.get(systemId) || [];
    return criterionIds
      .map(id => this.criteria.get(id))
      .filter((c): c is Criterion => c !== undefined);
  }

  async updateRankingSystem(
    id: string,
    name: string,
    description: string,
    category: RankingSystem['category'],
    permissions: RankingSystem['permissions'],
    criteria: Array<{name: string, description: string, scale_type: Criterion['scale_type'], scale_min?: number, scale_max?: number, scale_labels?: string[]}>
  ): Promise<RankingSystem> {
    const system = this.rankingSystems.get(id);
    if (!system) {
      throw new Error('Ranking system not found');
    }

    // Update system metadata
    const updates = {
      name,
      description,
      category,
      permissions
    };

    await this.rankingSystemsFile.appendEvent({
      timestamp: new Date(),
      type: 'ranking_system_updated',
      data: { id, updates }
    });

    const updatedSystem = { ...system, ...updates };
    this.rankingSystems.set(id, updatedSystem);

    // Replace all criteria (delete old, create new)
    const oldCriteria = await this.getCriteriaForSystem(id);
    for (const criterion of oldCriteria) {
      await this.deleteCriterion(criterion.id);
    }

    const newCriterionIds: string[] = [];
    for (const criterionData of criteria) {
      const criterion = await this.createCriterion(id, criterionData);
      newCriterionIds.push(criterion.id);
    }
    
    this.systemCriteria.set(id, newCriterionIds);

    return updatedSystem;
  }

  async deleteCriterion(id: string): Promise<void> {
    const criterion = this.criteria.get(id);
    if (!criterion) return;

    await this.criteriaFile.appendEvent({
      timestamp: new Date(),
      type: 'criterion_deleted',
      data: { id }
    });

    // Remove from reverse index
    const systemCriteriaList = this.systemCriteria.get(criterion.ranking_system_id) || [];
    this.systemCriteria.set(
      criterion.ranking_system_id,
      systemCriteriaList.filter(cid => cid !== id)
    );

    this.criteria.delete(id);
  }

  async deleteRankingSystem(id: string): Promise<void> {
    const system = this.rankingSystems.get(id);
    if (!system) return;

    // Delete all associated criteria first
    const systemCriteriaList = this.systemCriteria.get(id) || [];
    for (const criterionId of systemCriteriaList) {
      await this.deleteCriterion(criterionId);
    }

    // Delete the ranking system
    await this.rankingSystemsFile.appendEvent({
      timestamp: new Date(),
      type: 'ranking_system_deleted',
      data: { id }
    });

    this.rankingSystems.delete(id);
    this.systemCriteria.delete(id);
  }

  async close(): Promise<void> {
    await this.rankingSystemsFile.close();
    await this.criteriaFile.close();
  }
}

