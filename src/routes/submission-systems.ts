import { Router } from 'express';
import { AppContext } from '../index.js';

/**
 * Get all ontologies and ranking systems available for a submission
 * Combines: topic-derived (dynamic lookup) + explicitly attached
 */
export function createSubmissionSystemsRoutes(context: AppContext): Router {
  const router = Router();

  // Get combined ontologies for submission
  router.get('/:submissionId/ontologies', async (req, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const result: Array<{
        ontology_id: string
        source: 'topic' | 'explicit'
        topic_name?: string
        usage_permissions: string
        can_detach: boolean
      }> = [];

      // Get ontologies from topics (dynamic lookup)
      const topicTags = submission.metadata.tags || [];
      const allTopics = await context.researchStore.getAllTopics();
      const relevantTopics = allTopics.filter(t => topicTags.includes(t.name));
      
      const seenOntologies = new Set<string>();
      
      for (const topic of relevantTopics) {
        const ontologies = topic.default_ontologies || [];
        for (const ontologyId of ontologies) {
          if (!seenOntologies.has(ontologyId)) {
            result.push({
              ontology_id: ontologyId,
              source: 'topic',
              topic_name: topic.name,
              usage_permissions: 'anyone',
              can_detach: false  // Cannot remove topic-derived
            });
            seenOntologies.add(ontologyId);
          }
        }
      }

      // Add explicitly attached ontologies
      const explicitlyAttached = context.annotationDb.getSubmissionOntologies(req.params.submissionId);
      for (const attached of explicitlyAttached) {
        if (!seenOntologies.has(attached.ontology_id)) {
          result.push({
            ontology_id: attached.ontology_id,
            source: 'explicit',
            usage_permissions: attached.usage_permissions,
            can_detach: true
          });
        }
      }

      res.json({ ontologies: result });
    } catch (error) {
      console.error('Get submission ontologies error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get combined ranking systems for submission
  router.get('/:submissionId/ranking-systems', async (req, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const result: Array<{
        ranking_system_id: string
        source: 'topic' | 'explicit'
        topic_name?: string
        usage_permissions: string
        can_detach: boolean
      }> = [];

      // Get ranking systems from topics (dynamic lookup)
      const topicTags = submission.metadata.tags || [];
      const allTopics = await context.researchStore.getAllTopics();
      const relevantTopics = allTopics.filter(t => topicTags.includes(t.name));
      
      const seenSystems = new Set<string>();
      
      for (const topic of relevantTopics) {
        const systems = topic.default_ranking_systems || [];
        for (const systemId of systems) {
          if (!seenSystems.has(systemId)) {
            result.push({
              ranking_system_id: systemId,
              source: 'topic',
              topic_name: topic.name,
              usage_permissions: 'anyone',
              can_detach: false  // Cannot remove topic-derived
            });
            seenSystems.add(systemId);
          }
        }
      }

      // Add explicitly attached ranking systems
      const explicitlyAttached = context.annotationDb.getSubmissionRankingSystems(req.params.submissionId);
      for (const attached of explicitlyAttached) {
        if (!seenSystems.has(attached.ranking_system_id)) {
          result.push({
            ranking_system_id: attached.ranking_system_id,
            source: 'explicit',
            usage_permissions: attached.usage_permissions,
            can_detach: true
          });
        }
      }

      res.json({ ranking_systems: result });
    } catch (error) {
      console.error('Get submission ranking systems error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

