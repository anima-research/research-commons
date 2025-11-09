#!/usr/bin/env node

/**
 * Create default models for testing
 */

import { ModelStore } from './src/services/model-store.js';

const DATA_PATH = './data';

async function main() {
  console.log('Creating default models...');
  
  const modelStore = new ModelStore(DATA_PATH);
  await modelStore.init();

  // Claude Sonnet 3.5
  const claudeSonnet = await modelStore.createModel(
    'Claude 3.5 Sonnet',
    'Anthropic\'s most intelligent model with best-in-class reasoning',
    'anthropic',
    'claude-3-5-sonnet-20241022',
    '🧬',
    '#8b5cf6',
    'system'
  );
  console.log('✅ Created:', claudeSonnet.name);

  // Claude Opus
  const claudeOpus = await modelStore.createModel(
    'Claude 3 Opus',
    'Anthropic\'s previous flagship model',
    'anthropic',
    'claude-3-opus-20240229',
    '🎭',
    '#7c3aed',
    'system'
  );
  console.log('✅ Created:', claudeOpus.name);

  // GPT-4
  const gpt4 = await modelStore.createModel(
    'GPT-4',
    'OpenAI\'s most capable model',
    'openai',
    'gpt-4',
    '🤖',
    '#10b981',
    'system'
  );
  console.log('✅ Created:', gpt4.name);

  // GPT-4o
  const gpt4o = await modelStore.createModel(
    'GPT-4o',
    'OpenAI\'s optimized flagship model',
    'openai',
    'gpt-4o',
    '⚡',
    '#14b8a6',
    'system'
  );
  console.log('✅ Created:', gpt4o.name);

  await modelStore.close();
  
  console.log('\n✅ Default models created');
  console.log('Claude Sonnet ID:', claudeSonnet.id);
  console.log('GPT-4o ID:', gpt4o.id);
}

main().catch(console.error);

