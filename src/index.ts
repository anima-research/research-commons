import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SubmissionStore } from './storage/submission-store.js';
import { AnnotationDatabase } from './database/db.js';
import { UserStore } from './services/user-store.js';
import { ResearchStore } from './services/research-store.js';
import { OntologyStore } from './services/ontology-store.js';
import { RankingStore } from './services/ranking-store.js';
import { ModelStore } from './services/model-store.js';
import { createAuthRoutes } from './routes/auth.js';
import { createSubmissionRoutes } from './routes/submissions.js';
import { createSubmissionSystemsRoutes } from './routes/submission-systems.js';
import { createAnnotationRoutes } from './routes/annotations.js';
import { createResearchRoutes } from './routes/research.js';
import { createOntologyRoutes } from './routes/ontologies.js';
import { createRankingRoutes } from './routes/rankings.js';
import { createModelRoutes } from './routes/models.js';

dotenv.config();

const PORT = process.env.PORT || 3020;
const DATABASE_PATH = process.env.DATABASE_PATH || './data/research.db';
const SUBMISSIONS_PATH = process.env.SUBMISSIONS_PATH || './data/submissions';
const DATA_PATH = process.env.DATA_PATH || './data';

export interface AppContext {
  submissionStore: SubmissionStore;
  annotationDb: AnnotationDatabase;
  userStore: UserStore;
  researchStore: ResearchStore;
  ontologyStore: OntologyStore;
  rankingStore: RankingStore;
  modelStore: ModelStore;
}

async function main() {
  const app = express();

  // Middleware
  app.use(cors());
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

  await submissionStore.init();
  await userStore.init();
  await researchStore.init();
  await ontologyStore.init();
  await rankingStore.init();
  await modelStore.init();

  const context: AppContext = {
    submissionStore,
    annotationDb,
    userStore,
    researchStore,
    ontologyStore,
    rankingStore,
    modelStore
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
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

