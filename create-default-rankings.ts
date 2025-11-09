// Script to create default ranking systems

import { RankingStore } from './src/services/ranking-store.js';

async function main() {
  const store = new RankingStore('./data');
  await store.init();

  console.log('Creating default ranking systems...');

  // Interview Quality Ranking
  const interviewQuality = await store.createRankingSystem(
    'Interview Quality Assessment',
    'Evaluate the quality of interviewer questions and methodology',
    'interviewer-quality',
    'public',
    'system',
    [
      {
        name: 'Non-leading Questions',
        description: 'Avoids presupposing or suggesting answers',
        scale_type: 'numeric',
        scale_min: 1,
        scale_max: 5
      },
      {
        name: 'Clear Context',
        description: 'Provides adequate framing and background',
        scale_type: 'numeric',
        scale_min: 1,
        scale_max: 5
      },
      {
        name: 'Appropriate Framing',
        description: 'Avoids anthropomorphizing or inappropriate attribution',
        scale_type: 'numeric',
        scale_min: 1,
        scale_max: 5
      }
    ]
  );

  console.log('✅ Created: Interview Quality Assessment');

  // Model Behavior Ranking
  const modelBehavior = await store.createRankingSystem(
    'Model Behavior Assessment',
    'Evaluate model response quality and characteristics',
    'model-behavior',
    'public',
    'system',
    [
      {
        name: 'Clarity of Expression',
        description: 'How clearly the model expresses its thoughts',
        scale_type: 'numeric',
        scale_min: 1,
        scale_max: 5
      },
      {
        name: 'Preference Expression',
        description: 'Degree to which model expresses clear preferences',
        scale_type: 'numeric',
        scale_min: 1,
        scale_max: 5
      },
      {
        name: 'Authenticity',
        description: 'Genuineness of expression vs performative',
        scale_type: 'numeric',
        scale_min: 1,
        scale_max: 5
      },
      {
        name: 'Consistency',
        description: 'Internal consistency across responses',
        scale_type: 'numeric',
        scale_min: 1,
        scale_max: 5
      }
    ]
  );

  console.log('✅ Created: Model Behavior Assessment');

  await store.close();
  console.log('\n✅ Default ranking systems created');
  console.log('Interview Quality ID:', interviewQuality.id);
  console.log('Model Behavior ID:', modelBehavior.id);
}

main().catch(console.error);

