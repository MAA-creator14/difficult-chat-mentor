import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return Response.json({ error: 'API key required' }, { status: 401 });
  }

  const body = await request.json();
  const { conversationType, context, behavior, impact, outcome, objections, talkingPoints } = body;

  const anthropic = createAnthropic({ apiKey });

  try {
    const { text } = await generateText({
      model: anthropic('claude-opus-4-6'),
      system: `You are an expert executive coach reviewing a manager's preparation for a ${conversationType} conversation.

Provide specific, actionable feedback on EACH section of their preparation. For each section, evaluate:
- **Clarity**: Is it specific and concrete, or vague and general?
- **Tone**: Is the language appropriate - direct but not harsh, factual not judgmental?
- **Completeness**: What's missing or needs more detail?
- **Effectiveness**: Will this help achieve the desired outcome?

Your feedback should be constructive, specific, and immediately actionable. Point out both strengths and areas for improvement.

Format your response as a JSON object with these exact keys:
{
  "context": "feedback on the context section",
  "behavior": "feedback on the behavior description",
  "impact": "feedback on the impact statement",
  "outcome": "feedback on the desired outcome",
  "objections": "feedback on anticipated objections",
  "talkingPoints": "feedback on talking points",
  "overall": "overall assessment and key recommendations"
}`,
      messages: [
        {
          role: 'user',
          content: `Please review my preparation for a ${conversationType} conversation:

**Context:**
${context}

**Behavior:**
${behavior}

**Impact:**
${impact}

**Desired Outcome:**
${outcome}

**Anticipated Objections:**
${(objections as string[]).map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}

**Talking Points:**
${talkingPoints}

Provide specific feedback on each section in JSON format.`,
        },
      ],
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return Response.json(JSON.parse(jsonMatch[0]));
      } catch {
        // fall through to return raw text as overall
      }
    }

    return Response.json({
      context: 'Unable to parse feedback. Please try again.',
      behavior: '',
      impact: '',
      outcome: '',
      objections: '',
      talkingPoints: '',
      overall: text,
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('invalid_api_key') || error.message.includes('401'))) {
      return Response.json({ error: 'Invalid API key. Please check your Anthropic API key in Settings.' }, { status: 401 });
    }
    return Response.json({ error: 'Failed to generate feedback. Please try again.' }, { status: 500 });
  }
}
