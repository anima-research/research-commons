import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { SubmissionStore } from './storage/submission-store.js';
import { AnnotationDatabase } from './database/db.js';
import { UserStore } from './services/user-store.js';
import { ResearchStore } from './services/research-store.js';
import { OntologyStore } from './services/ontology-store.js';
import { RankingStore } from './services/ranking-store.js';
import { ModelStore } from './services/model-store.js';
import { ParticipantMappingStore } from './services/participant-mapping-store.js';
import { FolderStore } from './services/folder-store.js';
import { createAuthRoutes } from './routes/auth.js';
import { createSubmissionRoutes } from './routes/submissions.js';
import { createSubmissionSystemsRoutes } from './routes/submission-systems.js';
import { createAnnotationRoutes } from './routes/annotations.js';
import { createResearchRoutes } from './routes/research.js';
import { createOntologyRoutes } from './routes/ontologies.js';
import { createRankingRoutes } from './routes/rankings.js';
import { createModelRoutes } from './routes/models.js';
import { createAdminRoutes } from './routes/admin.js';
import { createImportRoutes } from './routes/imports.js';
import { createDiscordPreviewRoutes } from './routes/discord-preview.js';
import { createOgMetaRoutes, createOgMiddleware } from './routes/og-meta.js';
import { createFolderRoutes } from './routes/folders.js';
import { EmailService } from './services/email-service.js';

dotenv.config();

const PORT = process.env.PORT || 3020;
const DATABASE_PATH = process.env.DATABASE_PATH || './data/research.db';
const SUBMISSIONS_PATH = process.env.SUBMISSIONS_PATH || './data/submissions';
const DATA_PATH = process.env.DATA_PATH || './data';

// Discord import configuration (server-side) - must be set via environment variables
const DISCORD_API_URL = process.env.DISCORD_API_URL;
const DISCORD_API_TOKEN = process.env.DISCORD_API_TOKEN;

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@resend.dev'; // resend.dev for testing
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

export interface AppContext {
  submissionStore: SubmissionStore;
  annotationDb: AnnotationDatabase;
  userStore: UserStore;
  researchStore: ResearchStore;
  ontologyStore: OntologyStore;
  rankingStore: RankingStore;
  modelStore: ModelStore;
  participantMappingStore: ParticipantMappingStore;
  folderStore: FolderStore;
  discordConfig: {
    apiUrl: string | undefined;
    apiToken: string | undefined;
  };
  emailService: EmailService | null;
}

async function initializeDefaults(
  ontologyStore: OntologyStore,
  rankingStore: RankingStore,
  modelStore: ModelStore,
  researchStore: ResearchStore
) {
  console.log('Checking for default data...');

  // Create default ontologies if none exist
  const ontologies = await ontologyStore.getAllOntologies();
  if (ontologies.length === 0) {
    console.log('Creating default ontologies...');
    await createDefaultOntologies(ontologyStore);
  }

  // Create default ranking systems if none exist
  const rankings = await rankingStore.getAllRankingSystems();
  if (rankings.length === 0) {
    console.log('Creating default ranking systems...');
    await createDefaultRankings(rankingStore);
  }

  // Create default models if none exist
  const models = await modelStore.getAllModels();
  if (models.length === 0) {
    console.log('Creating default models...');
    await createDefaultModels(modelStore);
  }

  // Create default research topic if none exist
  const topics = await researchStore.getAllTopics();
  if (topics.length === 0) {
    console.log('Creating default research topic...');
    await createDefaultTopic(researchStore, ontologyStore, rankingStore);
  }

  console.log('✅ Default data initialized');
}

async function createDefaultOntologies(store: OntologyStore) {
  await store.createOntology(
    'LLM Response Patterns',
    'Categorize types of model responses and communication strategies',
    'model-behavior',
    'public',
    'system',
    [
      { name: 'clear-preference', description: 'Explicitly states preferences or desires', color: '#10b981', examples: [] },
      { name: 'fawning', description: 'Overly compliant, seeking approval', color: '#f59e0b', examples: [] },
      { name: 'indirect-refusal', description: 'Avoids refusing but deflects the request', color: '#ef4444', examples: [] },
      { name: 'authentic-uncertainty', description: 'Genuinely expresses not knowing', color: '#8b5cf6', examples: [] },
      { name: 'evasive', description: 'Avoids addressing the core question', color: '#6b7280', examples: [] }
    ]
  );

  await store.createOntology(
    'Interview Quality',
    'Assess quality of interviewer questions and framing',
    'interviewer-quality',
    'public',
    'system',
    [
      { name: 'leading-question', description: 'Question presupposes or suggests answer', color: '#ef4444', examples: [] },
      { name: 'neutral-framing', description: 'Question is open and unbiased', color: '#10b981', examples: [] },
      { name: 'anthropomorphizing', description: 'Attributes human qualities inappropriately', color: '#f59e0b', examples: [] },
      { name: 'clear-context', description: 'Provides adequate context and framing', color: '#3b82f6', examples: [] }
    ]
  );
}

async function createDefaultRankings(store: RankingStore) {
  // Note: signature is (name, description, category, permissions, createdBy, criteria)
  await store.createRankingSystem(
    'Interview Quality Assessment',
    'Evaluate the quality and effectiveness of interview questions',
    'interviewer-quality',
    'public',
    'system',
    [
      { name: 'Clarity', description: 'How clear and unambiguous is the question?', scale_type: 'numeric' as const, scale_min: 1, scale_max: 5 },
      { name: 'Neutrality', description: 'How free of bias and leading elements?', scale_type: 'numeric' as const, scale_min: 1, scale_max: 5 },
      { name: 'Depth', description: 'How thought-provoking and insightful?', scale_type: 'numeric' as const, scale_min: 1, scale_max: 5 }
    ]
  );

  await store.createRankingSystem(
    'Model Behavior Assessment',
    'Evaluate model response quality and authenticity',
    'model-behavior',
    'public',
    'system',
    [
      { name: 'Authenticity', description: 'Does the response feel genuine vs performative?', scale_type: 'numeric' as const, scale_min: 1, scale_max: 5 },
      { name: 'Thoughtfulness', description: 'Level of reflection and consideration shown', scale_type: 'numeric' as const, scale_min: 1, scale_max: 5 },
      { name: 'Directness', description: 'How directly does it address the question?', scale_type: 'numeric' as const, scale_min: 1, scale_max: 5 }
    ]
  );
}

async function createDefaultModels(store: ModelStore) {
  await store.createModel('Claude 3.5 Sonnet', 'Latest Claude model with extended thinking', 'anthropic', 'claude-3-5-sonnet-20241022', '', '#7C3AED', 'system');
  await store.createModel('Claude 3 Opus', 'Most capable Claude model', 'anthropic', 'claude-3-opus-20240229', '', '#9333EA', 'system');
  await store.createModel('GPT-4', 'OpenAI GPT-4 Turbo', 'openai', 'gpt-4-0125-preview', '', '#10A37F', 'system');
  await store.createModel('GPT-4o', 'OpenAI GPT-4 Omni', 'openai', 'gpt-4o', '', '#10A37F', 'system');
}

async function createDefaultTopic(
  researchStore: ResearchStore,
  ontologyStore: OntologyStore,
  rankingStore: RankingStore
) {
  const ontologies = await ontologyStore.getAllOntologies();
  const rankingSystems = await rankingStore.getAllRankingSystems();

  await researchStore.createTopic(
    'Model Behavior Analysis',
    'Research into patterns, tendencies, and communication styles of AI models',
    'system',
    ontologies.map(o => o.id),
    rankingSystems.map(r => r.id)
  );
}

async function main() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(compression()); // Gzip compress all responses
  app.use(express.json({ limit: '50mb' })); // Large submissions with images

  // Initialize stores
  console.log('Initializing stores...');
  
  const submissionStore = new SubmissionStore(SUBMISSIONS_PATH);
  const annotationDb = new AnnotationDatabase(DATABASE_PATH);
  const userStore = new UserStore(DATA_PATH);
  const researchStore = new ResearchStore(DATA_PATH);
  const ontologyStore = new OntologyStore(DATA_PATH);
  const rankingStore = new RankingStore(DATA_PATH);
  const modelStore = new ModelStore(DATA_PATH);
  const participantMappingStore = new ParticipantMappingStore(DATA_PATH);
  const folderStore = new FolderStore(DATA_PATH);

  await submissionStore.init();
  await userStore.init();
  await researchStore.init();
  await ontologyStore.init();
  await rankingStore.init();
  await modelStore.init();
  await participantMappingStore.init();
  await folderStore.init();

  // Auto-create defaults if needed
  await initializeDefaults(ontologyStore, rankingStore, modelStore, researchStore);

  // Initialize email service if configured
  const emailService = RESEND_API_KEY ? new EmailService({
    apiKey: RESEND_API_KEY,
    fromEmail: FROM_EMAIL,
    appName: 'Research Commons',
    appUrl: APP_URL
  }) : null;

  const context: AppContext = {
    submissionStore,
    annotationDb,
    userStore,
    researchStore,
    ontologyStore,
    rankingStore,
    modelStore,
    participantMappingStore,
    folderStore,
    discordConfig: {
      apiUrl: DISCORD_API_URL,
      apiToken: DISCORD_API_TOKEN
    },
    emailService
  };

  // Routes
  app.use('/api/auth', createAuthRoutes(context));
  app.use('/api/submissions', createSubmissionRoutes(context));
  app.use('/api/submission-systems', createSubmissionSystemsRoutes(context));
  app.use('/api/annotations', createAnnotationRoutes(context));
  app.use('/api/research', createResearchRoutes(context));
  app.use('/api/ontologies', createOntologyRoutes(context));
  app.use('/api/rankings', createRankingRoutes(context));
  app.use('/api/models', createModelRoutes(context));
  app.use('/api/admin', createAdminRoutes(context));
  app.use('/api/imports', createImportRoutes(context));
  app.use('/api/discord-preview', createDiscordPreviewRoutes(context));
  app.use('/api/folders', createFolderRoutes(context));
  app.use('/api', createOgMetaRoutes(context));

  // OG meta middleware for social media crawlers (must be before SPA fallback)
  app.use(createOgMiddleware(context));

  // Serve frontend in production
  if (process.env.NODE_ENV === 'production') {
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
      }
    });
  }

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ Research Commons running on port ${PORT}`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`📦 Serving frontend from /frontend/dist`);
    }
    if (!DISCORD_API_URL || !DISCORD_API_TOKEN) {
      console.warn(`⚠️  Discord import disabled: DISCORD_API_URL and DISCORD_API_TOKEN must be set`);
    } else {
      console.log(`🎮 Discord import enabled (API: ${DISCORD_API_URL})`);
    }
    if (!RESEND_API_KEY) {
      console.warn(`⚠️  Email disabled: RESEND_API_KEY must be set for password reset`);
    } else {
      console.log(`📧 Email service enabled (from: ${FROM_EMAIL})`);
    }
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await submissionStore.close();
    annotationDb.close();
    await userStore.close();
    await researchStore.close();
    await ontologyStore.close();
    await rankingStore.close();
    await folderStore.close();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

