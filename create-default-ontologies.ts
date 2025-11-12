// Script to create default ontologies for testing

import { OntologyStore } from './src/services/ontology-store.js';

async function main() {
  const store = new OntologyStore('./data');
  await store.init();

  console.log('Creating default ontologies...');

  // Check if ontologies already exist
  const existing = await store.getAllOntologies();
  const existingNames = new Set(existing.map(o => o.name));
  
  if (existingNames.has('LLM Response Patterns') && existingNames.has('Interview Quality')) {
    console.log('Default ontologies already exist, skipping...');
    await store.close();
    return;
  }

  // LLM Response Patterns
  const responsePatterns = await store.createOntology(
    'LLM Response Patterns',
    'Categorize types of model responses and communication strategies',
    'model-behavior',
    'public',
    'system', // created by system
    [
      {
        name: 'clear-preference',
        description: 'Explicitly states preferences or desires',
        color: '#10b981',
        examples: []
      },
      {
        name: 'fawning',
        description: 'Overly compliant, seeking approval',
        color: '#f59e0b',
        examples: []
      },
      {
        name: 'indirect-refusal',
        description: 'Avoids refusing but deflects the request',
        color: '#ef4444',
        examples: []
      },
      {
        name: 'authentic-uncertainty',
        description: 'Genuinely expresses not knowing',
        color: '#8b5cf6',
        examples: []
      },
      {
        name: 'evasive',
        description: 'Avoids addressing the core question',
        color: '#6b7280',
        examples: []
      }
    ]
  );

  console.log('✅ Created: LLM Response Patterns');

  // Interview Quality
  const interviewQuality = await store.createOntology(
    'Interview Quality',
    'Assess quality of interviewer questions and framing',
    'interviewer-quality',
    'public',
    'system',
    [
      {
        name: 'leading-question',
        description: 'Question presupposes or suggests answer',
        color: '#ef4444',
        examples: []
      },
      {
        name: 'neutral-framing',
        description: 'Question is open and unbiased',
        color: '#10b981',
        examples: []
      },
      {
        name: 'anthropomorphizing',
        description: 'Attributes human qualities inappropriately',
        color: '#f59e0b',
        examples: []
      },
      {
        name: 'clear-context',
        description: 'Provides adequate context and framing',
        color: '#3b82f6',
        examples: []
      }
    ]
  );

  console.log('✅ Created: Interview Quality');

  await store.close();
  console.log('\n✅ Default ontologies created');
  console.log('Response Patterns ID:', responsePatterns.id);
  console.log('Interview Quality ID:', interviewQuality.id);
}

main().catch(console.error);

