#!/usr/bin/env node

/**
 * Create a default research topic for testing
 */

import { ResearchStore } from './src/services/research-store.js';
import { OntologyStore } from './src/services/ontology-store.js';
import { RankingStore } from './src/services/ranking-store.js';

const DATA_PATH = './data';

async function main() {
  console.log('Creating default research topic...');
  
  const researchStore = new ResearchStore(DATA_PATH);
  const ontologyStore = new OntologyStore(DATA_PATH);
  const rankingStore = new RankingStore(DATA_PATH);
  
  await researchStore.init();
  await ontologyStore.init();
  await rankingStore.init();

  // Check if topic already exists
  const existingTopics = await researchStore.getAllTopics();
  if (existingTopics.length > 0) {
    console.log('Topics already exist, skipping...');
    await researchStore.close();
    await ontologyStore.close();
    await rankingStore.close();
    return;
  }

  // Get ontology and ranking system IDs
  const ontologies = await ontologyStore.getAllOntologies();
  const rankingSystems = await rankingStore.getAllRankingSystems();

  // Create Model Behavior Analysis topic
  const topic = await researchStore.createTopic(
    'Model Behavior Analysis',
    'Research into patterns, tendencies, and communication styles of AI models',
    'system',
    ontologies.map(o => o.id),
    rankingSystems.map(r => r.id)
  );
  
  console.log('✅ Created:', topic.name);
  console.log('   Ontologies:', ontologies.length);
  console.log('   Ranking Systems:', rankingSystems.length);

  await researchStore.close();
  await ontologyStore.close();
  await rankingStore.close();
  
  console.log('\n✅ Default topic created');
}

main().catch(console.error);

