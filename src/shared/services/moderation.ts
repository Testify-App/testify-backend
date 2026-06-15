import axios from 'axios';
import Env from '../utils/env';
import logger from './logger';

export interface ContentFlags {
  is_sensitive: boolean;
  flagged_at: string;
  categories: string[];
  scores: Record<string, number>;
  source: 'openai_moderation';
}

const CATEGORY_MAP: Record<string, string> = {
  sexual: 'sexual',
  'sexual/minors': 'sexual_minors',
  violence: 'violence',
  'violence/graphic': 'violence_graphic',
  hate: 'hate',
  'hate/threatening': 'hate_threatening',
  harassment: 'harassment',
  'harassment/threatening': 'harassment_threatening',
  'self-harm': 'self_harm',
  'self-harm/intent': 'self_harm_intent',
  'self-harm/instructions': 'self_harm_instructions',
};

export async function classifyContent(content: string): Promise<ContentFlags | null> {
  try {
    const apiKey = Env.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      logger.error('OPENAI_API_KEY not set — skipping moderation', 'moderation.ts');
      return null;
    }

    const { data } = await axios.post(
      'https://api.openai.com/v1/moderations',
      { input: content },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
    );

    const result = data.results[0];
    const flaggedCategories = Object.entries(result.categories as Record<string, boolean>)
      .filter(([, flagged]) => flagged)
      .map(([cat]) => CATEGORY_MAP[cat] ?? cat);

    const scores: Record<string, number> = {};
    for (const [cat, score] of Object.entries(result.category_scores as Record<string, number>)) {
      scores[CATEGORY_MAP[cat] ?? cat] = Math.round(score * 1000) / 1000;
    }

    return {
      is_sensitive: result.flagged,
      flagged_at: new Date().toISOString(),
      categories: flaggedCategories,
      scores,
      source: 'openai_moderation',
    };
  } catch (error: any) {
    logger.error(`Content moderation failed: ${error.message}`, 'moderation.ts');
    return null;
  }
}
